import React, { useState, useEffect } from "react";
import VideoPlayerHLS from "./VideoPlayerHLS";

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

interface Kurs {
  id: number;
  naziv: string;
  opis: string;
  cena: number;
  slikaUrl: string;
  brojStudenata: number;
  lekcije: Lekcija[];
}

// Modal
const Modal = ({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} style={{paddingInline:"20px", paddingBlock:"10px"}}>
      <div
        className={`bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl ${wide ? "w-full max-w-2xl" : "w-full max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors">×</button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default function CoursesPage({accesToken}: {accesToken: string | null}) {
  const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";
  
  
  // Helper funkcija za izgradnju URL slike
  const getImageUrl = (slikaUrl: string | undefined): string | null => {
    if (!slikaUrl) return null;
    
    // Ako je već puni URL (počinje sa http), vrati ga direktno
    if (slikaUrl.startsWith("http")) return slikaUrl;
    
    // Ukloni vodeci / ako postoji
    const cleanUrl = slikaUrl.startsWith("/") ? slikaUrl.substring(1) : slikaUrl;
    
    // Konstruiši URL: API_URL + /api/uploaded-images/ + URL iz baze
    return `${API_URL}/api/uploaded-images/${cleanUrl}`;
  };
  
  const [kursevi, setKursevi] = useState<Kurs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKurs, setSelectedKurs] = useState<Kurs | null>(null);
  const [expandedLekcija, setExpandedLekcija] = useState<number | null>(null);
  const [showAddLekcija, setShowAddLekcija] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState<number | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string } | null>(null);
  const [addLekcijaForm, setAddLekcijaForm] = useState({ naziv: "", opis: "" });
  const [addVideoForm, setAddVideoForm] = useState({ naziv: "", file: "" });
  

  // Učitaj kurseve iz baze (token je HTTP-only cookie, automatski se šalje sa credentials: 'include')
  useEffect(() => {
    console.log("🔄 Učitavamo kurseve sa API-ja...");
    const fetchKursevi = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`${API_URL}`)
        let endpoint = `${API_URL}/api/kursevi-sa-lekcijama`;
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", 
        });
        console.log("📡 API odgovor status:", response.status);
        
        
        if (response.status === 403) {
          console.log("⚠️ Endpoint /api/kursevi-sa-lekcijama zahteva admin pristup, pokušavam sa /api/kursevi");
          endpoint = `${API_URL}/api/kursevi`;
          const fallbackResponse = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
          if (!fallbackResponse.ok) {
            throw new Error(`Greška pri učitavanju kurseva: ${fallbackResponse.status}`);
          }
          const fallbackData = await fallbackResponse.json();
          console.log("✅ Korišćen fallback /api/kursevi:", fallbackData);
          setKursevi(fallbackData.kursevi || fallbackData || []);
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Greška pri učitavanju kurseva: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Primljeni kursevi iz API-ja:", data);
        console.log("🎬 Struktura lekcija:", data.kursevi?.[0]?.lekcije || data?.[0]?.lekcije);
        console.log("📹 Struktura videa:", data.kursevi?.[0]?.lekcije?.[0]?.videoUrls || data?.[0]?.lekcije?.[0]?.videoUrls);
        const kurseviArray = data.kursevi || data || [];
        
        setKursevi(kurseviArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Greška pri učitavanju kurseva");
        console.error("❌ Error pri fetchanju kurseva:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKursevi();
  }, [API_URL]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in" style={{paddingInline:"20px"}}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
            <h1 className="text-2xl font-bold text-white">Kursevi</h1>
            <p className="text-sm text-neutral-500 mt-1">Učitavanje...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8 animate-fade-in" style={{paddingInline:"20px"}}>
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">❌ {error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (kursevi.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in" style={{paddingInline:"20px"}}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
            <h1 className="text-2xl font-bold text-white">Kursevi</h1>
            <p className="text-sm text-neutral-500 mt-1">Nema dostupnih kurseva</p>
          </div>
        </div>
      </div>
    );
  }

  // Course list view
  if (!selectedKurs) {
    return (
      <div className="space-y-8 animate-fade-in" style={{paddingInline:"20px"}}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
            <h1 className="text-2xl font-bold text-white">Kursevi</h1>
            <p className="text-sm text-neutral-500 mt-1">{kursevi.length} aktivnih kurseva</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children"  >
          {kursevi.map((kurs) => (
            <div
              key={kurs.id}
              onClick={() => setSelectedKurs(kurs)}
              className="group bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all duration-200 cursor-pointer"
            >
              {/* Course image */}
              <div className="h-36 bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                {getImageUrl(kurs.slikaUrl) ? (
                  <img 
                    src={getImageUrl(kurs.slikaUrl)!} 
                    alt={kurs.naziv}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.warn(`⚠️ Greška pri učitavanju slike za ${kurs.naziv}:`, kurs.slikaUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-linear-to-br from-red-900/20 to-transparent" />
                {!getImageUrl(kurs.slikaUrl) && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-neutral-700">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                )}
                <span style={{padding:"10px"}} className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[11px] font-medium text-white">
                  {(kurs.lekcije?.length || 0)} lekcija
                </span>
              </div>

              <div className="p-4" style={{paddingInline:"20px",paddingBlock:"10px"}}>
                <h3 className="font-semibold text-white text-sm group-hover:text-red-400 transition-colors line-clamp-1">
                  {kurs.naziv}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{kurs.opis}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-bold text-white">
                    {(kurs.cena || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">RSD</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {(kurs.brojStudenata || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    );
  }

  // Course detail view with lessons
  return (
    <div className="space-y-8 animate-fade-in">
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
      </div>

      {/* Info strip */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: "Cena", value: `${(selectedKurs.cena || 0).toLocaleString()} RSD` },
          { label: "Studenata", value: (selectedKurs.brojStudenata || 0).toString() },
          { label: "Lekcija", value: (selectedKurs.lekcije?.length || 0).toString() },
          { label: "Videa", value: (selectedKurs.lekcije?.reduce((a, l) => a + (l.videoUrls?.length || 0), 0) || 0).toString() },
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
            {(selectedKurs.lekcije || []).map((lekcija, li) => (
              <div key={lekcija.lekcijaId} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                {/* Lesson header */}
                <button
                  onClick={() => {
                    const newState = expandedLekcija === lekcija.lekcijaId ? null : lekcija.lekcijaId;
                    console.log(`🔄 Lekcija: ${lekcija.naziv} (ID: ${lekcija.lekcijaId}) - Prethodna stanja: ${expandedLekcija}, Nova stanja: ${newState}`);
                    setExpandedLekcija(newState);
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-800/30 transition-colors"
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
                    <span className="text-[11px] text-neutral-500">{(lekcija.videoUrls?.length || 0)} videa</span>
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
                </button>

                {/* Videos */}
                {expandedLekcija === lekcija.lekcijaId && (
                  <div className="border-t border-neutral-800 px-5 py-4 bg-neutral-950/50 space-y-3">

                    {(lekcija.videoUrls?.length || 0) === 0 ? (
                      <p className="text-xs text-neutral-500">Nema videa za ovu lekciju. Struktura: {JSON.stringify(lekcija.videoUrls)}</p>
                    ) : (
                      <div className="space-y-2">
                        {lekcija.videoUrls?.map((videoUrl, idx) => {
                          console.log(`  📹 Video ${idx}:`, videoUrl);
                          return (
                          <button
                            key={idx}
                            onClick={() => setPreviewVideo({ url: videoUrl })}
                            className="w-full text-left px-3 py-2.5 text-sm text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-neutral-600 transition-colors flex items-center gap-2 group"
                          >
                            <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            <span className="truncate flex-1">Video {idx + 1}</span>
                            <span className="text-[10px] ml-auto text-neutral-500 flex-shrink-0">▶</span>
                          </button>
                        );
                        })}
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

      {/* Add lesson modal */}
      <Modal open={showAddLekcija} onClose={() => setShowAddLekcija(false)} title="Dodaj lekciju">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Naziv lekcije</label>
            <input
              value={addLekcijaForm.naziv}
              onChange={(e) => setAddLekcijaForm({ ...addLekcijaForm, naziv: e.target.value })}
              placeholder="Npr. Uvod u materijale"
              className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Opis</label>
            <textarea
              value={addLekcijaForm.opis}
              onChange={(e) => setAddLekcijaForm({ ...addLekcijaForm, opis: e.target.value })}
              placeholder="Kratak opis lekcije..."
              rows={3}
              className="w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAddLekcija(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">Otkaži</button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">Sačuvaj</button>
          </div>
        </div>
      </Modal>

      {/* Add video modal */}
      <Modal open={showAddVideo !== null} onClose={() => setShowAddVideo(null)} title="Dodaj video">
        <div className="space-y-4">

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Video fajl</label>
            <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-neutral-600 transition-colors cursor-pointer">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-neutral-600 mx-auto mb-2">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-neutral-500">Kliknite ili prevucite video fajl ovde</p>
              <p className="text-[10px] text-neutral-600 mt-1">MP4, MOV do 2GB</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAddVideo(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">Otkaži</button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">Upload</button>
          </div>
        </div>
      </Modal>

      {/* Video preview modal */}
      <Modal open={!!previewVideo} onClose={() => setPreviewVideo(null)} title="Video pregled" wide>
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
      </Modal>
    </div>
  );
}
