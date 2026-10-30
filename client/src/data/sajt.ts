// Zajednička podešavanja sajta.
// Sve adrese se čitaju iz .env fajla (PUBLIC_*), a svi podaci o kursevima
// (naziv, opis, sadržaj, lekcije, cena i slike) dolaze iz baze preko API-ja.

// Nema podrazumevanih adresa u kodu: ako promenljiva nedostaje, build javlja grešku (astro.config.mjs).
const bezKosaCrte = (url: string | undefined) => (url ?? "").replace(/\/+$/, "");
export const API_URL = bezKosaCrte(import.meta.env.PUBLIC_API_URL);
export const CLIENT_URL = bezKosaCrte(import.meta.env.PUBLIC_CLIENT_URL);
export const APP_URL = bezKosaCrte(import.meta.env.PUBLIC_APP_URL);
export const ADMIN_URL = bezKosaCrte(import.meta.env.PUBLIC_ADMIN_URL);
// Slike (uploaded-images): podrazumevano sa API-ja; lokalno PUBLIC_SLIKE_URL može da pokazuje na produkciju
export const SLIKE_URL = bezKosaCrte(import.meta.env.PUBLIC_SLIKE_URL) || API_URL;

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
  return `${SLIKE_URL}/api/uploaded-images${putanja.startsWith("/") ? "" : "/"}${putanja}`;
}

// Umanjene slike: /slika/... (pages/slika) pravi webp tražene širine i čuva ga na disku.
// Originali iz baze su i do 1 MB, a telefonu je dovoljna slika od 480–800 px.
export const SIRINE_SLIKA = [480, 800, 1200, 1600, 2000];
const PREFIKS_SLIKA = `${SLIKE_URL}/api/uploaded-images/`;

function kodiranaPutanja(putanja: string) {
  return putanja
    .split("/")
    .map((deo) => {
      try {
        return encodeURIComponent(decodeURIComponent(deo));
      } catch {
        return encodeURIComponent(deo);
      }
    })
    .join("/");
}

export function manjaSlika(url: string, sirina: number) {
  if (!url?.startsWith(PREFIKS_SLIKA)) return url;
  return `/slika/${kodiranaPutanja(url.slice(PREFIKS_SLIKA.length))}?w=${sirina}`;
}

// srcset za <img>; za slike koje nisu iz baze vraća undefined (atribut se ne ispisuje)
export function srcsetSlike(url: string, najvise = 2000) {
  if (!url?.startsWith(PREFIKS_SLIKA)) return undefined;
  return SIRINE_SLIKA.filter((w) => w <= najvise)
    .map((w) => `${manjaSlika(url, w)} ${w}w`)
    .join(", ");
}

// Adresa kursa sa nazivom (/kurs/7-3ds-max-corona-render) – bolja za Google od samog broja
export function slugKursa(naziv?: string) {
  return (naziv || "")
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function kursPutanja(kurs: { id?: number; naziv?: string }) {
  const slug = slugKursa(kurs.naziv);
  return `/kurs/${kurs.id}${slug ? `-${slug}` : ""}`;
}

// Kratak keš odgovora API-ja: svaka poseta ne mora ponovo da čeka bazu (izmene iz admina vide se za najviše minut)
const KES_MS = 60_000;
const kes = new Map<string, { vreme: number; podaci: Promise<unknown> }>();

function izKesa<T>(kljuc: string, ucitaj: () => Promise<T>): Promise<T> {
  const zapis = kes.get(kljuc);
  if (zapis && Date.now() - zapis.vreme < KES_MS) return zapis.podaci as Promise<T>;
  const podaci = ucitaj();
  kes.set(kljuc, { vreme: Date.now(), podaci });
  return podaci;
}

// GET na API sa kešom; neuspeh se ne pamti, pa sledeći zahtev pokušava ponovo
function apiJson(putanja: string): Promise<any> {
  return izKesa(putanja, async () => {
    const res = await fetch(`${API_URL}${putanja}`);
    if (!res.ok) {
      kes.delete(putanja);
      throw new Error(`${res.status} ${putanja}`);
    }
    return res.json();
  }).catch((e) => {
    kes.delete(putanja);
    throw e;
  });
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
    return await apiJson("/api/kursevi-sa-lekcijama");
  } catch {
    return [];
  }
}

export async function ucitajSporedneSlike(id: number | null): Promise<string[]> {
  if (!id) return [];
  try {
    const data = await apiJson(`/api/kursslika/${id}`);
    return (data.kursSlika || []).map((s: { url?: string }) => slikaIzBaze(s.url)).filter(Boolean);
  } catch {
    return [];
  }
}

// Lista sa API-ja (recenzije, radovi sa rasporedom...); prazna lista ako API ne odgovori
export async function ucitajListu<T = any>(putanja: string): Promise<T[]> {
  try {
    const data = await apiJson(putanja);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Paketi kursa (npr. Online / Online + Review / Live mentorship + AI), redom iz admina
export type PaketKursa = {
  paketId: number;
  kursId: number;
  naziv: string;
  cena: number;
  opis?: string; // stavke, jedna po redu; **tekst** je podebljan
  podnaslov?: string | null;
  uvod?: string | null;
  istaknuto?: string | null;
  dugme?: string | null;
};

export async function ucitajPakete(kursId: number | null): Promise<PaketKursa[]> {
  if (!kursId) return [];
  return ucitajListu<PaketKursa>(`/api/paketi/${kursId}`);
}

// Potpis recenzije: ime polaznika i Instagram nalog (za utiske sa Instagrama)
export type PotpisRecenzije = { ime?: string | null; instagram?: string | null; student?: { ime?: string; prezime?: string } | null };

export function potpisRecenzije(r: PotpisRecenzije) {
  const ime = (r.ime || [r.student?.ime, r.student?.prezime].filter(Boolean).join(" ")).trim();
  const instagram = (r.instagram || "").trim().replace(/^@/, "");
  return { ime, instagram, instagramUrl: instagram ? `https://www.instagram.com/${encodeURIComponent(instagram)}/` : "" };
}

// Radovi polaznika (tabela radova u bazi; svaki rad je vezan za kurs preko idKurs)
export type RadPolaznika = { idRad: number; idKurs?: number; url: string; ime?: string; prezime?: string };

export async function ucitajRadove(): Promise<RadPolaznika[]> {
  try {
    const data = await apiJson("/api/radovi");
    return Array.isArray(data) ? data.filter((r: RadPolaznika) => r.url) : [];
  } catch {
    return [];
  }
}

export async function ucitajKurs(id: number | null): Promise<KursIzBaze | null> {
  if (!id) return null;
  try {
    return await apiJson(`/api/kursevi/${id}`);
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
