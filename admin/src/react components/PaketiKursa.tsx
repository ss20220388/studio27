import React, { useEffect, useState } from "react";

// Paketi kursa (npr. Online / Online + Review / Live mentorship + AI) u izmeni kursa.
// Svaki paket je kartica koja se otvara: naziv, cena, podnaslov, kratak opis, istaknut red,
// tekst dugmeta i stavke (svaka posebno, sa oznakom "podebljano"). U bazi se stavke čuvaju
// kao tekst, jedna po redu, a podebljane su u **zvezdicama** (tako ih čita sajt).
// Kurs bez paketa se kupuje po ceni kursa, kao i do sada. Paket se čuva odmah (dugme "Sačuvaj").

interface Stavka {
  tekst: string;
  jako: boolean;
}

interface Paket {
  paketId?: number;
  naziv: string;
  cena: string;
  podnaslov: string;
  uvod: string;
  istaknuto: string;
  dugme: string;
  stavke: Stavka[];
  izmenjen?: boolean;
}

const prazanPaket = (): Paket => ({
  naziv: "", cena: "", podnaslov: "", uvod: "", istaknuto: "", dugme: "", stavke: [{ tekst: "", jako: false }], izmenjen: true,
});

// "**Podrška u grupnom chatu**" <-> { tekst: "Podrška u grupnom chatu", jako: true }
const uStavke = (opis: string): Stavka[] =>
  (opis || "").split("\n").map((s) => s.trim()).filter(Boolean).map((s) => {
    const cela = /^\*\*(.+)\*\*$/.exec(s);
    return cela && !cela[1].includes("**") ? { tekst: cela[1], jako: true } : { tekst: s, jako: false };
  });
const uOpis = (stavke: Stavka[]) =>
  stavke.map((s) => ({ ...s, tekst: s.tekst.trim() })).filter((s) => s.tekst)
    .map((s) => (s.jako && !s.tekst.includes("**") ? `**${s.tekst}**` : s.tekst)).join("\n");

const labelClass = "block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1";
const poljeClass =
  "w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-colors placeholder-neutral-600";

