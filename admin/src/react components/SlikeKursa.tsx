import React, { useEffect, useMemo, useState } from "react";
import { SLIKE_URL } from "../lib/adrese";

// Polja za glavnu i sporedne slike kursa (dodavanje i izmena kursa):
// pregled trenutnih slika, brisanje pojedinačnih, dodavanje novih bez brisanja starih.

export interface PostojecaSlika {
  idSlika: number;
  url: string;
}

export const slikaSrc = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${SLIKE_URL}/api/uploaded-images/${url.replace(/^\//, "")}`;
};

// Upload na server, vraća putanju koja se čuva u bazi (/uploads/...)
export async function otpremiSliku(API_URL: string, accesToken: string | null, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/upload-local`, {
    method: "POST",
    headers: accesToken ? { Authorization: `Bearer ${accesToken}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(`Slika "${file.name}" nije otpremljena`);
  const data = await res.json();
  return `/uploads/${data.filename}`;
}

// Privremeni URL-ovi za pregled izabranih fajlova (oslobađaju se kad fajl nestane)
function usePregledi(fajlovi: File[]) {
  const pregledi = useMemo(() => fajlovi.map((f) => URL.createObjectURL(f)), [fajlovi]);
  useEffect(() => () => pregledi.forEach((u) => URL.revokeObjectURL(u)), [pregledi]);
  return pregledi;
}

const samoSlike = (lista: FileList | null) => Array.from(lista || []).filter((f) => f.type.startsWith("image/"));

const labelClass = "block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5";

function Ubaci({ visestruko, onFajlovi, tekst, mala = false }: {
  visestruko: boolean; onFajlovi: (f: File[]) => void; tekst: string; mala?: boolean;
}) {
  const [iznad, setIznad] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIznad(true); }}
      onDragLeave={() => setIznad(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIznad(false);
        const f = samoSlike(e.dataTransfer.files);
        if (f.length) onFajlovi(visestruko ? f : f.slice(0, 1));
      }}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed cursor-pointer text-center transition-colors ${
        iznad ? "border-red-900 bg-neutral-800" : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800"
      } ${mala ? "aspect-video" : "py-6 px-4"}`}
    >
      <span className="text-xl leading-none text-neutral-400">+</span>
      <span className="text-xs text-neutral-400">{tekst}</span>
      {!mala && <span className="text-[11px] text-neutral-600">ili prevucite ovde</span>}
      <input
        type="file"
        accept="image/*"
        multiple={visestruko}
        className="hidden"
        onChange={(e) => {
          const f = samoSlike(e.target.files);
          if (f.length) onFajlovi(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function Dugme({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white hover:bg-black/90 cursor-pointer"
    >
      {children}
    </button>
  );
}

export function GlavnaSlikaPolje({ trenutnaUrl, fajl, onFajl }: {
  trenutnaUrl?: string; fajl: File | null; onFajl: (f: File | null) => void;
}) {
  const fajlovi = useMemo(() => (fajl ? [fajl] : []), [fajl]);
  const [pregled] = usePregledi(fajlovi);
  const prikaz = pregled || slikaSrc(trenutnaUrl);

  return (
    <div>
      <label className={labelClass}>Glavna slika kursa</label>
      {prikaz ? (
        <div className="relative overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
          <img src={prikaz} alt="" className="w-full aspect-video object-cover" />
          {fajl && (
            <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white">Nova slika</span>
          )}
          <div className="absolute right-2 top-2 flex gap-1.5">
            <label className="rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white hover:bg-black/90 cursor-pointer">
              Promeni
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = samoSlike(e.target.files)[0];
                  if (f) onFajl(f);
                  e.target.value = "";
                }}
              />
            </label>
            {fajl && <Dugme title="Vrati prethodnu" onClick={() => onFajl(null)}>{trenutnaUrl ? "Vrati staru" : "Ukloni"}</Dugme>}
          </div>
        </div>
      ) : (
        <Ubaci visestruko={false} onFajlovi={(f) => onFajl(f[0])} tekst="Izaberite glavnu sliku" />
      )}
    </div>
  );
}

export function SporedneSlikePolje({ postojece = [], zaBrisanje, onZaBrisanje, nove, onNove }: {
  postojece?: PostojecaSlika[];
  zaBrisanje?: Set<number>;
  onZaBrisanje?: (s: Set<number>) => void;
  nove: File[];
  onNove: (f: File[]) => void;
}) {
  const pregledi = usePregledi(nove);
  const brisu = zaBrisanje?.size || 0;

  const prebaci = (id: number) => {
    if (!zaBrisanje || !onZaBrisanje) return;
    const s = new Set(zaBrisanje);
    s.has(id) ? s.delete(id) : s.add(id);
    onZaBrisanje(s);
  };

  return (
    <div>
      <label className={labelClass}>
        Sporedne slike
        <span className="normal-case tracking-normal text-neutral-600">
          {" "}· {postojece.length - brisu + nove.length} ukupno
          {brisu > 0 && `, ${brisu} za brisanje`}
        </span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {postojece.map((s) => {
          const brise = zaBrisanje?.has(s.idSlika);
          return (
            <div key={s.idSlika} className="relative overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
              <img src={slikaSrc(s.url)} alt="" loading="lazy" className={`w-full aspect-video object-cover ${brise ? "opacity-25" : ""}`} />
              <div className="absolute right-1.5 top-1.5">
                <Dugme title={brise ? "Zadrži sliku" : "Obriši sliku"} onClick={() => prebaci(s.idSlika)}>
                  {brise ? "Vrati" : "✕"}
                </Dugme>
              </div>
              {brise && (
                <span className="absolute inset-x-0 bottom-1.5 text-center text-[11px] font-medium text-red-400">Biće obrisana</span>
              )}
            </div>
          );
        })}
        {nove.map((f, i) => (
          <div key={pregledi[i]} className="relative overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
            <img src={pregledi[i]} alt="" className="w-full aspect-video object-cover" />
            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-white">Nova</span>
            <div className="absolute right-1.5 top-1.5">
              <Dugme title="Ukloni" onClick={() => onNove(nove.filter((_, j) => j !== i))}>✕</Dugme>
            </div>
          </div>
        ))}
        <Ubaci visestruko mala onFajlovi={(f) => onNove([...nove, ...f])} tekst="Dodaj slike" />
      </div>
      {brisu > 0 && <p className="mt-1.5 text-[11px] text-neutral-500">Slike se brišu tek kada kliknete „Sačuvaj izmene“.</p>}
    </div>
  );
}
