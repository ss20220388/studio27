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
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
      {subscriptions.map((sub, idx) => (
        <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-neutral-700 transition-colors">
          <div>
            <div className="text-lg font-semibold text-neutral-100">{sub.kurs}</div>
            <div className="text-neutral-400 text-sm mt-1">{sub.cena}</div>
            <div className={`font-semibold text-sm mt-1 ${sub.status === "Aktivna" ? "text-emerald-400" : "text-red-400"}`}>{sub.status}</div>
            <div className="text-xs text-neutral-500 mt-1">Važi do: {sub.do}</div>
            {sub.sledeceZaduzenje && (
              <div className="text-xs text-neutral-600">Sledeće zaduženje: {sub.sledeceZaduzenje}</div>
            )}
          </div>
          <div className="mt-2 sm:mt-0">
            <button className="bg-red-900 text-white rounded-lg px-4 py-2 hover:bg-red-800 transition-colors text-sm font-medium w-full sm:w-auto">
              {sub.status === "Aktivna" ? "Obnovi" : "Aktiviraj"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}