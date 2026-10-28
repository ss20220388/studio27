// Umanjena slika iz baze: /slika/uploads/GLAVNESLIKE5.webp?w=800
// Original se preuzima sa API-ja, smanjuje na traženu širinu (webp) i čuva na disku,
// pa se svaka veličina pravi samo jednom. Dozvoljene su samo širine iz SIRINE_SLIKA.
import type { APIRoute } from "astro";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { SIRINE_SLIKA, SLIKE_URL } from "../../data/sajt";

const KES_FOLDER = path.resolve(process.env.SLIKE_KES || ".kes-slika");
// posle nedelju dana slika se pravi ponovo (ako je u adminu zamenjena pod istim imenom)
const KES_TRAJANJE_MS = 7 * 24 * 60 * 60 * 1000;
const ZAGLAVLJA = {
  "Content-Type": "image/webp",
  "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
};

// isti zahtev koji je već u obradi se ne obrađuje dvaput
const uToku = new Map<string, Promise<Buffer | null>>();

async function napravi(original: string, sirina: number, fajl: string) {
  const res = await fetch(original);
  if (!res.ok) return null;
  const slika = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize({ width: sirina, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  await mkdir(KES_FOLDER, { recursive: true });
  await writeFile(fajl, slika);
  return slika;
}

export const GET: APIRoute = async ({ params, url, redirect }) => {
  const putanja = params.putanja || "";
  const sirina = Number(url.searchParams.get("w"));
  const delovi = putanja.split("/");
  if (!SIRINE_SLIKA.includes(sirina) || delovi.some((d) => !d || d === "." || d === "..")) {
    return new Response(null, { status: 404 });
  }

  const original = `${SLIKE_URL}/api/uploaded-images/${delovi.map(encodeURIComponent).join("/")}`;
  const kljuc = createHash("sha1").update(`${putanja}|${sirina}`).digest("hex");
  const fajl = path.join(KES_FOLDER, `${kljuc}.webp`);

  try {
    const info = await stat(fajl);
    if (Date.now() - info.mtimeMs < KES_TRAJANJE_MS) {
      return new Response(new Uint8Array(await readFile(fajl)), { headers: ZAGLAVLJA });
    }
  } catch {
    // nema je u kešu
  }

  let posao = uToku.get(kljuc);
  if (!posao) {
    posao = napravi(original, sirina, fajl).finally(() => uToku.delete(kljuc));
    uToku.set(kljuc, posao);
  }
  try {
    const slika = await posao;
    if (!slika) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(slika), { headers: ZAGLAVLJA });
  } catch (e) {
    // format koji sharp ne ume da obradi: šalje se original
    console.error("Greška pri smanjivanju slike:", putanja, e);
    return redirect(original, 302);
  }
};
