import React, { useState } from "react";
const fakeUser = { ime: "Petar", prezime: "Petrović", email: "petar@mail.com" };
export default function ProfileTab() {
  const [user, setUser] = useState(fakeUser);
  const [password, setPassword] = useState("");
  const [notif, setNotif] = useState({ email: true, sms: false });
  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); alert("Podaci sačuvani! (demo)"); }}>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Ime</label>
          <input className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" value={user.ime} onChange={e => setUser(u => ({ ...u, ime: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Prezime</label>
          <input className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" value={user.prezime} onChange={e => setUser(u => ({ ...u, prezime: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Email</label>
          <input className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" value={user.email} onChange={e => setUser(u => ({ ...u, email: e.target.value }))} />
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-red-900 hover:bg-red-800 text-white text-sm font-medium transition-colors">Sačuvaj promene</button>
      </form>
      <div className="border-t border-neutral-800 pt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Promena lozinke</h3>
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); alert("Lozinka promenjena! (demo)"); setPassword(""); }}>
          <input type="password" className="flex-1 h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" placeholder="Nova lozinka" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm font-medium hover:bg-neutral-700 transition-colors">Promeni</button>
        </form>
      </div>
      <div className="border-t border-neutral-800 pt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Obaveštenja</h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={notif.email} onChange={e => setNotif(n => ({ ...n, email: e.target.checked }))} className="accent-red-900" /> Email
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={notif.sms} onChange={e => setNotif(n => ({ ...n, sms: e.target.checked }))} className="accent-red-900" /> SMS
          </label>
        </div>
      </div>
    </div>
  );
}