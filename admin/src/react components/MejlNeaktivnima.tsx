import React, { useEffect, useState } from "react";

// Mejl svima koji su se registrovali, a nisu kupili nijedan kurs. Server određuje primaoce.
export default function MejlNeaktivnima({ token, apiUrl }: { token: string | null; apiUrl: string }) {
  const [broj, setBroj] = useState<number | null>(null);
  const [naslov, setNaslov] = useState("");
  const [telo, setTelo] = useState("");
  const [probni, setProbni] = useState("");
  const [potvrda, setPotvrda] = useState(false);
  const [poruka, setPoruka] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [salje, setSalje] = useState(false);
  const zaglavlje = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${apiUrl}/api/mail/neaktivni`, { headers: zaglavlje })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBroj(d.broj))
      .catch(() => {});
  }, []);

  const posalji = async (samoProbni: boolean) => {
    setPotvrda(false);
    setSalje(true);
    setPoruka(null);
    try {
      const r = await fetch(`${apiUrl}/api/mail/neaktivni`, {
        method: "POST",
        headers: zaglavlje,
        body: JSON.stringify({ subject: naslov, body: telo, probni: samoProbni ? probni : "" }),
      });
      const d = await r.json().catch(() => ({}));
      setPoruka(
        r.ok
          ? { ok: true, tekst: samoProbni ? `Probni mejl se šalje na ${probni}.` : `Slanje je počelo: ${d.broj} adresa. Traje nekoliko minuta.` }
          : { ok: false, tekst: d.error || "Slanje nije uspelo." },
      );
    } catch {
      setPoruka({ ok: false, tekst: "Slanje nije uspelo." });
    }
    setSalje(false);
  };

  const polje =
    "w-full px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 placeholder-neutral-600";

  return (
    <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-neutral-800/60">
        <h2 className="text-sm font-semibold text-white">Email neaktivnim korisnicima</h2>
        <p className="text-[11px] text-neutral-500">
          Registrovani, a još nisu kupili nijedan kurs
          {broj !== null && (
            <>
              {" "}— trenutno <b className="text-neutral-300">{broj}</b> adresa
            </>
          )}
        </p>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Naslov</label>
          <input value={naslov} onChange={(e) => setNaslov(e.target.value)} className={`${polje} h-10`} placeholder="Npr. Black Friday – najniže cene ove godine" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Poruka</label>
          <textarea value={telo} onChange={(e) => setTelo(e.target.value)} className={`${polje} h-44 py-2 resize-none`} placeholder="Tekst poruke (novi red je novi red u mejlu)" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Probni mejl (nije obavezno)</label>
          <div className="flex gap-2">
            <input value={probni} onChange={(e) => setProbni(e.target.value)} className={`${polje} h-10`} placeholder="tvoj@email.com" />
            <button
              onClick={() => posalji(true)}
              disabled={!naslov || !telo || !probni || salje}
              className="shrink-0 px-4 h-10 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-40"
            >
              Pošalji probni
            </button>
          </div>
        </div>
        {poruka && <p className={`text-xs ${poruka.ok ? "text-emerald-400" : "text-red-400"}`}>{poruka.tekst}</p>}
        <div className="flex justify-end">
          <button
            onClick={() => setPotvrda(true)}
            disabled={!naslov || !telo || salje || !broj}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-900 hover:bg-red-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Pošalji neaktivnim
          </button>
        </div>
      </div>
      {potvrda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setPotvrda(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-white text-center mb-1">Jeste li sigurni?</h3>
            <p className="text-xs text-neutral-400 text-center mb-5">
              Mejl „{naslov}" ide na {broj} adresa. Ovo se ne može opozvati.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPotvrda(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-neutral-400 bg-neutral-800 hover:bg-neutral-700">Otkaži</button>
              <button onClick={() => posalji(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white bg-red-900 hover:bg-red-800">Pošalji</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
