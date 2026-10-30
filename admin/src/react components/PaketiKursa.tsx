import React, { useEffect, useState } from "react";

// Paketi kursa (npr. Online / Online + Review / Live mentorship + AI) u izmeni kursa.
// Svaki paket ima svoju cenu i stavke (jedna po redu); kupac na sajtu bira paket.
// Kurs bez paketa se kupuje po ceni kursa, kao i do sada. Paket se čuva odmah (dugme "Sačuvaj").

interface Paket {
  paketId?: number;
  naziv: string;
  cena: string;
  opis: string;
  izmenjen?: boolean;
}

const poljeClass =
  "w-full px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600";

export default function PaketiKursa({ kursId, API_URL, accesToken }: {
  kursId: number; API_URL: string; accesToken: string | null;
}) {
  const [paketi, setPaketi] = useState<Paket[]>([]);
  const [poruka, setPoruka] = useState("");
  const [radi, setRadi] = useState<number | null>(null);

  const headers = {
    "Content-Type": "application/json",
    ...(accesToken ? { Authorization: `Bearer ${accesToken}` } : {}),
  };

  async function ucitaj() {
    try {
      const data = await fetch(`${API_URL}/api/paketi/${kursId}`).then((r) => r.json());
      setPaketi((Array.isArray(data) ? data : []).map((p: any) => ({
        paketId: p.paketId, naziv: p.naziv || "", cena: String(p.cena ?? ""), opis: p.opis || "",
      })));
    } catch {
      setPoruka("Paketi nisu učitani.");
    }
  }

  useEffect(() => {
    setPoruka("");
    ucitaj();
  }, [kursId]);

  const promeni = (i: number, polje: keyof Paket, vrednost: string) =>
    setPaketi(paketi.map((p, j) => (j === i ? { ...p, [polje]: vrednost, izmenjen: true } : p)));

  async function sacuvaj(i: number) {
    const p = paketi[i];
    if (!p.naziv.trim() || !(Number(p.cena) > 0)) return setPoruka("Paket mora imati naziv i cenu veću od nule.");
    setRadi(i);
    setPoruka("");
    try {
      const res = await fetch(`${API_URL}/api/paketi${p.paketId ? `/${p.paketId}` : ""}`, {
        method: p.paketId ? "PUT" : "POST",
        headers,
        body: JSON.stringify({ kursId, naziv: p.naziv, cena: Number(p.cena), opis: p.opis, redosled: i + 1 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Čuvanje nije uspelo.");
      await ucitaj();
      setPoruka(`Paket "${p.naziv}" je sačuvan.`);
    } catch (e: any) {
      setPoruka(e?.message || "Čuvanje nije uspelo.");
    } finally {
      setRadi(null);
    }
  }

  async function obrisi(i: number) {
    const p = paketi[i];
    if (!p.paketId) return setPaketi(paketi.filter((_, j) => j !== i));
    if (!window.confirm(`Obrisati paket "${p.naziv}"? Kupci koji su ga već kupili zadržavaju pristup.`)) return;
    setRadi(i);
    try {
      const res = await fetch(`${API_URL}/api/paketi/${p.paketId}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error();
      await ucitaj();
      setPoruka(`Paket "${p.naziv}" je obrisan.`);
    } catch {
      setPoruka("Brisanje nije uspelo.");
    } finally {
      setRadi(null);
    }
  }

  return (
    <div>
      <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
        Paketi kursa
        <span className="normal-case tracking-normal text-neutral-600"> · bez paketa kurs se kupuje po ceni kursa</span>
      </label>
      <div className="space-y-3">
        {paketi.map((p, i) => (
          <div key={p.paketId ?? `novi-${i}`} className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={p.naziv}
                onChange={(e) => promeni(i, "naziv", e.target.value)}
                placeholder="Naziv, npr. Online + Review"
                className={`${poljeClass} h-9 flex-1`}
              />
              <input
                type="number"
                value={p.cena}
                onChange={(e) => promeni(i, "cena", e.target.value)}
                placeholder="Cena €"
                className={`${poljeClass} h-9 w-28`}
              />
            </div>
            <textarea
              value={p.opis}
              onChange={(e) => promeni(i, "opis", e.target.value)}
              placeholder={"Šta paket uključuje, jedna stavka po redu:\nVideo lekcije\nFeedback na rendere"}
              rows={3}
              className={`${poljeClass} py-2 resize-y`}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => obrisi(i)}
                disabled={radi === i}
                className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-red-400 hover:bg-neutral-800 disabled:opacity-60"
              >
                Obriši
              </button>
              <button
                type="button"
                onClick={() => sacuvaj(i)}
                disabled={radi === i || (!!p.paketId && !p.izmenjen)}
                className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
              >
                {radi === i ? "Čuvanje..." : "Sačuvaj paket"}
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPaketi([...paketi, { naziv: "", cena: "", opis: "" }])}
          className="cursor-pointer w-full rounded-lg border border-dashed border-neutral-700 py-2.5 text-xs text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800"
        >
          + Dodaj paket
        </button>
      </div>
      {poruka && <p className="mt-1.5 text-[11px] text-neutral-400">{poruka}</p>}
    </div>
  );
}
