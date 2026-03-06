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
    <>
      <h2 className="text-xl font-bold mb-4">Moja plaćanja</h2>
      <table className="w-full text-sm border mb-6">
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
            <tr key={p.id} className="text-center">
              <td className="p-2">{p.kurs}</td>
              <td className="p-2">{p.datum}</td>
              <td className="p-2">{p.iznos}</td>
              <td className="p-2">{p.status}</td>
              <td className={`p-2 font-bold ${p.pretplata === "Aktivna" ? "text-green-700" : "text-red-700"}`}>
                {p.pretplata} <span className="text-xs text-gray-500">({p.do})</span>
              </td>
              <td className="p-2">
                <button
                  className="bg-red-900 text-white rounded px-3 py-1 hover:bg-red-800 transition text-xs"
                  onClick={() => handleRenew(p.kurs)}
                >
                  {p.pretplata === "Aktivna" ? "Obnovi" : "Aktiviraj"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && (
        <div className="bg-green-100 text-green-800 rounded p-2 mb-2 text-center">{message}</div>
      )}
    </>
  );
}