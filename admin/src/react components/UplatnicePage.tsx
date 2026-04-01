import React, { useState } from "react";

interface Uplatnica {
  platioId: number;
  ime: string;
  prezime: string;
  email: string;
  kursNaziv: string;
  cena: number;
  urlUplatnice: string | null;
  datumUplate: string;
  tip?: string; // Za odobrena - "KARTICNO" ili "UPLATNICA"
}

interface UplatnicePageProps {
  uplatnice: Uplatnica[];
  odobrenaPlacanja?: Uplatnica[];
  token: string;
}

// Image Viewer Modal wrapper
const ImageModal = ({
  open,
  onClose,
  imageUrl,
}: {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
}) => {
  if (!open || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors shadow-lg cursor-pointer"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <img
          src={imageUrl}
          alt="Slika uplatnice"
          className="max-w-full max-h-[85vh] object-contain rounded-xl border border-neutral-700 shadow-2xl"
        />
      </div>
    </div>
  );
};

export default function UplatnicePage({ uplatnice = [], odobrenaPlacanja = [], token }: UplatnicePageProps) {
  const [page, setPage] = useState(0);
  const [odobrenaPage, setOdobrenaPage] = useState(0);
  const [search, setSearch] = useState("");
  const [odobrenaSearch, setOdobrenaSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const limit = 20;

  const filtered = (uplatnice || []).filter(
    (u) =>
      u.ime?.toLowerCase().includes(search.toLowerCase()) ||
      u.prezime?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.kursNaziv?.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const list = filtered.slice(page * limit, (page + 1) * limit);

  // Odobrena plaćanja - filtriranje i sortiranje
  const filteredOdobrena = (odobrenaPlacanja || [])
    .filter(
      (u) =>
        u.ime?.toLowerCase().includes(odobrenaSearch.toLowerCase()) ||
        u.prezime?.toLowerCase().includes(odobrenaSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(odobrenaSearch.toLowerCase()) ||
        u.kursNaziv?.toLowerCase().includes(odobrenaSearch.toLowerCase())
    )
    .sort((a, b) => new Date(b.datumUplate).getTime() - new Date(a.datumUplate).getTime());

  const odobrenaTotal = filteredOdobrena.length;
  const odobrenaTotalPages = Math.max(1, Math.ceil(odobrenaTotal / limit));
  const odobrenaList = filteredOdobrena.slice(odobrenaPage * limit, (odobrenaPage + 1) * limit);

  async function prihvatiUplatu(platioId: number) {
    if (!window.confirm("Da li ste sigurni da želite da odobrite ovu uplatu?")) return;

    try {
      const response = await fetch(`/api/odobri-uplatnicu/${platioId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
      });

      if (!response.ok) {
        console.error("Greška pri odobravanju:", await response.text());
        alert("Došlo je do greške prilikom odobravanja.");
        return;
      }
      
      window.location.reload();
    } catch (error) {
      console.error("Greška prilikom odobravanja:", error);
    }
  }

  async function odbijUplatu(platioId: number) {
    if (!window.confirm("Da li ste sigurni da želite da odbijete ovu uplatu?")) return;

    try {
      const response = await fetch(`/api/odbij-uplatnicu/${platioId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
      });

      if (!response.ok) {
        console.error("Greška pri odbijanju:", await response.text());
        alert("Došlo je do greške prilikom odbijanja.");
        return;
      }
      
      window.location.reload();
    } catch (error) {
      console.error("Greška prilikom odbijanja:", error);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
          <h1 className="text-2xl font-bold text-amber-500">Uplatnice na čekanju</h1>
          <p className="text-sm text-neutral-500 mt-1">Pregledajte pristigle slike uplatnica i potvrdite ili odbijte da li su uplaćene.</p>
        </div>
      </div>

      <div className="relative max-w-sm" style={{ marginBlock: "10px" }}>
        <input
          type="text"
          placeholder="Pretraži uplatnice (ime, mail, kurs)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ paddingInline: "15px", paddingBlock: "10px" }}
          className="w-full h-10 px-4 text-sm text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-lg outline-none focus:border-neutral-700 transition-colors duration-200 placeholder-neutral-600"
        />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {["Korisnik", "Kurs", "Iznos", "Datum", "Dokaz o uplati", "Akcije"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length > 0 ? list.map((u, i) => (
                <tr
                  key={u.platioId || i}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300 shrink-0">
                        {u.ime?.[0] || ""}
                        {u.prezime?.[0] || ""}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-200">
                          {u.ime} {u.prezime}
                        </p>
                        <p className="text-[11px] text-neutral-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex max-w-[150px] truncate text-neutral-300 font-medium">
                      {u.kursNaziv}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-300">
                    {u.cena}€
                  </td>
                  <td className="px-5 py-3 text-neutral-500 text-xs">
                    {u.datumUplate || "-"}
                  </td>
                  <td className="px-5 py-3">
                    {u.urlUplatnice ? (
                      <button
                        onClick={() => setSelectedImage(u.urlUplatnice)}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-900/10 border border-blue-900/30 rounded-lg hover:bg-blue-900/20 transition-colors"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                        </svg>
                        Vidi uplatnicu
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-600">Nema slike</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => prihvatiUplatu(u.platioId)}
                        className="cursor-pointer text-xs font-medium text-emerald-400 bg-emerald-900/10 border border-emerald-900/20 hover:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Prihvati
                      </button>
                      <button
                        onClick={() => odbijUplatu(u.platioId)}
                        className="cursor-pointer text-xs font-medium text-red-400 bg-red-900/10 border border-red-900/20 hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Odbij
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                    Nemate trenutno nijednu uplatnicu na čekanju.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800">
            <span className="text-xs font-medium text-neutral-500">
              Prikaz {page * limit + 1}-{Math.min((page + 1) * limit, total)} od {total}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Prethodna
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Sledeća
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Istorija</p>
          <h2 className="text-2xl font-bold text-emerald-500">Odobrena plaćanja</h2>
          <p className="text-sm text-neutral-500 mt-1">Pregled uspešnih plaćanja (karticom i odobrene uplatnice).</p>
        </div>
      </div>

      <div className="relative max-w-sm" style={{ marginBlock: "10px" }}>
        <input
          type="text"
          placeholder="Pretraži odobrena plaćanja..."
          value={odobrenaSearch}
          onChange={(e) => {
            setOdobrenaSearch(e.target.value);
            setOdobrenaPage(0);
          }}
          style={{ paddingInline: "15px", paddingBlock: "10px" }}
          className="w-full h-10 px-4 text-sm text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-lg outline-none focus:border-neutral-700 transition-colors duration-200 placeholder-neutral-600"
        />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {["Korisnik", "Kurs", "Iznos", "Tip plaćanja", "Datum uplate"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {odobrenaList.length > 0 ? odobrenaList.map((u, i) => (
                <tr
                  key={u.platioId || i + 1000}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300 shrink-0">
                        {u.ime?.[0] || ""}
                        {u.prezime?.[0] || ""}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-200">
                          {u.ime} {u.prezime}
                        </p>
                        <p className="text-[11px] text-neutral-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex max-w-[150px] truncate text-neutral-300 font-medium">
                      {u.kursNaziv}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-emerald-400 font-medium">
                    {u.cena}€
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
                        u.tip?.toUpperCase() === "KARTICNO"
                          ? "bg-blue-900/20 text-blue-400 border border-blue-800/30"
                          : "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30"
                      }`}
                    >
                      {u.tip || "Nepoznato"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500 text-xs">
                    {new Date(u.datumUplate).toLocaleTimeString('sr-RS', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">
                    Nema odobrenih plaćanja za prikaz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {odobrenaTotalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800">
            <span className="text-xs font-medium text-neutral-500">
              Prikaz {odobrenaPage * limit + 1}-{Math.min((odobrenaPage + 1) * limit, odobrenaTotal)} od {odobrenaTotal}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={odobrenaPage === 0}
                onClick={() => setOdobrenaPage((p) => p - 1)}
                className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Prethodna
              </button>
              <button
                disabled={odobrenaPage >= odobrenaTotalPages - 1}
                onClick={() => setOdobrenaPage((p) => p + 1)}
                className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Sledeća
              </button>
            </div>
          </div>
        )}
      </div>

      <ImageModal
        open={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />
    </div>
  );
}
