import React, { useEffect, useState } from "react";
import { otpremiSliku, slikaSrc } from "./SlikeKursa";

// Akcija na početnoj stranici (npr. Black Friday za sve kurseve): poseban vizual koji nije vezan za jedan kurs.
// Na početnoj se prikazuje velika traka ispod naslovnog ekrana i uska traka iznad menija, sa odbrojavanjem.
// Popusti pojedinačnih kurseva se i dalje podešavaju u izmeni kursa (Popust).

interface Forma {
  ukljucen: boolean;
  oznaka: string;
  naslov: string;
  tekst: string;
  boja: string;
  slika: string;
  do: string;
  dugme: string;
  link: string;
}

// prva je topla zlatna sa sajta (podrazumevana); crvena je za upadljiviji Black Friday
const BOJE = ["#c49a5a", "#e8dcc8", "#ffffff", "#e11d2a", "#b08d57", "#8fa58b"];
const labelClass = "block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1";
const poljeClass =
  "w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-colors placeholder-neutral-600";

const izPodataka = (a: any): Forma => ({
  ukljucen: !!a?.ukljucen,
  oznaka: a?.oznaka || "",
  naslov: a?.naslov || "",
  tekst: a?.tekst || "",
  boja: a?.boja || "#c49a5a",
  slika: a?.slika || "",
  do: a?.do ? String(a.do).slice(0, 16) : "",
  dugme: a?.dugme || "",
  link: a?.link || "/#edukacije",
});

// ponedeljak posle Black Friday-a u 23:59 (sledeće godine ako je prošao)
function krajBlackFridaya(): string {
  const sad = new Date();
  for (const godina of [sad.getFullYear(), sad.getFullYear() + 1]) {
    const prviNov = new Date(godina, 10, 1);
    const prviCetvrtak = 1 + ((4 - prviNov.getDay() + 7) % 7);
    const ponedeljak = new Date(godina, 10, prviCetvrtak + 21 + 4, 23, 59);
    if (ponedeljak > sad) {
      const d = (n: number) => String(n).padStart(2, "0");
      return `${ponedeljak.getFullYear()}-${d(ponedeljak.getMonth() + 1)}-${d(ponedeljak.getDate())}T23:59`;
    }
  }
  return "";
}

