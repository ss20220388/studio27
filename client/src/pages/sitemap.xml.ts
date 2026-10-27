// Sitemap za Google: početna, radovi, kviz i svi kursevi iz baze (uvek aktuelno).
// Uz svaki kurs idu i sve njegove slike (glavna, slike kursa i radovi polaznika),
// da bi se pojavljivale i u Google pretrazi slika.
import type { APIRoute } from "astro";
import { CLIENT_URL, lepNaziv, slikaIzBaze, ucitajKurseve, ucitajRadove, ucitajSporedneSlike } from "../data/sajt";

type Slika = { loc: string; naslov: string };

const xmlTekst = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export const GET: APIRoute = async () => {
  const [kursevi, radovi] = await Promise.all([ucitajKurseve(), ucitajRadove()]);
  const sporedne = await Promise.all(kursevi.map((k) => ucitajSporedneSlike(k.id)));
  const danas = new Date().toISOString().slice(0, 10);

  const adrese: { loc: string; prioritet: string; slike: Slika[] }[] = [
    {
      // početna prikazuje glavne slike kurseva i prvih 15 radova polaznika
      loc: `${CLIENT_URL}/`,
      prioritet: "1.0",
      slike: [
        ...kursevi.filter((k) => k.slikaUrl).map((k) => ({ loc: slikaIzBaze(k.slikaUrl), naslov: `${lepNaziv(k.naziv)} – Studio 27` })),
        ...radovi.slice(0, 15).map((r) => ({ loc: slikaIzBaze(r.url), naslov: "Render polaznika – Studio 27" })),
      ],
    },
    ...kursevi.map((k, i) => {
      const naziv = lepNaziv(k.naziv);
      const slike: Slika[] = [
        ...(k.slikaUrl ? [{ loc: slikaIzBaze(k.slikaUrl), naslov: `${naziv} – Studio 27` }] : []),
        ...sporedne[i].map((loc, j) => ({ loc, naslov: `${naziv}: render ${j + 1}` })),
        ...radovi
          .filter((r) => String(r.idKurs) === String(k.id))
          .map((r) => {
            const autor = [r.ime, r.prezime].map((x) => (x || "").trim()).filter(Boolean).join(" ");
            return { loc: slikaIzBaze(r.url), naslov: `Render polaznika${autor ? ` ${autor}` : ""} – ${naziv}` };
          }),
      ];
      // ista slika samo jednom, najviše 1000 po stranici (ograničenje Google-a)
      const jedinstvene = slike.filter((s, j) => s.loc && slike.findIndex((x) => x.loc === s.loc) === j).slice(0, 1000);
      return { loc: `${CLIENT_URL}/kurs/${k.id}`, prioritet: "0.9", slike: jedinstvene };
    }),
    {
      loc: `${CLIENT_URL}/radovi`,
      prioritet: "0.8",
      slike: radovi.slice(0, 1000).map((r) => ({ loc: slikaIzBaze(r.url), naslov: "Render polaznika – Studio 27" })),
    },
    { loc: `${CLIENT_URL}/kviz`, prioritet: "0.6", slike: [] },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${adrese
  .map(
    (a) => `  <url>
    <loc>${xmlTekst(a.loc)}</loc>
    <lastmod>${danas}</lastmod>
    <priority>${a.prioritet}</priority>${a.slike
      .map((s) => `\n    <image:image><image:loc>${xmlTekst(encodeURI(s.loc))}</image:loc><image:title>${xmlTekst(s.naslov)}</image:title></image:image>`)
      .join("")}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
};
