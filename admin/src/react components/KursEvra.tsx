import React, { useEffect, useState } from "react";

// Kurs evra (1 EUR = x RSD) po kome se na stranici plaćanja računa iznos u dinarima.
export default function KursEvra({ token, apiUrl }: { token: string | null; apiUrl: string }) {
  const [kurs, setKurs] = useState("");
  const [sacuvan, setSacuvan] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [cuva, setCuva] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/api/kurs-evra`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.kurs != null) {
          setKurs(String(d.kurs));
          setSacuvan(String(d.kurs));
        }
      })
      .catch(() => {});
  }, []);

  const sacuvaj = async () => {
    setCuva(true);
    setPoruka(null);
    try {
      const r = await fetch(`${apiUrl}/api/kurs-evra`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kurs }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setKurs(String(d.kurs));
        setSacuvan(String(d.kurs));
        setPoruka({ ok: true, tekst: `Sačuvano: 1 EUR = ${d.kurs} RSD` });
      } else {
        setPoruka({ ok: false, tekst: d.error || "Čuvanje nije uspelo." });
      }
    } catch {
      setPoruka({ ok: false, tekst: "Čuvanje nije uspelo." });
    }
    setCuva(false);
  };

  const broj = Number(kurs.replace(",", "."));
  const primer = Number.isFinite(broj) && broj > 0
    ? new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(100 * broj)
    : null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-white">Kurs evra</h2>
        <p className="text-[11px] text-neutral-500">Po ovom kursu se na stranici plaćanja cena u evrima preračunava u dinare</p>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-neutral-400">1 EUR =</span>
          <input
            type="text"
            inputMode="decimal"
            value={kurs}
            onChange={(e) => setKurs(e.target.value)}
            placeholder="117.4"
            className="w-32 h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 placeholder-neutral-600"
          />
          <span className="text-sm text-neutral-400">RSD</span>
          <button
            onClick={sacuvaj}
            disabled={cuva || !kurs.trim() || kurs === sacuvan}
            className="ml-auto px-4 py-2 rounded-lg text-sm font-medium bg-red-900 hover:bg-red-800 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cuva ? "Čuvam..." : "Sačuvaj kurs"}
          </button>
        </div>
        {primer && <p className="text-[11px] text-neutral-500">Primer: kurs od 100 € se plaća {primer} RSD</p>}
        {poruka && (
          <p className={`text-xs ${poruka.ok ? "text-emerald-400" : "text-red-400"}`}>{poruka.tekst}</p>
        )}
      </div>
    </div>
  );
}
