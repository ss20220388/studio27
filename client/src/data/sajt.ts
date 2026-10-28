// Zajednička podešavanja sajta.
// Sve adrese se čitaju iz .env fajla (PUBLIC_*), a svi podaci o kursevima
// (naziv, opis, sadržaj, lekcije, cena i slike) dolaze iz baze preko API-ja.

// Nema podrazumevanih adresa u kodu: ako promenljiva nedostaje, build javlja grešku (astro.config.mjs).
const bezKosaCrte = (url: string | undefined) => (url ?? "").replace(/\/+$/, "");
export const API_URL = bezKosaCrte(import.meta.env.PUBLIC_API_URL);
export const CLIENT_URL = bezKosaCrte(import.meta.env.PUBLIC_CLIENT_URL);
export const APP_URL = bezKosaCrte(import.meta.env.PUBLIC_APP_URL);
export const ADMIN_URL = bezKosaCrte(import.meta.env.PUBLIC_ADMIN_URL);

// Poslovni WhatsApp / telefon (isti kao u kontakt formi i podnožju)
export const WHATSAPP_BROJ = "381665934314";
export const TELEFON = "+381665934314";
export const TELEFON_PRIKAZ = "+381 66 593 4314";
export const KONTAKT_EMAIL = "studio27.vizz@gmail.com";

export function whatsappLink(poruka: string) {
  return `https://wa.me/${WHATSAPP_BROJ}?text=${encodeURIComponent(poruka)}`;
}

export type Lekcija = { lekcijaId: number; naziv: string; opis?: string; videoUrls?: string[] };

export type KursIzBaze = {
  id: number;
  naziv?: string;
  opis?: string;
  cena?: number;
  slikaUrl?: string;
  sadrzaj?: string;
  glavniKurs?: string;
  komentarGore?: string;
  komentarSredina?: string;
  komentarDole?: string;
  lekcije?: Lekcija[];
};

// Slike kursa iz baze: glavna (kurs.slikaUrl) i ostale/sporedne (tabela kursslika)
export type SlikeKursa = { glavna: string; sporedne: string[] };

export function slikaIzBaze(putanja?: string | null) {
  if (!putanja) return "";
  if (/^https?:\/\//i.test(putanja)) return putanja;
  return `${API_URL}/api/uploaded-images${putanja.startsWith("/") ? "" : "/"}${putanja}`;
}

// Cena se menja kroz admin aplikaciju; 0 znači da cena nije javna (kurs na upit)
export function imaCenu(kurs: { cena?: number } | null | undefined) {
  return !!kurs?.cena && kurs.cena > 0;
}

// Naziv iz baze je VELIKIM SLOVIMA; za naslove ga pretvaramo u rečenicu uz ispravna imena programa
export function lepNaziv(tekst?: string) {
  if (!tekst) return "";
  const s = tekst.charAt(0) + tekst.slice(1).toLowerCase();
  return s
    .replace(/\b3ds max\b/gi, "3ds Max")
    .replace(/\b3d\b/gi, "3D")
    .replace(/\bcorona\b/gi, "Corona")
    .replace(/(^|[\s+(])ai(?=$|[\s+).,])/gi, "$1AI")
    .replace(/\bautocad\b/gi, "AutoCAD")
    .replace(/\bphotoshop\b/gi, "Photoshop");
}

// Svi kursevi sa lekcijama, istim redosledom kao u admin aplikaciji
export async function ucitajKurseve(): Promise<KursIzBaze[]> {
  try {
    const res = await fetch(`${API_URL}/api/kursevi-sa-lekcijama`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function ucitajSporedneSlike(id: number | null): Promise<string[]> {
  if (!id) return [];
  try {
    const res = await fetch(`${API_URL}/api/kursslika/${id}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.kursSlika || []).map((s: { url?: string }) => slikaIzBaze(s.url)).filter(Boolean);
  } catch {
    return [];
  }
}

// Radovi polaznika (tabela radova u bazi; svaki rad je vezan za kurs preko idKurs)
export type RadPolaznika = { idRad: number; idKurs?: number; url: string; ime?: string; prezime?: string };

export async function ucitajRadove(): Promise<RadPolaznika[]> {
  try {
    const res = await fetch(`${API_URL}/api/radovi`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((r: RadPolaznika) => r.url) : [];
  } catch {
    return [];
  }
}

export async function ucitajKurs(id: number | null): Promise<KursIzBaze | null> {
  if (!id) return null;
  try {
    const res = await fetch(`${API_URL}/api/kursevi/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Sadržaj kursa (polje "sadrzaj") je tekst u kome su naslovi celina pisani VELIKIM SLOVIMA
export function parsirajSadrzaj(tekst?: string) {
  if (!tekst) return [] as { naslov: string; stavke: string[] }[];
  const linije = tekst.split("\n").map((l) => l.trim()).filter(Boolean);
  const sekcije: { naslov: string; stavke: string[] }[] = [];
  for (const linija of linije) {
    const slova = linija.replace(/[^a-zA-ZČĆŽŠĐčćžšđ]/g, "");
    const naslov = slova.length > 0 && slova === slova.toUpperCase();
    if (naslov) sekcije.push({ naslov: linija, stavke: [] });
    else if (sekcije.length === 0) sekcije.push({ naslov: "SADRŽAJ KURSA", stavke: [linija] });
    else sekcije[sekcije.length - 1].stavke.push(linija);
  }
  return sekcije;
}
