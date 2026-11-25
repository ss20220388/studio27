import React, { useEffect, useState } from "react";
import { otpremiSliku, slikaSrc } from "./SlikeKursa";

// Popust kursa (Black Friday i sl.) u izmeni kursa.
// Upiše se procenat ILI nova cena, a drugo se odmah izračuna iz redovne cene kursa.
// Procenat važi i za pakete kursa. Popust traje dok je uključen i do upisanog datuma (ako je upisan).
// Izgled (oznaka, naslov, tekst, boja, pozadinska slika) se vidi na stranici kursa dok popust traje.
// Čuva se posebno (dugme "Sačuvaj popust"), kao i paketi.

interface Props {
  kurs: any;
  API_URL: string;
  accesToken: string | null;
  onSacuvano?: (popust: any) => void;
  // "Sačuvaj izmene" kursa čuva i nesačuvan popust: ref dobija funkciju čuvanja (null ako nema izmena)
  sacuvajRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

interface PaketPopust {
  paketId: number;
  naziv: string;
  cena: number;
  nova: string; // cena paketa na popustu ("" = po procentu kursa)
}

interface Forma {
  ukljucen: boolean;
  procenat: string;
  cena: string;
  od: string; // datetime-local: "2026-11-27T00:00" ("" = odmah)
  do: string; // datetime-local: "2026-11-30T23:59"
  oznaka: string;
  naslov: string;
  tekst: string;
  boja: string;
  slika: string;
}

// prva je topla zlatna sa sajta (podrazumevana); crvena je za upadljiviji Black Friday
const BOJE = ["#c49a5a", "#e8dcc8", "#ffffff", "#e11d2a", "#b08d57", "#8fa58b"];

const labelClass = "block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1";
const poljeClass =
  "w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-colors placeholder-neutral-600 disabled:opacity-50";

const zaokruzi = (n: number, decimala = 0) => {
  const f = 10 ** decimala;
  return Math.round(n * f) / f;
};

// Ponedeljak posle Black Friday-a (petak posle 4. četvrtka u novembru), 23:59; sledeće godine ako je prošao

// petak Black Friday-a (posle 4. četvrtka u novembru) u 00:00, iste godine kao kraj
function pocetakBlackFridaya(kraj: string): string {
  if (!kraj) return "";
  const ponedeljak = new Date(kraj);
  const petak = new Date(ponedeljak.getFullYear(), ponedeljak.getMonth(), ponedeljak.getDate() - 3);
  const d = (n: number) => String(n).padStart(2, "0");
  return `${petak.getFullYear()}-${d(petak.getMonth() + 1)}-${d(petak.getDate())}T00:00`;
}

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

const izKursa = (p: any): Forma => ({
  ukljucen: !!p?.ukljucen,
  procenat: p?.procenat != null ? String(zaokruzi(Number(p.procenat), 2)) : "",
  cena: p?.cena != null ? String(p.cena) : "",
  od: p?.od ? String(p.od).slice(0, 16) : "",
  do: p?.do ? String(p.do).slice(0, 16) : "",
  oznaka: p?.oznaka || "",
  naslov: p?.naslov || "",
  tekst: p?.tekst || "",
  boja: p?.boja || "#c49a5a",
  slika: p?.slika || "",
});

export default function PopustKursa({ kurs, API_URL, accesToken, onSacuvano, sacuvajRef }: Props) {
  const redovna = Number(kurs?.cena) || 0;
  const [f, setF] = useState<Forma>(() => izKursa(kurs?.popust));
  const [izmenjen, setIzmenjen] = useState(false);
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; greska?: boolean } | null>(null);
  const [traje, setTraje] = useState<boolean>(!!kurs?.popust?.traje);

  const [paketi, setPaketi] = useState<PaketPopust[]>([]);

