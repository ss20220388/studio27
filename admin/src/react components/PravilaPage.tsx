import React, { useState, useEffect, useRef } from "react";

interface PravilaPageProps {
  token: string;
}

export default function PravilaPage({ token }: PravilaPageProps) {
  const API_URL = "http://api.studio27.rs";
  const FOLDER_PATH = "/pravila";

  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPravila();
  }, []);

  async function fetchPravila() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/all-files-in-folder?remoteFolderPath=${encodeURIComponent(FOLDER_PATH)}`, {
        headers: {
          "Authorization": "Bearer " + token,
        },
      });

      if (!response.ok) throw new Error("Greška pri učitavanju pravila.");
      
      const data = await response.json();
      // Filtriramo samo PDF fajlove (u slučaju da ima drugih, ali u folderu pravila trebaju biti pdf)
      const pdfs = (data || []).filter((item: string) => item.toLowerCase().endsWith(".pdf"));
      setItems(pdfs);
    } catch (err: any) {
      setError(err.message || "Nepoznata greška prilikom učitavanja.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== "application/pdf") {
      alert("Izabrani fajl mora biti u PDF formatu!");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", FOLDER_PATH);

    try {
      // Prema vašem backendu (FileRoute.java), ruta se zove /upload-hetzner sa argumentima "path" i "file"
      const response = await fetch(`${API_URL}/api/upload-hetzner`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Neuspešno postavljanje fajla na server.");
      }

      alert("Pravilo (PDF) je uspešno postavljeno!");
      fetchPravila(); // Osveži listu PDF fajlova nakon uspešnog kreiranja
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Došlo je do greške prilikom dodavanja pravila.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const openPdf = (itemName: string) => {
    const filePath = `${FOLDER_PATH}/${itemName.split("/").pop()}`;
    const url = `${API_URL}/api/media?remoteFilePath=${encodeURIComponent(filePath)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Sistem</p>
          <h1 className="text-2xl font-bold text-neutral-100">Pravila i dokumentacija</h1>
          <p className="text-sm text-neutral-500 mt-1">Svi pravni PDF dokumenti se automatski učitavaju iz foldera {FOLDER_PATH} sa servera.</p>
        </div>
        
        <div className="relative">
          <input 
            type="file" 
            accept=".pdf" 
            ref={fileInputRef} 
            onChange={uploadFile} 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                </svg>
                Postavljanje...
              </span>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Dodaj pravilo (.pdf)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
        
        {loading ? (
          <div className="py-16 text-center">
            <svg className="animate-spin h-6 w-6 text-neutral-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
            </svg>
            <p className="text-sm text-neutral-500">Učitavanje PDF dokumenata...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <p>Greška: {error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-neutral-500">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 mb-3 opacity-30">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <p>Nema postavljenih pravila (PDF fajlova) u folderu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pb-2">
            {items.map((item, idx) => {
              const fileName = item.split("/").pop() || item;

              return (
                <div
                  key={`${item}-${idx}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-neutral-800/20 hover:bg-neutral-800/50 hover:border-neutral-700 transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-red-900/20 text-red-500 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">pdf</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-300 truncate" title={fileName}>
                      {fileName}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => openPdf(fileName)}
                    className="ml-3 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 bg-neutral-900 hover:text-white border border-neutral-700 hover:bg-neutral-700 cursor-pointer transition-colors shadow-sm"
                    title="Pogledaj / Preuzmi"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10 12a1 1 0 001-1V5a1 1 0 10-2 0v6a1 1 0 001 1z" />
                      <path fillRule="evenodd" d="M14.293 8.293A1 1 0 0115 9v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a1 1 0 011-1h1.5a1 1 0 010 2H7v6h6V10h-1.5a1 1 0 01-.707-1.707L10.5 6.586a1 1 0 011.414 0l2.379 1.707z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
