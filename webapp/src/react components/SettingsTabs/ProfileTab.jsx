import React, { useState } from "react";
const fakeUser = { ime: "Petar", prezime: "Petrović", email: "petar@mail.com" };
export default function ProfileTab() {
  const [user, setUser] = useState(fakeUser);
  const [password, setPassword] = useState("");
  const [notif, setNotif] = useState({ email: true, sms: false });
  return (
    <>
      <h2 className="text-xl font-bold mb-4">Lični podaci</h2>
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); alert("Podaci sačuvani! (demo)"); }}>
        <div>
          <label className="block text-sm font-medium">Ime</label>
          <input className="border rounded px-3 py-2 w-full" value={user.ime} onChange={e => setUser(u => ({ ...u, ime: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Prezime</label>
          <input className="border rounded px-3 py-2 w-full" value={user.prezime} onChange={e => setUser(u => ({ ...u, prezime: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input className="border rounded px-3 py-2 w-full" value={user.email} onChange={e => setUser(u => ({ ...u, email: e.target.value }))} />
        </div>
        <button type="submit" className="bg-red-900 text-white rounded px-4 py-2 hover:bg-red-800 transition">Sačuvaj promene</button>
      </form>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Promena lozinke</h3>
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); alert("Lozinka promenjena! (demo)"); setPassword(""); }}>
          <input type="password" className="border rounded px-3 py-2" placeholder="Nova lozinka" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="bg-gray-800 text-white rounded px-4 py-2 hover:bg-gray-700 transition">Promeni</button>
        </form>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Obaveštenja</h3>
        <div className="flex gap-6">
          <label>
            <input type="checkbox" checked={notif.email} onChange={e => setNotif(n => ({ ...n, email: e.target.checked }))} /> Email
          </label>
          <label>
            <input type="checkbox" checked={notif.sms} onChange={e => setNotif(n => ({ ...n, sms: e.target.checked }))} /> SMS
          </label>
        </div>
      </div>
    </>
  );
}