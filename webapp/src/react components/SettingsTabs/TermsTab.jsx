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
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Pravila korišćenja (PDF)</h2>
      <div className="mb-4">
        <input
          type="file"
          accept="application/pdf"
          ref={fileInput}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          className="bg-red-900 text-white rounded px-4 py-2 hover:bg-red-800 transition"
          onClick={() => fileInput.current.click()}
        >
          Postavi PDF pravila
        </button>
      </div>
      {pdfUrl ? (
        <div className="border rounded shadow p-2 bg-white">
          <iframe
            src={pdfUrl}
            title="Pravila korišćenja"
            className="w-full"
            style={{ minHeight: "500px" }}
          />
        </div>
      ) : (
        <div className="text-gray-500 text-sm">Nijedan PDF nije postavljen.</div>
      )}
    </div>
  );
}