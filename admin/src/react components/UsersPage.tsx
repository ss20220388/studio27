import { set } from "astro:schema";
import React, { useState } from "react";

interface User {
  id: number;
  ime: string;
  prezime: string;
  email: string;
  telefon: string;
  datumRegistracije: string;
  status: "aktivan" | "neaktivan";
  deviceId: string | null;
  deviceInfo: string | null;

  kursevi: Kurs[];
}

interface StudentApiResponse {
  studentId: number;
  ime: string;
  prezime: string;
  email: string;
  brojTelefona: string;
  deviceId: string | null;
  userId: number;
  active: number;
  kursevi: Kurs[];
}
interface Kurs {
  kursId: number;
  naziv: string;
}

interface UsersPageProps {
  students: StudentApiResponse[];
  sviKursevi: Kurs[];
  token: string;
}

// Input component
const Input = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600"
    />
  </div>
);

// Modal wrapper
const Modal = ({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md cursor-pointer flex items-center justify-center text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export default function UsersPage({ students, sviKursevi, token }: UsersPageProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 20;

  const allUsers: User[] = students.map((student) => ({
    id: student.studentId,
    ime: student.ime,
    prezime: student.prezime,
    email: student.email,
    telefon: student.brojTelefona ?? "",
    datumRegistracije: "-",
    status: (student.active == 1 ? "aktivan" : "neaktivan") as "aktivan" | "neaktivan",
    deviceId: student.deviceId,
    deviceInfo: null,
    kursevi: student.kursevi,
  }));


  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deviceUser, setDeviceUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = React.useState("");

  // Add form
  const [addForm, setAddForm] = useState({ ime: "", prezime: "", email: "", telefon: "" });

  const filtered = allUsers.filter(
    (u) =>
      u.ime.toLowerCase().includes(search.toLowerCase()) ||
      u.prezime.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const users = filtered.slice(page * limit, (page + 1) * limit);

  function handleAddCourse() {
    if (!selectedCourse || !editUser) return;
    const kurs = sviKursevi.find((k) => k.kursId == parseInt(selectedCourse));
    if (!kurs) return;
    if (editUser.kursevi.some((k) => k.kursId === kurs.kursId)) {
      setSelectedCourse("");
      return;
    }
    setEditUser({
      ...editUser,
      kursevi: [...editUser.kursevi, kurs],
    });
    setSelectedCourse("");
  }

  async function dodajKorisnikaUBazu() {
    try {
      const response = await fetch("/api/auth/register-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          ime: addForm.ime,
          prezime: addForm.prezime,
          email: addForm.email,
          brojTelefona: addForm.telefon,
        }),
      });
      window.location.reload();
    }
    catch (error) {
      console.log("Greška prilikom dodavanja korisnika:", error);
    }

  }


  async function obrisiKorisnika(studentId:number) {
    try {
      const response = await fetch("/api/obrisi-studenta", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: studentId.toString(),
      });
      setDeleteUser(null);
      window.location.reload();
    }
    catch (error) {
      console.log("Greška prilikom brisanja korisnika:", error);
    }
  }


  async function ukloniDeviceId() {
    if (!deviceUser) return;
    try {
      const response = await fetch("/api/unlock-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ email: deviceUser.email }),
      });
      setDeviceUser(null);
      window.location.reload();
    } catch (error) {
      console.log("Greška prilikom uklanjanja Device ID-a:", error);
    }
  }

  async function editujKorisnika() {
    if (!editUser) return;
    try {
      const response = await fetch("/api/edit-student-sa-adminom", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          studentId: editUser.id,
          ime: editUser.ime,
          prezime: editUser.prezime,
          email: editUser.email,
          brojTelefona: editUser.telefon,
          kursevi: editUser.kursevi.map(k => k.kursId)
        })
      });
      setEditUser(null);
      window.location.reload();
    } catch (error) {
      console.log("Greška prilikom uređivanja korisnika:", error);
    }
  }


  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
          <h1 className="text-2xl font-bold text-white">Korisnici</h1>
          <p className="text-sm text-neutral-500 mt-1">Pregled i upravljanje korisničkim nalozima</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ paddingInline: "20px", paddingBlock: "10px", marginBottom: "10px" }}
          className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-900 hover:bg-red-800 text-white text-sm font-medium transition-colors duration-200 shadow-lg shadow-red-900/20 shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Dodaj korisnika
        </button>
      </div>

      <div className="relative max-w-sm" style={{ marginBlock: "10px" }}>
        <input
          type="text"
          placeholder="Pretraži korisnike..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ paddingInline: "15px", paddingBlock: "10px" }}
          className="w-full h-10 pl-11 pr-4 text-sm text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-lg outline-none focus:border-neutral-700 transition-colors duration-200 placeholder-neutral-600"
        />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {["ID", "Korisnik", "Email", "Status", "Uređaj", "Akcije"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-5 py-3 text-neutral-500 font-mono text-xs">#{u.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300">
                        {u.ime[0]}
                        {u.prezime[0]}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-200">
                          {u.ime} {u.prezime}
                        </p>
                        <p className="text-[11px] text-neutral-500">{u.datumRegistracije}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${u.status === "aktivan"
                        ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30"
                        : "bg-neutral-800 text-neutral-500 border border-neutral-700"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${u.status === "aktivan" ? "bg-emerald-400" : "bg-neutral-600"
                          }`}
                      />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.deviceId ? (
                      <button
                        onClick={() => setDeviceUser(u)}
                        className="flex items-center gap-1.5 text-xs text-amber-400 cursor-pointer hover:text-amber-300 transition-colors"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path
                            fillRule="evenodd"
                            d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {u.deviceId.slice(0, 10)}...
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditUser(u)}
                        className="p-1.5 rounded-md cursor-pointer text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Izmeni"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteUser(u)}
                        className="p-1.5 rounded-md cursor-pointer text-neutral-500 hover:text-red-400 hover:bg-red-900/10 transition-colors"
                        title="Obriši"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-neutral-500">
                    Nema pronađenih korisnika.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800">
          <p className="text-xs text-neutral-500">
            {total === 0
              ? "Prikazano 0 od 0"
              : `Prikazano ${page * limit + 1}–${Math.min((page + 1) * limit, total)} od ${total}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${i === page
                  ? "bg-red-900 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1 || total === 0}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Dodaj korisnika">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ime" value={addForm.ime} onChange={(v) => setAddForm({ ...addForm, ime: v })} placeholder="Ime" />
            <Input label="Prezime" value={addForm.prezime} onChange={(v) => setAddForm({ ...addForm, prezime: v })} placeholder="Prezime" />
          </div>
          <Input label="Email" value={addForm.email} onChange={(v) => setAddForm({ ...addForm, email: v })} type="email" placeholder="email@primer.com" />
          <Input label="Telefon" value={addForm.telefon} onChange={(v) => setAddForm({ ...addForm, telefon: v })} placeholder="+381..." />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Otkaži
            </button>
            <button
              onClick={() => {
                dodajKorisnikaUBazu();
                setShowAdd(false);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">
              Sačuvaj
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Izmeni korisnika">
        {editUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Ime" value={editUser.ime} onChange={(v) => setEditUser({ ...editUser, ime: v })} />
              <Input label="Prezime" value={editUser.prezime} onChange={(v) => setEditUser({ ...editUser, prezime: v })} />
            </div>
            <Input label="Email" value={editUser.email} onChange={(v) => setEditUser({ ...editUser, email: v })} type="email" />
            <Input label="Telefon" value={editUser.telefon} onChange={(v) => setEditUser({ ...editUser, telefon: v })} />
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                Kursevi
              </label>
              <div className="flex flex-wrap gap-1.5">
                {editUser.kursevi.map((k) => (
                  <div
                    key={k.kursId}
                    className="flex items-center gap-1 bg-neutral-800 text-neutral-300 text-xs font-medium px-2 py-1 rounded-md max-w-[180px]"
                  >
                    <span className="truncate">{k.naziv}</span>

                    <button
                      onClick={() =>
                        setEditUser({
                          ...editUser,
                          kursevi: editUser.kursevi.filter((c) => c.kursId !== k.kursId),
                        })
                      }
                      className="text-red-400 hover:text-red-300 ml-1 cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-3 items-center">
                  <div className="relative flex-1 max-w-[220px]">
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full appearance-none  bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 pr-8 text-sm text-neutral-200 outline-none focus:border-red-900  transition-all duration-200 cursor-pointer"
                    >
                      <option value="" className="bg-neutral-800 text-neutral-500">Izaberi kurs...</option>
                      {sviKursevi.map((k) => (
                        <option key={k.kursId} value={k.kursId} className="bg-neutral-800 hover:bg-red-900 focus:bg-red-900  text-neutral-200">
                          {k.naziv}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-neutral-500">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddCourse()}
                    disabled={!selectedCourse}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors duration-200 shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Dodaj
                  </button>
                </div>

              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Otkaži
              </button>
              <button 
              onClick={() => editujKorisnika()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">
                Sačuvaj izmene
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deviceUser} onClose={() => setDeviceUser(null)} title="Upravljanje uređajem">
        {deviceUser && (
          <div className="space-y-4">
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Device ID</span>
                <code className="text-xs text-amber-400 font-mono bg-neutral-800 px-2 py-0.5 rounded">
                  {deviceUser.deviceId}
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Korisnik</span>
                <span className="text-xs text-neutral-300">
                  {deviceUser.ime} {deviceUser.prezime}
                </span>
              </div>
            </div>

            <div className="bg-amber-900/10 border border-amber-800/20 rounded-lg p-3">
              <p className="text-xs text-amber-400">
                Uklanjanjem Device ID-a korisnik će moći da se prijavi sa novog uređaja.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeviceUser(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Zatvori
              </button>
              <button 
              onClick={() => ukloniDeviceId()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-700 hover:bg-amber-600 transition-colors">
                Ukloni Device ID
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)} title="Obriši studenta">
        {deleteUser && (
          <div className="space-y-4">
            <p>Da li ste sigurni da želite da obrišete studenta {deleteUser.ime} {deleteUser.prezime}?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteUser(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Otkaži
              </button>
              <button 
              onClick={()=> obrisiKorisnika(deleteUser.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">
                Obriši
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}