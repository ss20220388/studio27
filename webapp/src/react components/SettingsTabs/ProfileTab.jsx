import React, { useState } from "react";
const fakeUser = { ime: "Petar", prezime: "Petrović", email: "petar@mail.com" };
export default function ProfileTab() {
  const [user, setUser] = useState(fakeUser);
  const [password, setPassword] = useState("");
  const [notif, setNotif] = useState({ email: true, sms: false });
  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">Lični podaci</h2>
      <form className="flex flex-col gap-4 bg-white rounded-xl shadow p-4 sm:p-6" onSubmit={e => { e.preventDefault(); alert("Podaci sačuvani! (demo)"); }}>
        <div>
          <label className="block text-sm font-medium mb-1">Ime</label>
          <input className="border rounded px-3 py-2 w-full text-sm" value={user.ime} onChange={e => setUser(u => ({ ...u, ime: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prezime</label>
          <input className="border rounded px-3 py-2 w-full text-sm" value={user.prezime} onChange={e => setUser(u => ({ ...u, prezime: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="border rounded px-3 py-2 w-full text-sm" value={user.email} onChange={e => setUser(u => ({ ...u, email: e.target.value }))} />
        </div>
        <button type="submit" className="bg-red-900 text-white rounded px-4 py-2 hover:bg-red-800 transition w-full sm:w-auto">Sačuvaj promene</button>
      </form>
      <div className="mt-8 bg-white rounded-xl shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-2">Promena lozinke</h3>
        <form className="flex flex-col sm:flex-row gap-2" onSubmit={e => { e.preventDefault(); alert("Lozinka promenjena! (demo)"); setPassword(""); }}>
          <input type="password" className="border rounded px-3 py-2 text-sm flex-1" placeholder="Nova lozinka" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="bg-gray-800 text-white rounded px-4 py-2 hover:bg-gray-700 transition">Promeni</button>
        </form>
      </div>
      <div className="mt-8 bg-white rounded-xl shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-2">Obaveštenja</h3>
        <div className="flex gap-6 flex-wrap">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notif.email} onChange={e => setNotif(n => ({ ...n, email: e.target.checked }))} /> Email
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notif.sms} onChange={e => setNotif(n => ({ ...n, sms: e.target.checked }))} /> SMS
          </label>
        </div>
      </div>
    </div>
  );
}