import React, { useEffect, useState } from "react";

/**
 * @typedef {Object} TermsTabProps
 * @property {string} [token] - Autentifikacioni token
 */

/**
 * TermsTab komponenta prikazuje listu dostupnih PDF pravila i omogućava njihov preuzimanje
 * @param {TermsTabProps} props
 */
export default function TermsTab({ token }) {
  const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";
  const FOLDER_PATH = "/pravila";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchPravila();
    }
  }, [token]);

  const fetchPravila = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/api/all-files-in-folder?remoteFolderPath=${encodeURIComponent(FOLDER_PATH)}`,
        {
          credentials: "include",
          headers,
        }
      );

      if (!response.ok) throw new Error("Greška pri učitavanju pravila.");

      const data = await response.json();
      const pdfs = (data || []).filter((item) => item.toLowerCase().endsWith(".pdf"));
      setItems(pdfs);
    } catch (err) {
      setError(err.message || "Nepoznata greška prilikom učitavanja.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openPdf = (itemName) => {
    const filePath = `${FOLDER_PATH}/${itemName.split("/").pop()}`;
    const url = `${API_URL}/api/media?remoteFilePath=${encodeURIComponent(filePath)}`;
    window.open(url, "_blank");
  };

  if (!token) {
    return (
      <div className="py-8 text-center text-neutral-500">
        <p className="text-sm">Učitavanje autentifikacije...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {loading ? (
        <div className="py-12 text-center">
          <svg className="animate-spin h-6 w-6 text-neutral-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
          </svg>
          <p className="text-sm text-neutral-500">Učitavanje PDF dokumenata...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">
          <p className="text-sm">Greška: {error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-neutral-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 mb-3 opacity-30">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">Nema dostupnih pravila (PDF fajlova).</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const fileName = item.split("/").pop() || item;

            return (
              <div
                key={`${item}-${idx}`}
                className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/20 hover:bg-neutral-800/50 hover:border-neutral-700 transition-all group"
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
                  className="shrink-0 ml-3 px-4 py-2 rounded-lg flex items-center gap-2 text-neutral-300 bg-neutral-900 hover:text-white border border-neutral-700 hover:bg-neutral-700 cursor-pointer transition-colors shadow-sm text-sm font-medium"
                  title="Otvori / Preuzmi"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 12a1 1 0 001-1V5a1 1 0 10-2 0v6a1 1 0 001 1z" />
                    <path fillRule="evenodd" d="M14.293 8.293A1 1 0 0115 9v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a1 1 0 011-1h1.5a1 1 0 010 2H7v6h6V10h-1.5a1 1 0 01-.707-1.707L10.5 6.586a1 1 0 011.414 0l2.379 1.707z" clipRule="evenodd" />
                  </svg>
                  Preuzmi
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}