export default function AkcijaPocetna({ API_URL, accesToken, kursevi, onZatvori }: {
  API_URL: string;
  accesToken: string | null;
  kursevi: { id: number; naziv: string }[];
  onZatvori?: () => void;
}) {
  const [f, setF] = useState<Forma>(izPodataka(null));
  const [traje, setTraje] = useState(false);
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; greska?: boolean } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/akcija`)
      .then((r) => (r.ok ? r.json() : null))
      .then((a) => {
        setF(izPodataka(a));
        setTraje(!!a?.traje);
      })
      .catch(() => setPoruka({ tekst: "Akcija nije učitana.", greska: true }));
  }, [API_URL]);

  const izmeni = (promena: Partial<Forma>) => setF((s) => ({ ...s, ...promena }));

  const blackFriday = () =>
    izmeni({
      ukljucen: true,
      oznaka: "BLACK FRIDAY",
      naslov: f.naslov || "Black Friday popusti na sve kurseve",
      tekst: f.tekst || "Najniže cene ove godine – samo do ponedeljka u ponoć.",
      boja: "#c49a5a",
      do: f.do || krajBlackFridaya(),
      dugme: f.dugme || "Pogledaj kurseve",
      link: f.link || "/#edukacije",
    });

  async function izaberiSliku(e: React.ChangeEvent<HTMLInputElement>) {
    const fajl = e.target.files?.[0];
    e.target.value = "";
    if (!fajl) return;
    setRadi(true);
    try {
      izmeni({ slika: await otpremiSliku(API_URL, accesToken, fajl) });
    } catch (err: any) {
      setPoruka({ tekst: err?.message || "Slika nije otpremljena.", greska: true });
    } finally {
      setRadi(false);
    }
  }

  async function sacuvaj() {
    setRadi(true);
    setPoruka(null);
    try {
      const res = await fetch(`${API_URL}/api/akcija`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(accesToken ? { Authorization: `Bearer ${accesToken}` } : {}) },
        body: JSON.stringify({ ...f, do: f.do || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Čuvanje nije uspelo.");
      setF(izPodataka(data.akcija));
      setTraje(!!data.akcija?.traje);
      setPoruka({
        tekst: data.akcija?.traje
          ? "Akcija je sačuvana i vidi se na početnoj (za najviše minut)."
          : f.ukljucen
            ? "Sačuvano, ali akcija trenutno ne važi (proverite datum kraja)."
            : "Sačuvano. Akcija je isključena.",
      });
    } catch (e: any) {
      setPoruka({ tekst: e?.message || "Čuvanje nije uspelo.", greska: true });
    } finally {
      setRadi(false);
    }
  }

  const boja = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(f.boja) ? f.boja : "#c49a5a";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className={`flex items-center gap-2 cursor-pointer select-none rounded-lg px-3 py-1.5 border ${f.ukljucen ? "border-green-700 bg-green-900/30" : "border-amber-700 bg-amber-900/20"}`}>
          <input type="checkbox" checked={f.ukljucen} onChange={(e) => izmeni({ ukljucen: e.target.checked })} className="h-4 w-4 accent-red-700 cursor-pointer" />
          <span className="text-sm font-medium text-neutral-200">Akcija prikazana na početnoj</span>
          {traje && <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-400">traje sada</span>}
        </label>
        <button type="button" onClick={blackFriday} className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-black border border-neutral-600 hover:border-neutral-400">
          Popuni za Black Friday
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3">
        <label className="block">
          <span className={labelClass}>Oznaka</span>
          <input value={f.oznaka} onChange={(e) => izmeni({ oznaka: e.target.value })} placeholder="BLACK FRIDAY" maxLength={60} className={poljeClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Naslov</span>
          <input value={f.naslov} onChange={(e) => izmeni({ naslov: e.target.value })} placeholder="Black Friday popusti na sve kurseve" maxLength={200} className={poljeClass} />
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>Kratak tekst</span>
        <textarea
          value={f.tekst}
          onChange={(e) => izmeni({ tekst: e.target.value })}
          rows={2}
          maxLength={600}
          className="w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 resize-y"
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className={labelClass}>Traje do (prazno = dok se ne isključi)</span>
          <input type="datetime-local" value={f.do} onChange={(e) => izmeni({ do: e.target.value })} className={`${poljeClass} [color-scheme:dark]`} />
        </label>
        <label className="block">
          <span className={labelClass}>Tekst dugmeta</span>
          <input value={f.dugme} onChange={(e) => izmeni({ dugme: e.target.value })} placeholder="Pogledaj kurseve" maxLength={60} className={poljeClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Dugme vodi na</span>
          <select value={f.link} onChange={(e) => izmeni({ link: e.target.value })} className={poljeClass}>
            <option value="/#edukacije">Sve kurseve (na početnoj)</option>
            {kursevi.map((k) => (
              <option key={k.id} value={`/kurs/${k.id}`}>{k.naziv}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className={labelClass}>Boja akcenta</span>
          <div className="flex items-center gap-2">
            {BOJE.map((b) => (
              <button key={b} type="button" onClick={() => izmeni({ boja: b })} title={b}
                className={`cursor-pointer h-7 w-7 rounded-full border-2 ${boja.toLowerCase() === b ? "border-white" : "border-neutral-700"}`} style={{ background: b }} />
            ))}
            <input type="color" value={boja.length === 7 ? boja : "#c49a5a"} onChange={(e) => izmeni({ boja: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-neutral-700 bg-transparent" />
          </div>
        </div>
        <div>
          <span className={labelClass}>Pozadinska slika (nije obavezna)</span>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-2 rounded-lg text-xs font-medium text-neutral-200 bg-neutral-800 border border-neutral-700 hover:border-neutral-500">
              {f.slika ? "Promeni sliku" : "Izaberi sliku"}
              <input type="file" accept="image/*" onChange={izaberiSliku} className="hidden" />
            </label>
            {f.slika && <button type="button" onClick={() => izmeni({ slika: "" })} className="cursor-pointer text-xs text-neutral-400 hover:text-red-400">Ukloni</button>}
          </div>
        </div>
      </div>

      <div>
        <p className={labelClass}>
          Pregled {!f.ukljucen && <span className="normal-case tracking-normal text-amber-500">— akcija je isključena i ne vidi se na sajtu</span>}
        </p>
        <div className="relative overflow-hidden rounded-lg bg-[#140f0c] text-white" style={{ opacity: f.ukljucen ? 1 : 0.45 }}>
          {f.slika && <img src={slikaSrc(f.slika)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
          <div className="relative px-6 py-8">
            {f.oznaka && <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] text-black" style={{ background: boja }}>{f.oznaka.toUpperCase()}</span>}
            <p className="mt-3 text-2xl font-semibold">{f.naslov || "Naslov akcije"}</p>
            {f.tekst && <p className="mt-1 text-sm text-white/70">{f.tekst}</p>}
            <span className="mt-4 inline-block px-4 py-2 text-xs font-bold uppercase text-black" style={{ background: boja }}>{f.dugme || "Pogledaj kurseve"}</span>
          </div>
        </div>
      </div>

      {poruka && <p className={`text-xs ${poruka.greska ? "text-red-400" : "text-green-400"}`}>{poruka.tekst}</p>}
      <div className="flex justify-end gap-2">
        {onZatvori && <button type="button" onClick={onZatvori} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800">Zatvori</button>}
        <button type="button" onClick={sacuvaj} disabled={radi} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 disabled:opacity-60">
          {radi ? "Čuvanje..." : "Sačuvaj akciju"}
        </button>
      </div>
    </div>
  );
}
