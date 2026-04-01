import React, { useState, useEffect } from "react";

interface FajloviPageProps {
  token: string;
}

const isVideo = (path: string) => /\.(mp4|webm|mkv|m3u8)$/i.test(path);
const isImage = (path: string) => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(path);
// Ako ne sadrži tačku (nema ekstenziju), pretpostavi da je folder
const isFolder = (path: string) => !path.includes(".");

const FileModal = ({
  open,
  onClose,
  fileUrl,
  fileName,
  type,
}: {
  open: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
  type: "video" | "image" | "unknown" | null;
}) => {
  if (!open || !fileUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl flex flex-col items-center justify-center bg-neutral-900 rounded-xl border border-neutral-800 p-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        <div className="flex items-center justify-between w-full mb-3 pb-3 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-300 truncate pr-4">{fileName}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {type === "video" && (
          <video
            src={fileUrl}
            controls
            autoPlay
            className="w-full rounded-lg shadow-2xl max-h-[75vh] bg-black"
          />
        )}

        {type === "image" && (
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
          />
        )}

        {type === "unknown" && (
          <div className="py-20 text-center text-neutral-500 w-full">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 mx-auto mb-4 opacity-50">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            <p>Prikaz ovog formata nije podržan u pregledaču.</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-4 py-2 inline-block text-sm font-medium text-blue-400 bg-blue-900/20 border border-blue-900/30 rounded-lg hover:bg-blue-900/30 transition-colors"
            >
              Preuzmi fajl
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default function FajloviPage({ token }: FajloviPageProps) {
  const API_URL = "http://api.studio27.rs";
  
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<"video" | "image" | "unknown" | null>(null);

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath]);

  async function fetchItems(path: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/all-files-in-folder?remoteFolderPath=${encodeURIComponent(path)}`, {
        headers: {
          "Authorization": "Bearer " + token,
        },
      });

      if (!response.ok) throw new Error("Greška pri učitavanju foldera");
      
      const data = await response.json();
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || "Nepoznata greška");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const navigateUp = () => {
    if (currentPath === "/" || currentPath === "") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath("/" + parts.join("/"));
  };

  const handleItemClick = (itemName: string) => {
    // Pretpostavljeni format putanje
    const isFolderTarget = isFolder(itemName);
    
    if (isFolderTarget) {
      const newPath = currentPath.endsWith("/") 
        ? `${currentPath}${itemName}` 
        : `${currentPath}/${itemName}`;
      setCurrentPath(newPath);
    } else {
      // Fajl
      const filePath = currentPath.endsWith("/") 
        ? `${currentPath}${itemName}` 
        : `${currentPath}/${itemName}`;
        
      // OOVDE: formiramo pun URL za fetch (bilo kroz vaš /api/media koji downlouduje, ili javni URL ako postoji)
      const url = `${API_URL}/api/media?remoteFilePath=${encodeURIComponent(filePath)}`;
      
      setSelectedFileName(itemName);
      setSelectedFileUrl(url);

      if (isVideo(itemName)) setSelectedFileType("video");
      else if (isImage(itemName)) setSelectedFileType("image");
      else setSelectedFileType("unknown");

      setModalOpen(true);
    }
  };

  // Pomoć oko breadcrumbsa
  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Sistem</p>
          <h1 className="text-2xl font-bold text-blue-400">Skladište i fajlovi</h1>
          <p className="text-sm text-neutral-500 mt-1">Pregledajte video snimke sa predavanja, slike i uplatnice sa servera.</p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
        
        {/* Navigation Header */}
        <div className="flex items-center gap-3 py-4 border-b border-neutral-800">
          <button
            onClick={navigateUp}
            disabled={currentPath === "/" || currentPath === ""}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="flex items-center text-sm font-medium text-neutral-300 gap-2 overflow-x-auto min-w-0">
            <span 
              className="hover:text-blue-400 cursor-pointer transition-colors"
              onClick={() => setCurrentPath("/")}
            >
              Root
            </span>
            {pathParts.map((part, idx) => {
              const navigateTo = "/" + pathParts.slice(0, idx + 1).join("/");
              return (
                <React.Fragment key={part + idx}>
                  <span className="text-neutral-600">/</span>
                  <span 
                    className="hover:text-blue-400 cursor-pointer transition-colors truncate"
                    onClick={() => setCurrentPath(navigateTo)}
                  >
                    {part}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="py-4">
          {loading ? (
            <div className="py-12 text-center text-neutral-500 animate-pulse">Učitavanje fajlova...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">Greška: {error}</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">Folder je prazan.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item, idx) => {
                const folder = isFolder(item);
                const itemName = item.split("/").pop() || item; // U slučaju da vraća apsolutne putanje

                return (
                  <button
                    key={`${item}-${idx}`}
                    onClick={() => handleItemClick(item)}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-neutral-800/80 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group text-center"
                  >
                    {folder ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-amber-500 group-hover:text-amber-400 transition-colors">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    ) : isVideo(itemName) ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-purple-500 group-hover:text-purple-400 transition-colors">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    ) : isImage(itemName) ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-emerald-500 group-hover:text-emerald-400 transition-colors">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-neutral-500 group-hover:text-neutral-400 transition-colors">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-xs font-medium text-neutral-300 group-hover:text-white truncate w-full px-2">
                      {itemName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fileUrl={selectedFileUrl}
        fileName={selectedFileName}
        type={selectedFileType}
      />
    </div>
  );
}
