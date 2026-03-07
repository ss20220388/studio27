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
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">Pretplate po kursevima</h2>
      {subscriptions.map((sub, idx) => (
        <div key={idx} className="bg-gray-50 rounded-lg p-4 sm:p-6 shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-lg sm:text-xl font-semibold">{sub.kurs}</div>
            <div className="text-gray-700 text-sm sm:text-base">{sub.cena}</div>
            <div className={`font-bold text-sm sm:text-base ${sub.status === "Aktivna" ? "text-green-700" : "text-red-700"}`}>{sub.status}</div>
            <div className="text-xs sm:text-sm text-gray-500">Važi do: {sub.do}</div>
            {sub.sledeceZaduzenje && (
              <div className="text-xs text-gray-400">Sledeće zaduženje: {sub.sledeceZaduzenje}</div>
            )}
          </div>
          <div className="mt-2 sm:mt-0">
            <button className="bg-red-900 text-white rounded px-4 py-2 hover:bg-red-800 transition w-full sm:w-auto">
              {sub.status === "Aktivna" ? "Obnovi" : "Aktiviraj"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}