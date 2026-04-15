import React, { useState, useEffect } from "react";
import PaymentsTab from "../SettingsTabs/PaymentsTab";
import ProfileTab from "../SettingsTabs/ProfileTab";
import TermsTab from "../SettingsTabs/TermsTab";

export default function SettingsCard({ token }) {
  const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";
  const [tab, setTab] = useState("placanja");




  const tabs = [
    { id: "placanja", label: "Plaćanja" },
    { id: "licni", label: "Lični podaci" },
    { id: "pravila", label: "Pravila" },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden w-full">
      <div className="flex overflow-x-auto border-b border-neutral-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`flex-1 min-w-[100px] cursor-pointer px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? "text-red-400 border-b-2 border-red-900 bg-neutral-800/30"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/20"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5 sm:p-6">
        {tab === "placanja" && <PaymentsTab token={token} />}
        {tab === "licni" && <ProfileTab token={token} />}
        {tab === "pravila" && <TermsTab token={token} />}
      </div>
    </div>
  );
}