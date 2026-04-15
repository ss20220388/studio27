import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface Admin {
  userId: number;
  ime: string;
  prezime: string;
  email: string;
  deviceId: string | null;
}

interface AdminsPageProps {
  admins: Admin[];
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl relative"
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
    </div>,
    document.body
  );
};

export default function AdminsPage({ admins, token }: AdminsPageProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 20;

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ime: "", prezime: "", email: "", password: "" });

  const filtered = (admins || []).filter(
    (u) =>
      u.ime?.toLowerCase().includes(search.toLowerCase()) ||
      u.prezime?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const usersList = filtered.slice(page * limit, (page + 1) * limit);

  async function dodajAdmina() {
    try {
      const response = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          ime: addForm.ime,
          prezime: addForm.prezime,
          email: addForm.email,
          password: addForm.password,
        }),
      });

      if (!response.ok) {
        console.error("Greška pri dodavanju admina:", await response.text());
        return;
      }
      
      window.location.reload();
    } catch (error) {
      console.error("Greška prilikom dodavanja administratora:", error);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
          <h1 className="text-2xl font-bold text-white">Administratori</h1>
          <p className="text-sm text-neutral-500 mt-1">Pregled administratorskih naloga</p>
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
          Dodaj admina
        </button>
      </div>

      <div className="relative max-w-sm" style={{ marginBlock: "10px" }}>
        <input
          type="text"
          placeholder="Pretraži administratore..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ paddingInline: "15px", paddingBlock: "10px" }}
          className="w-full h-10 px-4 text-sm text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-lg outline-none focus:border-neutral-700 transition-colors duration-200 placeholder-neutral-600"
        />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {["ID", "Korisnik", "Email", "Uređaj"].map((h) => (
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
              {usersList.length > 0 ? usersList.map((u, i) => (
                <tr
                  key={u.userId || i}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-5 py-3 text-neutral-500 font-mono text-xs">#{u.userId}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300">
                        {u.ime?.[0] || "A"}
                        {u.prezime?.[0] || "K"}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-200">
                          {u.ime || "Admin"} {u.prezime || "Korisnik"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-400">{u.email}</td>
                  <td className="px-5 py-3">
                    {u.deviceId ? (
                      <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path
                            fillRule="evenodd"
                            d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {u.deviceId.substring(0, 10)}...
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-600">Nije prijavljen</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-neutral-500">
                    Nema pronađenih administratora.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800">
            <span className="text-xs font-medium text-neutral-500">
              Prikaz {page * limit + 1}-{Math.min((page + 1) * limit, total)} od {total}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
              >
                Prethodna
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
              >
                Sledeća
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Novi administrator">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ime" value={addForm.ime} onChange={(v) => setAddForm({ ...addForm, ime: v })} />
            <Input label="Prezime" value={addForm.prezime} onChange={(v) => setAddForm({ ...addForm, prezime: v })} />
          </div>
          <Input label="Email adresa" type="email" value={addForm.email} onChange={(v) => setAddForm({ ...addForm, email: v })} />
          <Input label="Lozinka" type="password" value={addForm.password} onChange={(v) => setAddForm({ ...addForm, password: v })} />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Odustani
            </button>
            <button
              onClick={dodajAdmina}
              className="cursor-pointer px-4 py-2 bg-red-900 hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors border border-red-800"
            >
              Sačuvaj administratora
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
