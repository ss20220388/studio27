import { useState } from "react";

export default function UplatnicaForm({ onSuccess, naziv, cena, onBack }) {
  const [uploaded, setUploaded] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess();
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Plaćanje uplatnicom</h2>
      <p className="text-gray-500 mb-6">{naziv} - {cena} RSD</p>
      <div className="border-2 border-gray-400 rounded-lg p-4 bg-gray-50 mb-4">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <span className="text-xs text-gray-500">Primaoc:</span>
            <p className="font-semibold text-sm">Ime i prezime / firma</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Svrha uplate:</span>
            <p className="font-semibold text-sm">Kupovina kursa {naziv}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-2">
          <div>
            <span className="text-xs text-gray-500">Iznos:</span>
            <p className="font-semibold text-sm">{cena} RSD</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Model:</span>
            <p className="font-semibold text-sm">97</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Poziv na broj:</span>
            <p className="font-semibold text-sm">2026/01</p>
          </div>
        </div>

        <div className="text-gray-500 text-xs mt-2">
          <p>Primer kako popuniti uplatnicu:</p>
          <ul className="list-disc list-inside">
            <li>Upišite primaoca i svrhu uplate</li>
            <li>Upišite iznos, model i poziv na broj</li>
            <li>Priložite dokaz o uplati ispod</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*,.pdf"
          className="w-full border border-gray-300 rounded-xl p-3"
          onChange={(e) => setUploaded(e.target.files[0])}
          required
        />

        <div className="flex justify-between mt-4">
          <button type="button" onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
            Nazad
          </button>
          <button type="submit" className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-semibold transition">
            Pošalji uplatnicu
          </button>
        </div>
      </form>
    </>
  );
}