import React, { useState } from "react";
import PaymentsTab from "../SettingsTabs/PaymentsTab";
import ProfileTab from "../SettingsTabs/ProfileTab";
import SubscriptionTab from "../SettingsTabs/SubscriptionTab";
import CardTab from "../SettingsTabs/CardTab";
import TermsTab from "../SettingsTabs/TermsTab";

export default function SettingsCard() {
  const [tab, setTab] = useState("placanja");

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-0 overflow-hidden max-w-2xl mx-auto">
      <div className="flex border-b bg-gray-50">
        <button className={`flex-1 py-3 text-center font-semibold transition ${tab === "placanja" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("placanja")}>Plaćanja</button>
        <button className={`flex-1 py-3 text-center font-semibold transition ${tab === "licni" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("licni")}>Lični podaci</button>
        <button className={`flex-1 py-3 text-center font-semibold transition ${tab === "pretplata" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("pretplata")}>Pretplata</button>
        <button className={`flex-1 py-3 text-center font-semibold transition ${tab === "kartica" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("kartica")}>Kartica</button>
        <button className={`flex-1 py-3 text-center font-semibold transition ${tab === "pravila" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("pravila")}>Pravila korišćenja</button>
      </div>
      <div className="p-8">
        {tab === "placanja" && <PaymentsTab />}
        {tab === "licni" && <ProfileTab />}
        {tab === "pretplata" && <SubscriptionTab />}
        {tab === "kartica" && <CardTab />}
        {tab === "pravila" && <TermsTab />}
      </div>
    </div>
  );
}