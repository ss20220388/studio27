import React, { useRef, useState } from "react";

export default function TermsTab() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const fileInput = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    } else {
      alert("Samo PDF dokumenti su dozvoljeni.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-3">
        <input
          type="file"
          accept="application/pdf"
          ref={fileInput}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        {pdfUrl && <span className="text-xs text-emerald-400">PDF učitan</span>}
      </div>
      {pdfUrl ? (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900">
          <iframe
            src={pdfUrl}
            title="Pravila korišćenja"
            className="w-full"
            style={{ minHeight: "300px", maxHeight: "60vh" }}
          />
        </div>
      ) : (
        <div className="text-neutral-600 text-sm text-center">Nijedan PDF nije postavljen.</div>
      )}
    </div>
  );
}