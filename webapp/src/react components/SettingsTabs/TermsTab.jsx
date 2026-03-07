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
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">Pravila korišćenja (PDF)</h2>
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
        <input
          type="file"
          accept="application/pdf"
          ref={fileInput}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          className="bg-red-900 text-white rounded px-4 py-2 hover:bg-red-800 transition w-full sm:w-auto"
          onClick={() => fileInput.current.click()}
        >
          Postavi PDF pravila
        </button>
        {pdfUrl && <span className="text-xs text-gray-600 break-all">PDF učitan</span>}
      </div>
      {pdfUrl ? (
        <div className="border rounded shadow p-2 bg-white">
          <iframe
            src={pdfUrl}
            title="Pravila korišćenja"
            className="w-full"
            style={{ minHeight: "300px", maxHeight: "60vh" }}
          />
        </div>
      ) : (
        <div className="text-gray-500 text-sm text-center">Nijedan PDF nije postavljen.</div>
      )}
    </div>
  );
}