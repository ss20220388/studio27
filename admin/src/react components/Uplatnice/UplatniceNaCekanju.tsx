import React, { useState } from "react";
interface Uplatnica {
  platioId?: number;
  studentId?: number;
  kursId?: number;
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

interface UplatniceNaCekanjuProps {
  uplatnice: Uplatnica[];
  token: string;
  setSelectedImage: (url: string | null) => void;
  API_URL: string;
}

export default function UplatniceNaCekanju({ uplatnice, token, setSelectedImage,API_URL }: UplatniceNaCekanjuProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionTip: "PRIHVATI" | "ODBIJ" | "GRESKA" | null;
    studentId: number | null;
    kursId: number | null;
    poruka?: string;
  }>({ isOpen: false, actionTip: null, studentId: null, kursId: null });
  const limit = 20;

  const filtered = (uplatnice || []).filter(
    (u) =>
      (u.ime?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.prezime?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.kursNaziv?.toLowerCase() || u.nazivKursa?.toLowerCase() || "").includes(search.toLowerCase()) ||
      u.studentId?.toString().includes(search)
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const list = filtered.slice(page * limit, (page + 1) * limit);

  function otvoriPrihvati(studentId: number, kursId: number) {
    setModalState({ isOpen: true, actionTip: "PRIHVATI", studentId, kursId });
  }

  function otvoriOdbij(studentId: number, kursId: number) {
    setModalState({ isOpen: true, actionTip: "ODBIJ", studentId, kursId });
  }

  function zatvoriModal() {
    setModalState({ isOpen: false, actionTip: null, studentId: null, kursId: null });
  }

  async function potvrdiAkciju() {
    if (!modalState.studentId || !modalState.kursId || !modalState.actionTip) return;

    if (modalState.actionTip === "GRESKA") {
      zatvoriModal();
      return;
    }

    const isPrihvati = modalState.actionTip === "PRIHVATI";
    const endpoint = isPrihvati ? "odobri-uplatnicu" : "odbij-uplatnicu";

    try {
      const response = await fetch(`${API_URL}/api/update-payment-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          studentId: modalState.studentId,
          kursId: modalState.kursId,
          newStatus: isPrihvati ? 'P' : 'O'
        })
      });

      if (!response.ok) {
        setModalState({ 
          isOpen: true, 
          actionTip: "GRESKA", 
          studentId: null,
          kursId: null,
          poruka: `Došlo je do greške prilikom ${isPrihvati ? "odobravanja" : "odbijanja"}.`
        });
        return;
      }
      
      window.location.reload();
    } catch (error) {
      console.error(`Greška prilikom ${isPrihvati ? "odobravanja" : "odbijanja"}:`, error);
      setModalState({ 
        isOpen: true, 
        actionTip: "GRESKA", 
        studentId: null,
        kursId: null,
        poruka: "Došlo je do mrežne greške."
      });
    }
  }

  return (
    <>
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
                {["Korisnik", "Kurs", "Iznos", "Datum uplate", "Dokaz o uplati", "Akcije"].map((h) => (
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
                  key={u.platioId || `${u.studentId}-${i}` || i}
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
                  <td className="px-5 py-3 text-neutral-300">
                    {u.cena || u.cenaPlacanja}€
                  </td>
                  <td className="px-5 py-3 text-neutral-500 text-xs">
                    {(u.datumUplate || u.datumPlacanja) ? new Date(u.datumUplate || u.datumPlacanja!).toLocaleDateString('sr-RS', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }) : "-"}
                  </td>
                  <td className="px-5 py-3">
                    {u.tip === "UPLATNICA" ? (
                      (u.url || u.urlUplatnice) ? (
                        <button
                          onClick={() => setSelectedImage(`${API_URL}/api/media?remoteFilePath=/uplatnice${u.url || u.urlUplatnice || null}`)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-900/10 border border-blue-900/30 rounded-lg hover:bg-blue-900/20 transition-colors"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                          </svg>
                          Vidi uplatnicu
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-600">Nema slike</span>
                      )
                    ) : (
                      <span className="text-xs text-neutral-500">{u.tip || "-"}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => otvoriPrihvati(u.studentId || 0, u.kursId || 0)}
                        className="cursor-pointer text-xs font-medium text-emerald-400 bg-emerald-900/10 border border-emerald-900/20 hover:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Prihvati
                      </button>
                      <button
                        onClick={() => otvoriOdbij(u.studentId || 0, u.kursId || 0)}
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

      {modalState.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h3 className={`text-lg font-bold mb-2 ${
              modalState.actionTip === "PRIHVATI" ? "text-emerald-500" :
              modalState.actionTip === "ODBIJ" ? "text-red-500" : "text-amber-500"
            }`}>
              {modalState.actionTip === "PRIHVATI" && "Odobravanje uplate"}
              {modalState.actionTip === "ODBIJ" && "Odbijanje uplate"}
              {modalState.actionTip === "GRESKA" && "Sistemska Poruka"}
            </h3>
            
            <p className="text-neutral-300 text-sm mb-6">
              {modalState.actionTip === "PRIHVATI" && "Da li ste sigurni da želite da odobrite ovu uplatu?"}
              {modalState.actionTip === "ODBIJ" && "Da li ste sigurni da želite da odbijete ovu uplatu?"}
              {modalState.actionTip === "GRESKA" && modalState.poruka}
            </p>

            <div className="flex justify-end gap-3">
              {modalState.actionTip !== "GRESKA" && (
                <button
                  onClick={zatvoriModal}
                  className="px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  Odustani
                </button>
              )}
              <button
                onClick={potvrdiAkciju}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  modalState.actionTip === "PRIHVATI" ? "bg-emerald-600 hover:bg-emerald-500 text-white" :
                  modalState.actionTip === "ODBIJ" ? "bg-red-600 hover:bg-red-500 text-white" :
                  "bg-amber-600 hover:bg-amber-500 text-white"
                }`}
              >
                  {modalState.actionTip === "GRESKA" ? "U redu" : "Potvrdi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}