import { useState } from "react";

export default function UplatnicaForm({ onSuccess, naziv, cena, kursId, onBack, API_URL, token }) {
  const [uploaded, setUploaded] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploaded) return;

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("path", "/uplatnice");
      formData.append("file", uploaded);

      const meRes = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const meData = await meRes.json();
      console.log("Me data:", meData);
      const response = await fetch(`${API_URL}/api/upload-hetzner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData, // Nema potrebe za Content-Type headerom, browser sam postavlja 'multipart/form-data'
      });

      if (!response.ok) {
        throw new Error("Došlo je do greške prilikom slanja uplatnice.");
      }
      const dodajPlacanjeRes = await fetch(`${API_URL}/api/dodaj-placanje`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },  
        body: JSON.stringify({
          studentId: meData.userId,
          kursId: kursId,
          datumPlacanja: new Date().toISOString().split('T')[0],
          cenaPlacanja: cena,
          status: "C",
          tip: "UPLATNICA",
          url: `/${uploaded.name}`
        })
      });

      if (!dodajPlacanjeRes.ok) {
        throw new Error("Došlo je do greške prilikom evidentiranja uplate.");
      }

      setSuccessMessage("Vaša uplata je evidentirana, sliku vaše uplatnice ćemo sačuvati i kontaktiraćemo vas ukoliko nešto ne valja.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Uplata evidentirana</h2>
        <p className="text-gray-600 mb-6">{successMessage}</p>
        <button
          onClick={onSuccess}
          className="px-6 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-semibold transition"
        >
          Završi
        </button>
      </div>
    );
  }

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

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-between mt-4">
          <button type="button" onClick={onBack} disabled={isSubmitting} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
            Nazad
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !uploaded}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Slanje...
              </span>
            ) : "Pošalji uplatnicu"}
          </button>
        </div>
      </form>
    </>
  );
}