function Polje({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export default function PaketiKursa({ kursId, API_URL, accesToken }: {
  kursId: number; API_URL: string; accesToken: string | null;
}) {
  const [paketi, setPaketi] = useState<Paket[]>([]);
  const [otvoren, setOtvoren] = useState<number | null>(null);
  const [poruka, setPoruka] = useState<{ tekst: string; greska?: boolean } | null>(null);
  const [radi, setRadi] = useState<number | null>(null);

  const headers = {
    "Content-Type": "application/json",
    ...(accesToken ? { Authorization: `Bearer ${accesToken}` } : {}),
  };

  async function ucitaj() {
    try {
      const data = await fetch(`${API_URL}/api/paketi/${kursId}`).then((r) => r.json());
      setPaketi((Array.isArray(data) ? data : []).map((p: any) => ({
        paketId: p.paketId, naziv: p.naziv || "", cena: String(p.cena ?? ""),
        podnaslov: p.podnaslov || "", uvod: p.uvod || "", istaknuto: p.istaknuto || "", dugme: p.dugme || "",
        stavke: uStavke(p.opis || ""),
      })));
    } catch {
      setPoruka({ tekst: "Paketi nisu učitani.", greska: true });
    }
  }

  useEffect(() => {
    setPoruka(null);
    setOtvoren(null);
    ucitaj();
  }, [kursId]);

  const izmeni = (i: number, promena: Partial<Paket>) =>
    setPaketi((stari) => stari.map((p, j) => (j === i ? { ...p, ...promena, izmenjen: true } : p)));

  const izmeniStavku = (i: number, k: number, promena: Partial<Stavka>) =>
    izmeni(i, { stavke: paketi[i].stavke.map((s, m) => (m === k ? { ...s, ...promena } : s)) });

  const pomeriStavku = (i: number, k: number, smer: -1 | 1) => {
    const stavke = [...paketi[i].stavke];
    const cilj = k + smer;
    if (cilj < 0 || cilj >= stavke.length) return;
    [stavke[k], stavke[cilj]] = [stavke[cilj], stavke[k]];
    izmeni(i, { stavke });
  };

  async function sacuvaj(i: number) {
    const p = paketi[i];
    if (!p.naziv.trim() || !(Number(p.cena) > 0)) {
      return setPoruka({ tekst: "Paket mora imati naziv i cenu veću od nule.", greska: true });
    }
    setRadi(i);
    setPoruka(null);
    try {
      const res = await fetch(`${API_URL}/api/paketi${p.paketId ? `/${p.paketId}` : ""}`, {
        method: p.paketId ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          kursId, naziv: p.naziv, cena: Number(p.cena), opis: uOpis(p.stavke), redosled: i + 1,
          podnaslov: p.podnaslov, uvod: p.uvod, istaknuto: p.istaknuto, dugme: p.dugme,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Čuvanje nije uspelo.");
      await ucitaj();
      setOtvoren(null);
      setPoruka({ tekst: `Paket "${p.naziv}" je sačuvan.` });
    } catch (e: any) {
      setPoruka({ tekst: e?.message || "Čuvanje nije uspelo.", greska: true });
    } finally {
      setRadi(null);
    }
  }

  async function obrisi(i: number) {
    const p = paketi[i];
    if (!p.paketId) {
      setPaketi(paketi.filter((_, j) => j !== i));
      setOtvoren(null);
      return;
    }
    if (!window.confirm(`Obrisati paket "${p.naziv}"? Kupci koji su ga već kupili zadržavaju pristup.`)) return;
    setRadi(i);
    try {
      const res = await fetch(`${API_URL}/api/paketi/${p.paketId}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error();
      await ucitaj();
      setOtvoren(null);
      setPoruka({ tekst: `Paket "${p.naziv}" je obrisan.` });
    } catch {
      setPoruka({ tekst: "Brisanje nije uspelo.", greska: true });
    } finally {
      setRadi(null);
    }
  }

  function dodajPaket() {
    setPaketi([...paketi, prazanPaket()]);
    setOtvoren(paketi.length);
    setPoruka(null);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Paketi kursa</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {paketi.length ? "Kupac na stranici kursa bira jedan od paketa." : "Bez paketa kurs se kupuje po ceni kursa."}
          </p>
        </div>
        <button
          type="button"
          onClick={dodajPaket}
          className="cursor-pointer shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-200 bg-neutral-800 border border-neutral-700 hover:border-neutral-500"
        >
          + Dodaj paket
        </button>
      </div>

      <div className="space-y-2">
        {paketi.map((p, i) => {
          const jeOtvoren = otvoren === i;
          const brojStavki = p.stavke.filter((s) => s.tekst.trim()).length;
          return (
            <div key={p.paketId ?? `novi-${i}`} className={`rounded-lg border bg-neutral-900 ${jeOtvoren ? "border-neutral-500" : "border-neutral-700"}`}>
              {/* zaglavlje: klik otvara/zatvara paket */}
              <button
                type="button"
                onClick={() => setOtvoren(jeOtvoren ? null : i)}
                className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left"
                aria-expanded={jeOtvoren}
              >
                <span className="shrink-0 font-mono text-xs text-neutral-500">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-100 truncate">{p.naziv || "Novi paket"}</span>
                  <span className="block text-xs text-neutral-500 truncate">
                    {p.podnaslov || "Bez podnaslova"} · {brojStavki} {brojStavki === 1 ? "stavka" : "stavki"}
                  </span>
                </span>
                {p.izmenjen && <span className="shrink-0 text-[11px] text-amber-500">nije sačuvano</span>}
                <span className="shrink-0 text-sm font-semibold text-neutral-100">{p.cena ? `${p.cena} €` : "—"}</span>
                <span className={`shrink-0 text-neutral-500 transition-transform ${jeOtvoren ? "rotate-180" : ""}`}>▾</span>
              </button>

              {jeOtvoren && (
                <div className="border-t border-neutral-700 px-4 py-4 space-y-4">
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <Polje label="Naziv paketa">
                      <input value={p.naziv} onChange={(e) => izmeni(i, { naziv: e.target.value })} placeholder="Online + Review" className={poljeClass} />
                    </Polje>
                    <Polje label="Cena (€)">
                      <input type="number" min={1} value={p.cena} onChange={(e) => izmeni(i, { cena: e.target.value })} placeholder="420" className={poljeClass} />
                    </Polje>
                  </div>

                  <Polje label="Podnaslov">
                    <input value={p.podnaslov} onChange={(e) => izmeni(i, { podnaslov: e.target.value })} placeholder="Od nule do Level Up-a + analiza rada" className={poljeClass} />
                  </Polje>

                  <Polje label="Kratak opis">
                    <input value={p.uvod} onChange={(e) => izmeni(i, { uvod: e.target.value })} placeholder="Uči samostalno uz stručno usmeravanje." className={poljeClass} />
                  </Polje>

                  <div className="grid grid-cols-[1fr_160px] gap-3">
                    <Polje label="Istaknuto (crvenim slovima)">
                      <input value={p.istaknuto} onChange={(e) => izmeni(i, { istaknuto: e.target.value })} placeholder="Neograničen pristup" className={poljeClass} />
                    </Polje>
                    <Polje label="Tekst dugmeta">
                      <input value={p.dugme} onChange={(e) => izmeni(i, { dugme: e.target.value })} placeholder="Kupi kurs" className={poljeClass} />
                    </Polje>
                  </div>

                  <div>
                    <span className={labelClass}>Šta paket uključuje</span>
                    <ul className="space-y-1.5">
                      {p.stavke.map((s, k) => (
                        <li key={k} className="flex items-center gap-1.5">
                          <span className="shrink-0 w-4 text-center text-neutral-500">✓</span>
                          <input
                            value={s.tekst}
                            onChange={(e) => izmeniStavku(i, k, { tekst: e.target.value })}
                            onKeyDown={(e) => {
                              // Enter dodaje novu stavku ispod
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const stavke = [...p.stavke];
                                stavke.splice(k + 1, 0, { tekst: "", jako: false });
                                izmeni(i, { stavke });
                              }
                            }}
                            placeholder="Npr. Sve video lekcije"
                            className={`${poljeClass} h-9 ${s.jako ? "font-semibold" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => izmeniStavku(i, k, { jako: !s.jako })}
                            title={s.jako ? "Ukloni podebljano" : "Podebljano"}
                            aria-pressed={s.jako}
                            className={`cursor-pointer shrink-0 w-9 h-9 rounded-lg border text-sm font-bold ${s.jako ? "border-neutral-400 bg-neutral-700 text-neutral-100" : "border-neutral-700 text-neutral-500 hover:text-neutral-200"}`}
                          >
                            B
                          </button>
                          <button type="button" onClick={() => pomeriStavku(i, k, -1)} disabled={k === 0} title="Pomeri gore" className="cursor-pointer shrink-0 w-7 h-9 text-neutral-500 hover:text-neutral-200 disabled:opacity-30">↑</button>
                          <button type="button" onClick={() => pomeriStavku(i, k, 1)} disabled={k === p.stavke.length - 1} title="Pomeri dole" className="cursor-pointer shrink-0 w-7 h-9 text-neutral-500 hover:text-neutral-200 disabled:opacity-30">↓</button>
                          <button
                            type="button"
                            onClick={() => izmeni(i, { stavke: p.stavke.filter((_, m) => m !== k) })}
                            title="Ukloni stavku"
                            className="cursor-pointer shrink-0 w-7 h-9 text-neutral-500 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => izmeni(i, { stavke: [...p.stavke, { tekst: "", jako: false }] })}
                      className="cursor-pointer mt-2 text-xs font-medium text-neutral-400 hover:text-neutral-100"
                    >
                      + Dodaj stavku
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-700">
                    <button
                      type="button"
                      onClick={() => obrisi(i)}
                      disabled={radi === i}
                      className="cursor-pointer px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-neutral-800 disabled:opacity-60"
                    >
                      Obriši paket
                    </button>
                    <button
                      type="button"
                      onClick={() => sacuvaj(i)}
                      disabled={radi === i || !p.izmenjen}
                      className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
                    >
                      {radi === i ? "Čuvanje..." : "Sačuvaj paket"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {poruka && <p className={`mt-2 text-xs ${poruka.greska ? "text-red-400" : "text-emerald-500"}`}>{poruka.tekst}</p>}
    </div>
  );
}
