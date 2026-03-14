import React, { useState, useEffect } from "react";

interface Lekcija {
  lekcijaId: number;
  naziv: string;
  opis: string;
  videoUrl: string | null;
}

interface Kurs {
  id: number;
  naziv: string;
  opis: string;
  cena: number;
  trajanje: number;
  slikaUrl: string;
  lekcije: Lekcija[];
}

const Modal = ({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      style={{ paddingInline: "20px", paddingBlock: "10px" }}
    >
      <div
        className={`bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl ${wide ? "w-full max-w-2xl" : "w-full max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default function CoursesPage() {
  const [kursevi, setKursevi] = useState<Kurs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedKurs, setSelectedKurs] = useState<Kurs | null>(null);
  const [expandedLekcija, setExpandedLekcija] = useState<number | null>(null);
  const [showAddLekcija, setShowAddLekcija] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState<number | null>(null);
  const [previewVideo, setPreviewVideo] = useState<Lekcija | null>(null);

  const [addLekcijaForm, setAddLekcijaForm] = useState({ naziv: "", opis: "" });
  const [addVideoForm, setAddVideoForm] = useState({ naziv: "", file: "" });

  useEffect(() => {
    fetch("/api/kursevi-sa-lekcijama")
      .then((res) => {
        if (!res.ok) throw new Error("Greška pri učitavanju kurseva");
        return res.json();
      })
      .then((data: Kurs[]) => {
        setKursevi(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Došlo je do greške");
        setLoading(false);
      });
  }, []);

  if (!selectedKurs) {
    return (
      <div className="space-y-8 animate-fade-in" style={{ paddingInline: "20px" }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">
              Upravljanje
            </p>
            <h1 className="text-2xl font-bold text-white">Kursevi</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {loading ? "Učitavanje..." : `${kursevi.length} aktivnih kurseva`}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-neutral-700 border-t-red-700 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {kursevi.map((kurs) => (
              <div
                key={kurs.id}
                onClick={() => setSelectedKurs(kurs)}
                className="group bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all duration-200 cursor-pointer"
              >
                <div className="h-36 bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-red-900/20 to-transparent" />
                  {kurs.slikaUrl ? (
                    <img
                      src={"http://api.studio27.rs/api/uploaded-images" + kurs.slikaUrl}
                      alt={kurs.naziv}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-neutral-700">
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span
                    style={{ padding: "10px" }}
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[11px] font-medium text-white"
                  >
                    {kurs.lekcije?.length ?? 0} lekcija
                  </span>
                </div>

                <div className="p-4" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
                  <h3 className="font-semibold text-white text-sm group-hover:text-red-400 transition-colors line-clamp-1">
                    {kurs.naziv}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{kurs.opis}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-bold text-white">
                      {kurs.cena?.toLocaleString?.() ?? kurs.cena}{" "}
                      <span className="text-xs font-normal text-neutral-500">RSD</span>
                    </span>
                    <span className="text-xs text-neutral-500">{kurs.trajanje} dana</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4 pb-5 border-b border-neutral-800/60">
        <button
          onClick={() => {
            setSelectedKurs(null);
            setExpandedLekcija(null);
          }}
          className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-0.5">
            Kursevi / detalji
          </p>
          <h1 className="text-xl font-bold text-white truncate">{selectedKurs.naziv}</h1>
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{selectedKurs.opis}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {[
          { label: "Cena", value: `${selectedKurs.cena.toLocaleString()} RSD` },
          { label: "Trajanje", value: `${selectedKurs.trajanje} dana` },
          { label: "Lekcija", value: (selectedKurs.lekcije?.length ?? 0).toString() },
          {
            label: "Videa",
            value: (selectedKurs.lekcije?.reduce((a, l) => a + (l.videoUrl ? 1 : 0), 0) ?? 0).toString(),
          },
        ].map((item) => (
          <div key={item.label} className="bg-neutral-900 border border-neutral-800 rounded-lg px-5 py-4 min-w-32">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-lg font-bold text-white mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Lekcije</h2>
          <button
            onClick={() => setShowAddLekcija(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-white text-xs font-medium transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Dodaj lekciju
          </button>
        </div>

        {selectedKurs.lekcije?.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-xl p-10 text-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-neutral-700 mx-auto mb-2">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            <p className="text-sm text-neutral-500">Nema lekcija. Dodajte prvu lekciju za ovaj kurs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedKurs.lekcije.map((lekcija, li) => (
              <div key={lekcija.lekcijaId} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedLekcija(expandedLekcija === lekcija.lekcijaId ? null : lekcija.lekcijaId)
                  }
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
                    <span className="text-[11px] text-neutral-500">{lekcija.videoUrl ? 1 : 0} videa</span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                        expandedLekcija === lekcija.lekcijaId ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>

                {expandedLekcija === lekcija.lekcijaId && (
                  <div className="border-t border-neutral-800 px-5 py-4 bg-neutral-950/50">
                    {!lekcija.videoUrl ? (
                      <p className="text-xs text-neutral-600 py-2">Nema videa u ovoj lekciji.</p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-800/50 transition-colors group">
                          <div className="w-6 h-6 rounded bg-red-900/15 flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-red-400">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="flex-1 text-sm text-neutral-300 truncate">
                            {lekcija.videoUrl.split("/").pop() || "Video"}
                          </span>
                          <button
                            onClick={() => setPreviewVideo(lekcija)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-neutral-500 hover:text-blue-400 hover:bg-blue-900/15 transition-all"
                            title="Pregledaj video"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-500 hover:text-red-400 transition-all">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setShowAddVideo(lekcija.lekcijaId)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 transition-colors py-1"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
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

      <Modal open={showAddLekcija} onClose={() => setShowAddLekcija(false)} title="Dodaj lekciju">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
              Naziv lekcije
            </label>
            <input
              value={addLekcijaForm.naziv}
              onChange={(e) => setAddLekcijaForm({ ...addLekcijaForm, naziv: e.target.value })}
              placeholder="Npr. Uvod u materijale"
              className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
              Opis
            </label>
            <textarea
              value={addLekcijaForm.opis}
              onChange={(e) => setAddLekcijaForm({ ...addLekcijaForm, opis: e.target.value })}
              placeholder="Kratak opis lekcije..."
              rows={3}
              className="w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddLekcija(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Otkaži
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">
              Sačuvaj
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddVideo !== null} onClose={() => setShowAddVideo(null)} title="Dodaj video">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
              Naziv videa
            </label>
            <input
              value={addVideoForm.naziv}
              onChange={(e) => setAddVideoForm({ ...addVideoForm, naziv: e.target.value })}
              placeholder="Npr. Uvodni video.mp4"
              className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
              Video fajl
            </label>
            <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-neutral-600 transition-colors cursor-pointer">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-neutral-600 mx-auto mb-2">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-neutral-500">Kliknite ili prevucite video fajl ovde</p>
              <p className="text-[10px] text-neutral-600 mt-1">MP4, MOV do 2GB</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddVideo(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Otkaži
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">
              Upload
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!previewVideo} onClose={() => setPreviewVideo(null)} title={previewVideo?.naziv || "Video pregled"} wide>
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {previewVideo?.videoUrl ? (
              <video src={previewVideo.videoUrl} controls className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-neutral-500">
                Video nije dostupan.
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-200">{previewVideo?.naziv}</p>
              <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-[420px]">
                {previewVideo?.videoUrl || "Nema URL-a"}
              </p>
            </div>
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
