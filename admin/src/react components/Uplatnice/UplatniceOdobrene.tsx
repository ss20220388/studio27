import React, { useState } from "react";

interface Uplatnica {
  platioId?: number;
  studentId?: number;
  ime?: string;
  prezime?: string;
  email?: string;
  kursNaziv?: string;
  nazivKursa?: string;
  cena?: number;
  cenaPlacanja?: number;
  urlUplatnice?: string | null;
  url?: string | null;
  datumUplate?: string;
  datumPlacanja?: string;
  tip?: string; // "KARTICA" ili "UPLATNICA"
  status?: string;
}

interface UplatniceOdobreneProps {
  uplatnice: Uplatnica[];
  setSelectedImage: (url: string | null) => void;
   API_URL: string;
}

export default function UplatniceOdobrene({ uplatnice, setSelectedImage ,API_URL}: UplatniceOdobreneProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 20;

  const filtered = (uplatnice || [])
    .filter(
      (u) =>
        (u.ime?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (u.prezime?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (u.kursNaziv?.toLowerCase() || u.nazivKursa?.toLowerCase() || "").includes(search.toLowerCase()) ||
        u.studentId?.toString().includes(search)
    )
    .sort((a, b) => new Date(b.datumUplate || b.datumPlacanja || 0).getTime() - new Date(a.datumUplate || a.datumPlacanja || 0).getTime());

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const list = filtered.slice(page * limit, (page + 1) * limit);

  return (
    <>
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
              {list.length > 0 ? list.map((u, i) => (
                <tr
                  key={u.platioId || `${u.studentId}-${i}` || i + 1000}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300 shrink-0">
                        {u.ime?.[0] || u.studentId?.toString()?.[0] || "!"}
                        {u.prezime?.[0] || ""}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-200">
                          {u.ime ? `${u.ime} ${u.prezime || ""}` : `Student ID: ${u.studentId || "?"}`}
                        </p>
                        {u.email && <p className="text-[11px] text-neutral-500">{u.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex max-w-[150px] truncate text-neutral-300 font-medium">
                      {u.kursNaziv || u.nazivKursa || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-emerald-400 font-medium">
                    {u.cena || u.cenaPlacanja}€
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
                          u.tip?.toUpperCase() === "KARTICA"
                            ? "bg-blue-900/20 text-blue-400 border border-blue-800/30"
                            : "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30"
                        }`}
                      >
                        {u.tip || "Nepoznato"}
                      </span>
                      {u.tip === "UPLATNICA" && (u.url || u.urlUplatnice) && (
                        <button
                          onClick={() => setSelectedImage(`${API_URL}/api/media?remoteFilePath=/uplatnice${u.url || u.urlUplatnice || null}`)}
                          className="cursor-pointer p-1 text-blue-400 hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Vidi uplatnicu"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-500 text-xs">
                    {(u.datumUplate || u.datumPlacanja) ? new Date(u.datumUplate || u.datumPlacanja!).toLocaleDateString('sr-RS', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }) : "-"}
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
    </>
  );
}