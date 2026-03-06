import React from "react";

const subscriptions = [
  {
    kurs: "3ds Max",
    cena: "999 RSD / mesec",
    status: "Aktivna",
    do: "2026-12-31",
    sledeceZaduzenje: "2026-04-01"
  },
  {
    kurs: "Photoshop",
    cena: "1499 RSD / mesec",
    status: "Neaktivna",
    do: "2025-11-15",
    sledeceZaduzenje: null
  }
];

export default function SubscriptionTab() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold mb-2">Pretplate po kursevima</h2>
      {subscriptions.map((sub, idx) => (
        <div key={idx} className="bg-gray-50 rounded-lg p-6 shadow flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">{sub.kurs}</div>
            <div className="text-gray-700">{sub.cena}</div>
            <div className={`font-bold ${sub.status === "Aktivna" ? "text-green-700" : "text-red-700"}`}>{sub.status}</div>
            <div className="text-sm text-gray-500">Važi do: {sub.do}</div>
            {sub.sledeceZaduzenje && (
              <div className="text-xs text-gray-400">Sledeće zaduženje: {sub.sledeceZaduzenje}</div>
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <button className="bg-red-900 text-white rounded px-4 py-2 hover:bg-red-800 transition">
              {sub.status === "Aktivna" ? "Obnovi" : "Aktiviraj"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}