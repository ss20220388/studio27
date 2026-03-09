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
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-sm min-w-[550px]">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Kurs", "Datum", "Iznos", "Status", "Pretplata", "Akcija"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fakePayments.map(p => (
              <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-3 text-neutral-200 font-medium">{p.kurs}</td>
                <td className="px-4 py-3 text-neutral-400">{p.datum}</td>
                <td className="px-4 py-3 text-neutral-300">{p.iznos}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-900/20 text-emerald-400 border border-emerald-800/30">
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${p.pretplata === "Aktivna" ? "text-emerald-400" : "text-red-400"}`}>
                    {p.pretplata}
                  </span>
                  <span className="text-[10px] text-neutral-600 ml-1">({p.do})</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    className="px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-white text-xs font-medium transition-colors"
                    onClick={() => handleRenew(p.kurs)}
                  >
                    {p.pretplata === "Aktivna" ? "Obnovi" : "Aktiviraj"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && (
        <div className="bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 rounded-lg p-3 mt-4 text-xs text-center">{message}</div>
      )}
    </div>
  );
}