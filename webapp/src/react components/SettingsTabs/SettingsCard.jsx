import React, { useState } from "react";
import PaymentsTab from "../SettingsTabs/PaymentsTab";
import ProfileTab from "../SettingsTabs/ProfileTab";
import SubscriptionTab from "../SettingsTabs/SubscriptionTab";
import CardTab from "../SettingsTabs/CardTab";
import TermsTab from "../SettingsTabs/TermsTab";

export default function SettingsCard() {
  const [tab, setTab] = useState("placanja");

  return (
    <div className="bg-white rounded-2xl shadow-2xl px-2 sm:px-6 md:px-8 overflow-hidden w-full max-w-2xl mx-auto">
      <div className="flex flex-wrap gap-1 border-b bg-gray-50 px-1 sm:px-0">
        <button className={`flex-1 min-w-[120px] py-2 sm:py-3 text-center text-xs sm:text-base font-semibold transition ${tab === "placanja" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("placanja")}>Plaćanja</button>
        <button className={`flex-1 min-w-[120px] py-2 sm:py-3 text-center text-xs sm:text-base font-semibold transition ${tab === "licni" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("licni")}>Lični podaci</button>
        <button className={`flex-1 min-w-[120px] py-2 sm:py-3 text-center text-xs sm:text-base font-semibold transition ${tab === "pretplata" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("pretplata")}>Pretplata</button>
        <button className={`flex-1 min-w-[120px] py-2 sm:py-3 text-center text-xs sm:text-base font-semibold transition ${tab === "kartica" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("kartica")}>Kartica</button>
        <button className={`flex-1 min-w-[120px] py-2 sm:py-3 text-center text-xs sm:text-base font-semibold transition ${tab === "pravila" ? "bg-white border-b-2 border-red-800 text-red-900" : "hover:bg-gray-100"}`} onClick={() => setTab("pravila")}>Pravila korišćenja</button>
      </div>
      <div className="p-4 sm:p-6 md:p-8">
        {tab === "placanja" && <PaymentsTab />}
        {tab === "licni" && <ProfileTab />}
        {tab === "pretplata" && <SubscriptionTab />}
        {tab === "kartica" && <CardTab />}
        {tab === "pravila" && <TermsTab />}
      </div>
    </div>
  );
}