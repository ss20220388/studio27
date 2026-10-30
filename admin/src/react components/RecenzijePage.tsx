import { API_URL } from "../lib/adrese";
import React, { useEffect, useState } from "react";
import { SharedModal } from "./SharedModal";

// Recenzije polaznika: tekst, kurs, Instagram nalog i ime (za utiske sa Instagrama,
// bez naloga na sajtu). Prikazuju se na stranici kursa i na početnoj.

interface Recenzija {
  id: number;
  opis: string;
  ocena: number;
  datum: string | null;
  instagram: string | null;
  ime: string | null;
  student: { ime?: string; prezime?: string } | null;
  kurs: { id: number; naziv: string } | null;
}

interface Kurs {
  id: number;
  naziv: string;
}

const prazna = { opis: "", kursId: "", instagram: "", ime: "", ocena: 5 };

const labelClass = "block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5";
const poljeClass =
  "w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600";

export default function RecenzijePage({ token }: { token: string }) {
  const [recenzije, setRecenzije] = useState<Recenzija[]>([]);
  const [kursevi, setKursevi] = useState<Kurs[]>([]);
  const [filter, setFilter] = useState("");
  const [ucitava, setUcitava] = useState(true);
  const [greska, setGreska] = useState("");

  const [forma, setForma] = useState(prazna);
  const [menjaSe, setMenjaSe] = useState<number | null>(null);
  const [otvoreno, setOtvoreno] = useState(false);
  const [zaBrisanje, setZaBrisanje] = useState<Recenzija | null>(null);
  const [cuvanje, setCuvanje] = useState(false);
  const [greskaForme, setGreskaForme] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function ucitaj() {
    setUcitava(true);
    setGreska("");
    try {
      const [r, k] = await Promise.all([
        fetch(`${API_URL}/api/recenzije`).then((x) => x.json()),
        fetch(`${API_URL}/api/kursevi-sa-lekcijama`).then((x) => x.json()),
      ]);
      setRecenzije(Array.isArray(r) ? [...r].reverse() : []);
      setKursevi(Array.isArray(k) ? k.map((x: any) => ({ id: x.id, naziv: x.naziv })) : []);
    } catch {
      setGreska("Recenzije nisu učitane. Proverite da li server radi.");
    } finally {
      setUcitava(false);
    }
  }

  useEffect(() => {
    ucitaj();
  }, []);

  function otvoriNovu() {
    setForma({ ...prazna, kursId: filter });
    setMenjaSe(null);
    setGreskaForme("");
    setOtvoreno(true);
  }

  function otvoriIzmenu(r: Recenzija) {
    setForma({
      opis: r.opis || "",
      kursId: r.kurs?.id ? String(r.kurs.id) : "",
      instagram: r.instagram || "",
      ime: r.ime || "",
      ocena: r.ocena || 5,
    });
    setMenjaSe(r.id);
    setGreskaForme("");
    setOtvoreno(true);
  }

  async function sacuvaj() {
    if (!forma.opis.trim()) return setGreskaForme("Upišite tekst recenzije.");
    setCuvanje(true);
    setGreskaForme("");
    try {
      const res = await fetch(`${API_URL}/api/admin-recenzije${menjaSe ? `/${menjaSe}` : ""}`, {
        method: menjaSe ? "PUT" : "POST",
        headers,
        body: JSON.stringify({ ...forma, kursId: forma.kursId ? Number(forma.kursId) : null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Čuvanje nije uspelo.");
      }
      setOtvoreno(false);
      await ucitaj();
    } catch (e: any) {
      setGreskaForme(e?.message || "Čuvanje nije uspelo.");
    } finally {
      setCuvanje(false);
    }
  }

  async function obrisi() {
    if (!zaBrisanje) return;
    setCuvanje(true);
    try {
      const res = await fetch(`${API_URL}/api/admin-recenzije/${zaBrisanje.id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error();
      setZaBrisanje(null);
      await ucitaj();
    } catch {
      setGreska("Brisanje nije uspelo.");
      setZaBrisanje(null);
    } finally {
      setCuvanje(false);
    }
  }

  const autor = (r: Recenzija) =>
    r.ime || [r.student?.ime, r.student?.prezime].filter(Boolean).join(" ") || "Polaznik";

  const prikazane = filter ? recenzije.filter((r) => String(r.kurs?.id ?? "") === filter) : recenzije;

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
          <h1 className="text-2xl font-bold text-neutral-100">Recenzije</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Utisci polaznika koji se prikazuju na stranici kursa. Instagram nalog se prikazuje uz recenziju.
          </p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${poljeClass} h-10 w-auto`}>
            <option value="">Svi kursevi</option>
            {kursevi.map((k) => (
              <option key={k.id} value={k.id}>{k.naziv}</option>
            ))}
          </select>
          <button
            onClick={otvoriNovu}
            className="cursor-pointer shrink-0 px-4 py-2.5 rounded-lg bg-red-900 hover:bg-red-800 text-white text-sm font-medium transition-colors"
          >
            + Dodaj recenziju
          </button>
        </div>
      </div>

      {greska && <p className="text-sm text-red-400">{greska}</p>}

      {ucitava ? (
        <p className="text-sm text-neutral-500">Učitavanje...</p>
      ) : prikazane.length === 0 ? (
        <p className="text-sm text-neutral-500">Nema recenzija{filter ? " za ovaj kurs" : ""}.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {prikazane.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-100 truncate">{autor(r)}</p>
                  <p className={`text-xs truncate ${r.instagram ? "text-neutral-400" : "text-amber-500"}`}>
                    {r.instagram ? `@${r.instagram}` : "Instagram nalog nije unet"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-neutral-500">{"★".repeat(r.ocena || 5)}</span>
              </div>
              <p className="text-sm text-neutral-300 line-clamp-5 whitespace-pre-line">{r.opis}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-neutral-800">
                <span className="text-[11px] text-neutral-500 truncate">{r.kurs?.naziv || "Bez kursa"}</span>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => otvoriIzmenu(r)}
                    className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                  >
                    Izmeni
                  </button>
                  <button
                    onClick={() => setZaBrisanje(r)}
                    className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-red-400 hover:bg-neutral-800"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SharedModal open={otvoreno} onClose={() => setOtvoreno(false)} title={menjaSe ? "Izmeni recenziju" : "Nova recenzija"}>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Kurs</label>
            <select value={forma.kursId} onChange={(e) => setForma({ ...forma, kursId: e.target.value })} className={`${poljeClass} h-10`}>
              <option value="">Bez kursa</option>
              {kursevi.map((k) => (
                <option key={k.id} value={k.id}>{k.naziv}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Instagram nalog</label>
              <input
                value={forma.instagram}
                onChange={(e) => setForma({ ...forma, instagram: e.target.value })}
                placeholder="@ime.prezime"
                className={`${poljeClass} h-10`}
              />
            </div>
            <div>
              <label className={labelClass}>Ime (opciono)</label>
              <input
                value={forma.ime}
                onChange={(e) => setForma({ ...forma, ime: e.target.value })}
                placeholder="Npr. Ana"
                className={`${poljeClass} h-10`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Tekst recenzije</label>
            <textarea
              value={forma.opis}
              onChange={(e) => setForma({ ...forma, opis: e.target.value })}
              rows={7}
              className={`${poljeClass} resize-y`}
            />
          </div>
          <div>
            <label className={labelClass}>Ocena</label>
            <select value={forma.ocena} onChange={(e) => setForma({ ...forma, ocena: Number(e.target.value) })} className={`${poljeClass} h-10 w-32`}>
              {[5, 4, 3, 2, 1].map((o) => (
                <option key={o} value={o}>{"★".repeat(o)}</option>
              ))}
            </select>
          </div>
          {greskaForme && <p className="text-xs text-red-400">{greskaForme}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOtvoreno(false)} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800">
              Otkaži
            </button>
            <button onClick={sacuvaj} disabled={cuvanje} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 disabled:opacity-60">
              {cuvanje ? "Čuvanje..." : "Sačuvaj"}
            </button>
          </div>
        </div>
      </SharedModal>

      <SharedModal open={!!zaBrisanje} onClose={() => setZaBrisanje(null)} title="Obriši recenziju">
        <div className="space-y-4">
          <p className="text-sm text-neutral-300">
            Da li ste sigurni da želite da obrišete recenziju od <span className="font-bold text-white">{zaBrisanje && autor(zaBrisanje)}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setZaBrisanje(null)} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800">
              Otkaži
            </button>
            <button onClick={obrisi} disabled={cuvanje} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 disabled:opacity-60">
              Obriši
            </button>
          </div>
        </div>
      </SharedModal>
    </div>
  );
}