  const ucitajPakete = () =>
    fetch(`${API_URL}/api/paketi/${kurs.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) =>
        setPaketi((Array.isArray(d) ? d : []).map((p: any) => ({
          paketId: p.paketId, naziv: p.naziv, cena: Number(p.cena) || 0, nova: p.cenaPopust != null ? String(p.cenaPopust) : "",
        })))
      )
      .catch(() => setPaketi([]));

  useEffect(() => {
    if (kurs?.id) ucitajPakete();
  }, [kurs?.id]);

  useEffect(() => {
    setF(izKursa(kurs?.popust));
    setTraje(!!kurs?.popust?.traje);
    setIzmenjen(false);
    setPoruka(null);
  }, [kurs?.id]);

  const izmeni = (promena: Partial<Forma>) => {
    setF((stara) => ({ ...stara, ...promena }));
    setIzmenjen(true);
  };

  // novi procenat preračunava i cene paketa (posle se svaka može promeniti posebno)
  const paketiPoProcentu = (procenat: string) => {
    const p = Number(procenat.replace(",", "."));
    if (!(p > 0 && p < 100)) return;
    setPaketi((stari) => stari.map((pk) => ({ ...pk, nova: String(zaokruzi(pk.cena * (1 - p / 100))) })));
  };
  // upisan popust se odmah i uključuje (najčešća greška: upisan procenat, a kvačica ostala prazna)
  const ukljuci = (v: string) => (v ? { ukljucen: true } : {});

  // procenat -> nova cena
  const naProcenat = (v: string) => {
    const p = Number(v.replace(",", "."));
    izmeni({ procenat: v, cena: v && redovna > 0 && p > 0 && p < 100 ? String(zaokruzi(redovna * (1 - p / 100))) : f.cena, ...ukljuci(v) });
    paketiPoProcentu(v);
  };
  // nova cena -> procenat
  const naCenu = (v: string) => {
    const c = Number(v);
    const procenat = v && redovna > 0 && c > 0 && c < redovna ? String(zaokruzi((1 - c / redovna) * 100, 2)) : f.procenat;
    izmeni({ cena: v, procenat, ...ukljuci(v) });
    paketiPoProcentu(procenat);
  };
  const naCenuPaketa = (paketId: number, v: string) => {
    setPaketi((stari) => stari.map((pk) => (pk.paketId === paketId ? { ...pk, nova: v } : pk)));
    setIzmenjen(true);
  };

  const blackFriday = () =>
    izmeni({
      oznaka: "BLACK FRIDAY",
      naslov: f.naslov || `Black Friday: -${zaokruzi(Number(f.procenat) || 30)}% na kurs`,
      tekst: f.tekst || "Najniža cena ove godine važi samo do ponedeljka u ponoć.",
      boja: "#c49a5a",
      do: f.do || krajBlackFridaya(),
      od: f.od || pocetakBlackFridaya(f.do || krajBlackFridaya()),
      procenat: f.procenat,
    });

  async function izaberiSliku(e: React.ChangeEvent<HTMLInputElement>) {
    const fajl = e.target.files?.[0];
    e.target.value = "";
    if (!fajl) return;
    setRadi(true);
    setPoruka(null);
    try {
      izmeni({ slika: await otpremiSliku(API_URL, accesToken, fajl) });
    } catch (err: any) {
      setPoruka({ tekst: err?.message || "Slika nije otpremljena.", greska: true });
    } finally {
      setRadi(false);
    }
  }

  async function sacuvaj(): Promise<boolean> {
    setRadi(true);
    setPoruka(null);
    try {
      const res = await fetch(`${API_URL}/api/popust/${kurs.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(accesToken ? { Authorization: `Bearer ${accesToken}` } : {}),
        },
        body: JSON.stringify({
          ...f, procenat: f.procenat || null, cena: f.cena || null, od: f.od || null, do: f.do || null,
          paketi: paketi.map((pk) => ({ paketId: pk.paketId, cena: pk.nova || null })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Čuvanje nije uspelo.");
      setF(izKursa(data.popust));
      setTraje(!!data.popust?.traje);
      setIzmenjen(false);
      setPoruka({
        tekst: data.popust?.traje
          ? "Popust je sačuvan i vidi se na sajtu (za najviše minut)."
          : f.ukljucen
            ? "Sačuvano. Popust se na sajtu vidi tek u zadatom roku (proverite datum početka i kraja)."
            : "Sačuvano. Popust je isključen.",
      });
      onSacuvano?.(data.popust);
      ucitajPakete();
      return true;
    } catch (e: any) {
      setPoruka({ tekst: e?.message || "Čuvanje nije uspelo.", greska: true });
      return false;
    } finally {
      setRadi(false);
    }
  }

  if (sacuvajRef) sacuvajRef.current = izmenjen ? sacuvaj : null;

  const procenatPrikaz = zaokruzi(Number(f.procenat) || 0);
  const novaCena = Number(f.cena) || 0;
  const boja = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(f.boja) ? f.boja : "#c49a5a";

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900/60">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-800">
        <div>
          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Popust (Black Friday i sl.)</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Redovna cena: <span className="text-neutral-300">{redovna ? `${redovna} €` : "nije upisana"}</span>
            {traje && <span className="ml-2 rounded bg-green-900/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-400">traje sada</span>}
          </p>
        </div>
        <label className={`flex items-center gap-2 cursor-pointer select-none rounded-lg px-3 py-1.5 border ${f.ukljucen ? "border-green-700 bg-green-900/30" : "border-amber-700 bg-amber-900/20"}`}>
          <input
            type="checkbox"
            checked={f.ukljucen}
            onChange={(e) => izmeni({ ukljucen: e.target.checked })}
            className="h-4 w-4 accent-red-700 cursor-pointer"
          />
          <span className="text-sm font-medium text-neutral-200">Popust uključen</span>
        </label>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className={labelClass}>Popust (%)</span>
            <input type="number" min={1} max={99} step="any" value={f.procenat} onChange={(e) => naProcenat(e.target.value)} placeholder="Npr. 30" className={poljeClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Nova cena (€)</span>
            <input type="number" min={1} value={f.cena} onChange={(e) => naCenu(e.target.value)} placeholder={redovna ? `manje od ${redovna}` : ""} className={poljeClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Počinje (prazno = odmah)</span>
            <input type="datetime-local" value={f.od} onChange={(e) => izmeni({ od: e.target.value })} className={`${poljeClass} [color-scheme:dark]`} />
          </label>
          <label className="block">
            <span className={labelClass}>Traje do (prazno = dok se ne isključi)</span>
            <input type="datetime-local" value={f.do} onChange={(e) => izmeni({ do: e.target.value })} className={`${poljeClass} [color-scheme:dark]`} />
          </label>
        </div>
        {paketi.length > 0 && (
          <div className="rounded-lg border border-neutral-800 p-3">
            <p className={labelClass}>Cene paketa na popustu</p>
            <p className="text-xs text-neutral-500 mb-2">Popune se po procentu, a svaka se može promeniti posebno. Upišite redovnu cenu ako paket nije na popustu.</p>
            <div className="space-y-2">
              {paketi.map((pk) => {
                const nova = Number(pk.nova) || 0;
                const procenatPaketa = nova > 0 && nova < pk.cena ? zaokruzi((1 - nova / pk.cena) * 100) : null;
                return (
                  <div key={pk.paketId} className="grid grid-cols-[1fr_90px_110px_50px] items-center gap-3">
                    <span className="truncate text-sm text-neutral-200">{pk.naziv}</span>
                    <span className="text-right text-sm text-neutral-500 line-through">{pk.cena} €</span>
                    <input
                      type="number"
                      min={1}
                      value={pk.nova}
                      onChange={(e) => naCenuPaketa(pk.paketId, e.target.value)}
                      placeholder="nova cena"
                      className={poljeClass}
                    />
                    <span className="text-xs font-semibold text-red-400">{procenatPaketa != null ? `-${procenatPaketa}%` : nova === pk.cena ? <span className="font-normal text-neutral-500">bez</span> : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-neutral-800 pt-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Izgled na sajtu</p>
            <button
              type="button"
              onClick={blackFriday}
              className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-black border border-neutral-600 hover:border-neutral-400"
            >
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
              <input value={f.naslov} onChange={(e) => izmeni({ naslov: e.target.value })} placeholder="Black Friday: -30% na kurs" maxLength={200} className={poljeClass} />
            </label>
          </div>
          <label className="block mt-3">
            <span className={labelClass}>Kratak tekst</span>
            <textarea
              value={f.tekst}
              onChange={(e) => izmeni({ tekst: e.target.value })}
              rows={2}
              maxLength={600}
              placeholder="Najniža cena ove godine važi samo do ponedeljka u ponoć."
              className="w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600 resize-y"
            />
          </label>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className={labelClass}>Boja akcenta</span>
              <div className="flex items-center gap-2">
                {BOJE.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => izmeni({ boja: b })}
                    title={b}
                    className={`cursor-pointer h-7 w-7 rounded-full border-2 ${boja.toLowerCase() === b ? "border-white" : "border-neutral-700"}`}
                    style={{ background: b }}
                  />
                ))}
                <input type="color" value={boja.length === 7 ? boja : "#c49a5a"} onChange={(e) => izmeni({ boja: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-neutral-700 bg-transparent" title="Druga boja" />
              </div>
            </div>
            <div>
              <span className={labelClass}>Pozadinska slika (nije obavezna)</span>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-2 rounded-lg text-xs font-medium text-neutral-200 bg-neutral-800 border border-neutral-700 hover:border-neutral-500">
                  {f.slika ? "Promeni sliku" : "Izaberi sliku"}
                  <input type="file" accept="image/*" onChange={izaberiSliku} className="hidden" />
                </label>
                {f.slika && (
                  <button type="button" onClick={() => izmeni({ slika: "" })} className="cursor-pointer text-xs text-neutral-400 hover:text-red-400">
                    Ukloni
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* pregled trake kakva se vidi na vrhu stranice kursa */}
        <div>
          <p className={labelClass}>
            Pregled{" "}
            {!f.ukljucen && <span className="normal-case tracking-normal text-amber-500">— popust je isključen i ne vidi se na sajtu</span>}
          </p>
          <div className="relative overflow-hidden rounded-lg bg-[#140f0c] text-white" style={{ opacity: f.ukljucen ? 1 : 0.45 }}>
            {f.slika && <img src={slikaSrc(f.slika)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
            <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
              <span className="text-4xl font-black leading-none" style={{ color: boja }}>-{procenatPrikaz || "?"}%</span>
              <div className="min-w-0 flex-1">
                {f.oznaka && (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] text-black" style={{ background: boja }}>
                    {f.oznaka.toUpperCase()}
                  </span>
                )}
                <p className="mt-1 text-sm font-semibold">{f.naslov || "Naslov popusta"}</p>
                {f.tekst && <p className="text-xs text-white/70">{f.tekst}</p>}
              </div>
              <div className="text-right">
                {redovna > 0 && <p className="text-xs text-white/50 line-through">{redovna} €</p>}
                <p className="text-2xl font-bold">{novaCena || "?"} €</p>
              </div>
            </div>
          </div>
        </div>

        {poruka && <p className={`text-xs ${poruka.greska ? "text-red-400" : "text-green-400"}`}>{poruka.tekst}</p>}
        <div className="flex items-center justify-end gap-3">
          {izmenjen && <span className="text-[11px] text-amber-500">nije sačuvano</span>}
          <button
            type="button"
            onClick={() => sacuvaj()}
            disabled={radi}
            className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors disabled:opacity-60"
          >
            {radi ? "Čuvanje..." : "Sačuvaj popust"}
          </button>
        </div>
      </div>
    </div>
  );
}
