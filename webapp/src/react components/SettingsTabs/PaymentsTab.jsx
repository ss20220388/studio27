import React, { useState } from "react";
const fakePayments = [
  { id: 1, kurs: "3ds Max", datum: "2026-02-01", iznos: "2000 RSD", status: "Plaćeno", pretplata: "Aktivna", do: "2026-12-31" },
  { id: 2, kurs: "Photoshop", datum: "2026-01-15", iznos: "1500 RSD", status: "Plaćeno", pretplata: "Neaktivna", do: "2025-11-15" },
];

export default function PaymentsTab() {
  const [message, setMessage] = useState("");

  const handleRenew = (kurs) => {
    setMessage(`Obnavljanje pretplate za kurs: ${kurs}`);
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div className="w-full max-w-full">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">Moja plaćanja</h2>
      {/* Skrol naznaka za mobilne */}
      <div className="sm:hidden flex items-center justify-center mb-1">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          
          Skroluje tabelu u desno
        </span>
      </div>
      <div className="rounded-xl shadow border bg-white overflow-x-auto relative">
        <table className="w-full text-xs sm:text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Kurs</th>
              <th className="p-2">Datum</th>
              <th className="p-2">Iznos</th>
              <th className="p-2">Status</th>
              <th className="p-2">Pretplata</th>
              <th className="p-2">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {fakePayments.map(p => (
              <tr key={p.id} className="text-center border-t">
                <td className="p-2 whitespace-nowrap">{p.kurs}</td>
                <td className="p-2 whitespace-nowrap">{p.datum}</td>
                <td className="p-2 whitespace-nowrap">{p.iznos}</td>
                <td className="p-2 whitespace-nowrap">{p.status}</td>
                <td className={`p-2 font-bold whitespace-nowrap ${p.pretplata === "Aktivna" ? "text-green-700" : "text-red-700"}`}>
                  {p.pretplata} <span className="text-xs text-gray-500">({p.do})</span>
                </td>
                <td className="p-2 whitespace-nowrap">
                  <button
                    className="bg-red-900 text-white rounded px-3 py-1 hover:bg-red-800 transition text-xs w-full sm:w-auto"
                    onClick={() => handleRenew(p.kurs)}
                  >
                    {p.pretplata === "Aktivna" ? "Obnovi" : "Aktiviraj"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Fade desno za vizuelnu naznaku */}
        <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white via-white/80 to-transparent hidden sm:block" />
      </div>
      {message && (
        <div className="bg-green-100 text-green-800 rounded p-2 mt-4 text-center text-xs sm:text-sm">{message}</div>
      )}
    </div>
  );
}