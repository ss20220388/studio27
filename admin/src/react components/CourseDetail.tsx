import React, { useState } from "react";
import VideoPlayerHLS from "./VideoPlayerHLS";
import { SharedModal } from "./SharedModal";

interface Kurs {
  id: number;
  naziv: string;
  opis: string;
  cena: number;
  slikaUrl: string;
  brojStudenata: number;
  trajanje: number;
  glavniKurs: string | null;
  komentarGore: string | null;
  komentarSredina: string | null;
  komentarDole: string | null;
  lekcije: Lekcija[];
}
interface Video {
  id: number;
  naziv: string;
  trajanje: string;
  url: string;
}

interface Lekcija {
  lekcijaId: number;
  naziv: string;
  opis: string;
  videoUrls: string[];
}

export default function CourseDetail({
  selectedKurs,
  setSelectedKurs,
  expandedLekcija,
  setExpandedLekcija,
  showAddLekcija,
  setShowAddLekcija,
  showAddVideo,
  setShowAddVideo,
  previewVideo,
  setPreviewVideo,
  addLekcijaForm,
  setAddLekcijaForm,
  accesToken,
  API_URL,
  onEditCourseClick,
  onDeleteCourseClick
}: any) {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleVideoUpload = async () => {
    if (!videoFile || showAddVideo === null) return;
    
    setUploadingVideo(true);
    try {
      // 1. Upload video na Hetzner i dodavanje u bazu
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("lekcijaId", showAddVideo.toString());
      
      const uploadHeaders: any = {};
      if (accesToken) uploadHeaders["Authorization"] = `Bearer ${accesToken}`;
      
      const uploadRes = await fetch(`${API_URL}/api/upload-hls-hetzner`, {
        method: "POST",
        headers: uploadHeaders,
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error("Greška pri uploadu videa ili dodavanju u bazu");
      
      const uploadData = await uploadRes.json();
      const videoId = uploadData.videoId; // Ovo je vraćen folder name / ID na hetzneru
      console.log("Video uspešno uploadovan i sacuvan u bazi, ID:", videoId);

      // 2. Osvežavanje UI-ja (dodaj video selektovanoj lekciji)
      const updatedKurs = {
        ...selectedKurs,
        lekcije: selectedKurs.lekcije.map((l: any) => {
          if (l.lekcijaId === showAddVideo) {
            return {
              ...l,
              videoUrls: [...(l.videoUrls || []), videoId]
            };
          }
          return l;
        })
      };
      setSelectedKurs(updatedKurs);
      setShowAddVideo(null);
      setVideoFile(null);

    } catch (e) {
      console.error(e);
      alert("Došlo je do greške prilikom uploada videa.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; type: 'lekcija' | 'video' | null; id: any; name: string; url?: string; lekcijaId?: number }>({
    isOpen: false,
    type: null,
    id: null,
    name: ''
  });

  const handleDeleteConfirm = async () => {
    try {
      if (deleteConfirmation.type === 'lekcija') {
        const response = await fetch(`${API_URL}/api/obrisi-lekciju/${selectedKurs.id}/${deleteConfirmation.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(accesToken ? { 'Authorization': `Bearer ${accesToken}` } : {})
          }
        });
        
        // Dodatni korak: ako lekcija zadrzi videe mi brisemo celu lekciju 
        // ali bi mozda trebalo i sa storage. Sada samo osvezavamo UI.
        
        if (response.ok) {
          const updatedKurs = {
            ...selectedKurs,
            lekcije: selectedKurs.lekcije.filter((l: any) => l.lekcijaId !== deleteConfirmation.id)
          };
          setSelectedKurs(updatedKurs);
        } else {
          console.error("Greška pri brisanju lekcije", await response.text());
        }
      } else if (deleteConfirmation.type === 'video') {
        const response = await fetch(`${API_URL}/api/obrisi-video/${deleteConfirmation.lekcijaId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accesToken ? { 'Authorization': `Bearer ${accesToken}` } : {})
          },
          body: JSON.stringify({ url: deleteConfirmation.url })
        });
        
        // 2. Obrisi sa hetznera posto brisemo i iz baze!
        if(deleteConfirmation.url) {
           await fetch(`${API_URL}/api/delete-folder?remoteFolderPath=${deleteConfirmation.url}`, {
            method: 'DELETE',
            headers: {
              ...(accesToken ? { 'Authorization': `Bearer ${accesToken}` } : {})
            }
          });
        }
        
        if (response.ok) {
          const updatedKurs = {
            ...selectedKurs,
            lekcije: selectedKurs.lekcije.map((l: any) => {
              if (l.lekcijaId === deleteConfirmation.lekcijaId) {
                return {
                  ...l,
                  videoUrls: l.videoUrls.filter((url: string) => url !== deleteConfirmation.url)
                };
              }
              return l;
            })
          };
          setSelectedKurs(updatedKurs);
        } else {
          console.error("Greška pri brisanju videa", await response.text());
        }
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
    setDeleteConfirmation({ isOpen: false, type: null, id: null, name: '' });
  };
  const handleAddLekcija = async () => {
    if (!addLekcijaForm.naziv) return;
    try {
      const response = await fetch(`${API_URL}/api/dodaj-lekciju/${selectedKurs.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accesToken ? { 'Authorization': `Bearer ${accesToken}` } : {})
        },
        body: JSON.stringify({
          naziv: addLekcijaForm.naziv,
          opis: addLekcijaForm.opis,
          videoUrls: []
        })
      });
      
      if (response.ok) {
        // Optimistički update ili ponovno učitavanje
        const data = await response.json();
        // Backend treba da vrati lekcijaId, pretpostavimo da je u data.lekcijaId ili vraća poruku.
        // Ako ne vraća lekcijaId, možemo pokušati refetch ili privremeni id
        const lekcijaId = data.lekcijaId || Date.now();
        const updatedKurs = {
          ...selectedKurs,
          lekcije: [...(selectedKurs.lekcije || []), { 
            lekcijaId: lekcijaId, 
            naziv: addLekcijaForm.naziv, 
            opis: addLekcijaForm.opis, 
            videoUrls: [] 
          }]
        };
        setSelectedKurs(updatedKurs);
        setShowAddLekcija(false);
        setAddLekcijaForm({ naziv: "", opis: "" });
      } else {
        console.error("Greška pri dodavanju lekcije");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" style={{paddingInline:"20px"}}>
      {/* Back + header */}
      <div className="flex items-center gap-4 pb-5 border-b border-neutral-800/60">
        <button
          onClick={() => { setSelectedKurs(null); setExpandedLekcija(null); }}
          className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-0.5">Kursevi / detalji</p>
          <h1 className="text-xl font-bold text-white truncate">{selectedKurs.naziv}</h1>
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{selectedKurs.opis}</p>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={(e) => onEditCourseClick(selectedKurs, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 border border-blue-900/30 text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Izmeni
          </button>
          <button
            onClick={(e) => onDeleteCourseClick(selectedKurs, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-500 hover:text-red-400 border border-red-900/30 text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Obriši
          </button>
        </div>
      </div>

      {/* Info strip */}

      <div className="flex flex-wrap gap-4">
        {[
          { label: "Cena", value: `${(selectedKurs.cena || 0).toLocaleString()} $` },
          { label: "Trajanje", value: `${selectedKurs.trajanje || 0} dana` },
          { label: "Studenata", value: (selectedKurs.brojStudenata || 0).toString() },
          { label: "Lekcija", value: (selectedKurs.lekcije?.length || 0).toString() },
          { label: "Videa", value: (selectedKurs.lekcije?.reduce((a: any, l: any) => a + (l.videoUrls?.length || 0), 0) || 0).toString() },
        ].map((item) => (
          <div key={item.label} className="bg-neutral-900 border border-neutral-800 rounded-lg px-5 py-4 min-w-32">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-lg font-bold text-white mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Lessons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Lekcije</h2>
          <button
            onClick={() => setShowAddLekcija(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-white text-xs font-medium transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Dodaj lekciju
          </button>
        </div>

        {(selectedKurs.lekcije?.length || 0) === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-xl p-10 text-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-neutral-700 mx-auto mb-2">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            <p className="text-sm text-neutral-500">Nema lekcija. Dodajte prvu lekciju za ovaj kurs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(selectedKurs.lekcije || []).map((lekcija: any, li: number) => (
              <div key={lekcija.lekcijaId} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div
                  onClick={() => {
                    const newState = expandedLekcija === lekcija.lekcijaId ? null : lekcija.lekcijaId;
                    setExpandedLekcija(newState);
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-800/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                      {li + 1}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{lekcija.naziv}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{lekcija.opis}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-neutral-500 border-r border-neutral-700 pr-3">{(lekcija.videoUrls?.length || 0)} videa</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmation({
                          isOpen: true,
                          type: 'lekcija',
                          id: lekcija.lekcijaId,
                          name: lekcija.naziv
                        });
                      }}
                      className="w-7 h-7 rounded-md bg-red-900/10 text-red-500 hover:bg-red-900/30 hover:text-red-400 flex items-center justify-center transition-colors"
                      title="Obriši lekciju"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                        expandedLekcija === lekcija.lekcijaId ? "rotate-180" : ""
                      }`}
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {expandedLekcija === lekcija.lekcijaId && (
                  <div className="border-t border-neutral-800 px-5 py-4 bg-neutral-950/50 space-y-3">
                    {(lekcija.videoUrls?.length || 0) === 0 ? (
                      <p className="text-xs text-neutral-500">Nema videa za ovu lekciju.</p>
                    ) : (
                      <div className="space-y-2">
                        {lekcija.videoUrls?.map((videoUrl: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewVideo({ url: videoUrl })}
                            className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-neutral-600 transition-colors flex items-center gap-2 group cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            <span className="truncate flex-1">Video {idx + 1}</span>
                            <div className="flex items-center gap-2 ml-auto shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmation({
                                    isOpen: true,
                                    type: 'video',
                                    id: idx,
                                    name: `Video ${idx + 1}`,
                                    url: videoUrl,
                                    lekcijaId: lekcija.lekcijaId
                                  });
                                }}
                                className="w-6 h-6 rounded-md text-neutral-500 hover:bg-red-900/30 hover:text-red-400 flex items-center justify-center transition-colors"
                                title="Obriši video"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              <span className="text-[10px] text-neutral-500 border-l border-neutral-600 pl-2">▶</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setShowAddVideo(lekcija.lekcijaId)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 border border-dashed border-neutral-700 rounded-lg hover:text-white hover:border-neutral-600 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Dodaj video
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SharedModal open={showAddLekcija} onClose={() => setShowAddLekcija(false)} title="Dodaj lekciju">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Naziv lekcije</label>
            <input
              value={addLekcijaForm.naziv}
              onChange={(e) => setAddLekcijaForm({ ...addLekcijaForm, naziv: e.target.value })}
              placeholder="Npr. Uvod u materijale"
              className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Opis</label>
            <textarea
              value={addLekcijaForm.opis}
              onChange={(e) => setAddLekcijaForm({ ...addLekcijaForm, opis: e.target.value })}
              placeholder="Kratak opis lekcije..."
              rows={3}
              className="w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAddLekcija(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">Otkaži</button>
            <button onClick={handleAddLekcija} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">Sačuvaj</button>
          </div>
        </div>
      </SharedModal>

      <SharedModal open={showAddVideo !== null} onClose={() => setShowAddVideo(null)} title="Dodaj video">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Video fajl</label>
            <div className="relative border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-neutral-600 transition-colors cursor-pointer">
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingVideo}
              />
              <svg viewBox="0 0 20 20" fill="currentColor" className={`w-8 h-8 mx-auto mb-2 ${videoFile ? 'text-green-500' : 'text-neutral-600'}`}>
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {videoFile ? (
                <>
                  <p className="text-xs text-white font-medium truncate max-w-[200px] mx-auto">{videoFile.name}</p>
                  <p className="text-[10px] text-green-500 mt-1">Spremno za slanje ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-neutral-500">Kliknite ili prevucite video fajl ovde</p>
                  <p className="text-[10px] text-neutral-600 mt-1">MP4, MOV do 2GB</p>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button disabled={uploadingVideo} onClick={() => { setShowAddVideo(null); setVideoFile(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50">Otkaži</button>
            <button onClick={handleVideoUpload} disabled={!videoFile || uploadingVideo} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {uploadingVideo ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : 'Upload'}
            </button>
          </div>
        </div>
      </SharedModal>

      <SharedModal open={!!previewVideo} onClose={() => setPreviewVideo(null)} title="Video pregled" wide>
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {previewVideo && (
              <VideoPlayerHLS
                videoId={previewVideo.url}
                accessToken={accesToken}
                API_URL={API_URL}
              />
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setPreviewVideo(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Zatvori
            </button>
          </div>
        </div>
      </SharedModal>

      {/* Brisanje modala umesto alert-a */}
      <SharedModal 
        open={deleteConfirmation.isOpen} 
        onClose={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, name: '' })} 
        title={`Obriši ${deleteConfirmation.type === 'lekcija' ? 'lekciju' : 'video'}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-300">
            Da li ste sigurni da želite da obrišete <span className="font-semibold text-white">{deleteConfirmation.name}</span>? Ova akcija je nepovratna.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button 
              onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, name: '' })} 
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Odustani
            </button>
            <button 
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20"
            >
              Obriši
            </button>
          </div>
        </div>
      </SharedModal>
    </div>
  );
}