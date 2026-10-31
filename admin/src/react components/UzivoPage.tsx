import { API_URL } from "../lib/adrese";
import React, { useEffect, useState } from "react";

// Ko je trenutno u web aplikaciji i koji video gleda (plejer se javlja na svakih 20 s).
// Lista se sama osvežava na 15 s.

interface Prisutan {
  email: string;
  ime?: string;
  prezime?: string;
  kurs?: string;
  kursId?: number;
  lekcija?: string;
  paket?: string | null;
  gleda: boolean;
  sekunda: number;
  trajanje: number;
  od: string;
  poslednji: string;
}

const OSVEZAVANJE_MS = 15000;

const vreme = (s: number) => {
  const sek = Math.max(0, Math.round(s));
  const h = Math.floor(sek / 3600);
  const m = Math.floor((sek % 3600) / 60);
  const ss = String(sek % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

const lepNaziv = (s?: string) => (s && s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s || "");

const pre = (iso: string, sada: number) => {
  const min = Math.floor((sada - new Date(iso).getTime()) / 60000);
  if (min < 1) return "upravo";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
};

export default function UzivoPage({ token }: { token: string }) {
  const [prisutni, setPrisutni] = useState<Prisutan[]>([]);
  const [greska, setGreska] = useState("");
  const [osvezeno, setOsvezeno] = useState<Date | null>(null);
  const [sada, setSada] = useState(Date.now());

  async function ucitaj() {
    try {
      const res = await fetch(`${API_URL}/api/admin-uzivo`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(res.status === 403 ? "Nemate dozvolu." : "Server ne odgovara.");
      setPrisutni(await res.json());
      setGreska("");
      setOsvezeno(new Date());
    } catch (e: any) {
      setGreska(e?.message || "Lista nije učitana.");
    }
    setSada(Date.now());
  }

  useEffect(() => {
    ucitaj();
    const t = setInterval(() => {
      if (!document.hidden) ucitaj();
    }, OSVEZAVANJE_MS);
    return () => clearInterval(t);
  }, []);

  const gledaju = prisutni.filter((p) => p.gleda).length;

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Pregled</p>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-3">
            Uživo
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Ko je trenutno u web aplikaciji i koji video gleda. Osvežava se samo na 15 sekundi.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">U aplikaciji</p>
            <p className="text-xl font-bold text-neutral-100">{prisutni.length}</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Gledaju sada</p>
            <p className="text-xl font-bold text-emerald-500">{gledaju}</p>
          </div>
        </div>
      </div>

      {greska && <p className="text-sm text-red-400">{greska}</p>}

      {prisutni.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900 px-6 py-14 text-center">
          <p className="text-sm text-neutral-400">Trenutno niko ne gleda kurseve.</p>
          <p className="text-xs text-neutral-600 mt-1">Korisnik se pojavi ovde čim pusti video u aplikaciji.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  {["Korisnik", "Kurs i lekcija", "Status", "Napredak videa", "U aplikaciji"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prisutni.map((p) => {
                  const procenat = p.trajanje > 0 ? Math.min(100, (p.sekunda / p.trajanje) * 100) : 0;
                  return (
                    <tr key={p.email} className="border-b border-neutral-800/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-neutral-200">{[p.ime, p.prezime].filter(Boolean).join(" ") || p.email}</p>
                        <p className="text-[11px] text-neutral-500">{p.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-neutral-200">{lepNaziv(p.kurs) || "—"}</p>
                        <p className="text-[11px] text-neutral-500">
                          {p.lekcija || "Nepoznata lekcija"}
                          {p.paket && <span className="ml-2 text-blue-400">{p.paket}</span>}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            p.gleda
                              ? "bg-emerald-900/20 text-emerald-500 border-emerald-800/30"
                              : "bg-neutral-800 text-neutral-400 border-neutral-700"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.gleda ? "bg-emerald-500" : "bg-neutral-500"}`} />
                          {p.gleda ? "Gleda" : "Pauzirano"}
                        </span>
                      </td>
                      <td className="px-5 py-3 min-w-[180px]">
                        <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${procenat}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-500">
                          {vreme(p.sekunda)}{p.trajanje > 0 ? ` / ${vreme(p.trajanje)}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-xs text-neutral-400 whitespace-nowrap">{pre(p.od, sada)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {osvezeno && <p className="text-[11px] text-neutral-600">Poslednje osvežavanje: {osvezeno.toLocaleTimeString("sr-RS")}</p>}
    </div>
  );
}
