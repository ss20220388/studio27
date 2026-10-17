import React, { useEffect, useRef, useState } from "react";

type Korisnik = {
  ime?: string;
  prezime?: string;
  email?: string;
  role?: string;
};

type Props = {
  apiUrl: string;
  appUrl: string;
  adminUrl: string;
  // korisnik koga je server već prepoznao preko refreshToken kolačića
  pocetniKorisnik?: Korisnik | null;
};

// Dugme u zaglavlju: neulogovan korisnik vidi "Prijava",
// ulogovan vidi "Moja aplikacija" (otvara web aplikaciju sa kursevima) i meni za odjavu
export default function NalogDugme({ apiUrl, appUrl, adminUrl, pocetniKorisnik = null }: Props) {
  const [korisnik, setKorisnik] = useState<Korisnik | null>(pocetniKorisnik);
  const [otvoren, setOtvoren] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // accessToken kolačić traje kraće od refreshToken-a, pa neuspeh ovde
    // ne briše korisnika koga je server već prepoznao
    fetch(`${apiUrl}/api/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u && !u.error) setKorisnik(u);
      })
      .catch(() => {});

    const prijavljen = (e: Event) => setKorisnik((e as CustomEvent).detail);
    window.addEventListener("user-logged-in", prijavljen);
    return () => window.removeEventListener("user-logged-in", prijavljen);
  }, [apiUrl]);

  useEffect(() => {
    if (!otvoren) return;
    const zatvori = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOtvoren(false);
    };
    document.addEventListener("mousedown", zatvori);
    return () => document.removeEventListener("mousedown", zatvori);
  }, [otvoren]);

  // boja se nasleđuje od zaglavlja (belo preko fotografije, tamno na belom zaglavlju)
  const boja = "text-inherit hover:opacity-60";

  if (!korisnik) {
    return (
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("open-login"))}
        className={`inline-flex items-center gap-1.5 text-[13px] font-medium cursor-pointer transition-colors ${boja}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4" aria-hidden="true">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
        Prijava
      </button>
    );
  }

  const odjava = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      /* ignorisi */
    }
    localStorage.removeItem("accessToken");
    window.dispatchEvent(new CustomEvent("user-logged-out"));
    window.location.reload();
  };

  const ime = `${korisnik.ime || ""} ${korisnik.prezime || ""}`.trim() || korisnik.email || "Moj nalog";

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1">
        <a
          href={appUrl}
          className={`inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors ${boja}`}
        >
          Moja aplikacija
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
        <button
          type="button"
          onClick={() => setOtvoren(!otvoren)}
          aria-label="Meni naloga"
          className={`p-1 cursor-pointer transition-colors ${boja}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-3.5 h-3.5 transition-transform ${otvoren ? "rotate-180" : ""}`} aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {otvoren && (
        <div className="absolute right-0 mt-3 w-64 bg-white border border-neutral-200 shadow-xl z-[60] text-left">
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-900 truncate">{ime}</p>
            {korisnik.email && <p className="text-xs text-neutral-500 truncate">{korisnik.email}</p>}
          </div>
          <a href={appUrl} className="block px-4 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50">
            Aplikacija sa kursevima
          </a>
          {korisnik.role === "ADMIN" && (
            <a href={adminUrl} className="block px-4 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50">
              Admin aplikacija
            </a>
          )}
          <button
            type="button"
            onClick={odjava}
            className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 border-t border-neutral-100 cursor-pointer"
          >
            Odjavi se
          </button>
        </div>
      )}
    </div>
  );
}
