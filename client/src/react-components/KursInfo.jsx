/* eslint-disable react/prop-types */
import { motion } from "framer-motion";
import BuyButton from "./BuyButton.jsx";
import { useState, useEffect } from "react";
const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const formatLekcijaOpis = (opis = "") =>
  opis
    .split(/\r?\n/)
    .map((linija) => linija.trim())
    .filter(Boolean)
    .map((linija) => linija.replace(/^[-•]\s*/, ""));

const formatSadrzaj = (sadrzaj = "") =>
  sadrzaj
    .split(/\r?\n/)
    .map((linija) => linija.trim())
    .filter(Boolean);

const isHeadingLine = (linija) => {
  if (!linija) return false;
  if (/^\d+\s*deo\b/i.test(linija)) return true;
  if (/^(BONUS|RAD NA|KAKO|MATERIJALI|RASVETA|KADRIRANJE)\b/i.test(linija)) return true;
  if (/^[A-ZŠĐČĆŽ0-9\s+,&.-]{6,}$/.test(linija) && /[A-ZŠĐČĆŽ]/.test(linija)) return true;
  return false;
};

const buildSadrzajSekcije = (linije = []) => {
  const sekcije = [];
  let trenutnaSekcija = null;

  linije.forEach((linija) => {
    const bullet = /^[-•.]\s*/.test(linija);
    const clean = linija.replace(/^[-•.]\s*/, "");

    if (isHeadingLine(clean)) {
      trenutnaSekcija = { naslov: clean, stavke: [] };
      sekcije.push(trenutnaSekcija);
      return;
    }

    const stavka = bullet ? clean : clean;

    if (!trenutnaSekcija) {
      trenutnaSekcija = { naslov: "Pregled sadržaja", stavke: [] };
      sekcije.push(trenutnaSekcija);
    }

    trenutnaSekcija.stavke.push(stavka);
  });

  return sekcije;
};

export default function KursInfo({ kurs }) {
  const lekcije = Array.isArray(kurs?.lekcije) ? kurs.lekcije : [];
  const sadrzajLinije = formatSadrzaj(kurs?.sadrzaj || "");

  const sadrzajSekcije = buildSadrzajSekcije(sadrzajLinije);

  const [slike, setSlike] = useState([])
  const resolveImageSrc = (imagePath) => {
    if (!imagePath) return "";

    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const normalizedPath = imagePath.startsWith("/")
      ? imagePath
      : `/${imagePath}`;

    return `${API_URL}/api/uploaded-images${normalizedPath}`;
  };

  const [activeImage, setActiveImage] = useState(
    resolveImageSrc(kurs?.slikaUrl)
  );
  useEffect(() => {
    async function fetchSlike() {
      if (kurs?.id) {
        try {
          const response = await fetch(`${API_URL}/api/kursslika/${kurs.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log("Dohvaćene sporedne slike:", data.kursSlika);
            console.log(JSON.stringify(data.kursSlika, null, 2));
            setSlike(data.kursSlika || []);
          } else {
            console.error("Greška pri dohvatanju sporednih slika");
          }
        } catch (error) {
          console.error("Greška pri dohvatanju sporednih slika", error);
        }
      }
    }
    fetchSlike();
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-black text-white">
        <div className="h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />

        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-2xl border-l border-red-800/70 pl-5 sm:pl-7"
          >
            <span className="text-xs uppercase tracking-[0.45em] text-red-400/90">
              O kursu
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Sve što treba da znaš o kursu.
            </h2>
          </motion.div>

          <div className="grid items-start gap-14 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mb-8 text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
              >
                {kurs?.naziv || "Kurs"}
              </motion.h2>

              
               <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="mb-10 text-lg leading-relaxed text-gray-400"
              >
                {kurs?.opis
                  ? kurs.opis
                  : "Ovaj kurs je dizajniran da vam pokaže kako da iskoristite savremene alate i tehnologije kako biste ubrzali svoj rad, automatizovali procese i stvorili nove poslovne prilike."}
              </motion.p>

              <div className="mt-10 rounded-[1.75rem] border border-white/10 bg-white/5 px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/45">Cena kursa</p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {kurs?.cena ? `${kurs.cena} €` : "Cena na upit"}
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-7 text-white/60">
                      Kupovina otključava kompletan sadržaj kursa odmah nakon potvrde.
                    </p>
                  </div>

                  <div className="shrink-0">
                    <BuyButton price={kurs?.cena} />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Format", value: "Video", icon: "🎬" },
                  { label: "Nivo", value: "Svi", icon: "📈" },
                  { label: "Pomoc", value: "Doživotno", icon: "♾️" },
                  { label: "Podrška", value: "24/7", icon: "💬" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    custom={index}
                    variants={cardVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    className="rounded-[1.25rem] border border-white/8 bg-white/3 p-3 backdrop-blur-sm"
                  >
                    <span className="text-xl opacity-90">{item.icon}</span>
                    <p className="mt-2 text-[11px] uppercase tracking-wider text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-red-900/25 to-red-700/15 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm">
                <div className="flex flex-col gap-4">

                  <img
                    src={activeImage}
                    alt={kurs?.naziv || "Kurs"}
                    className="h-[600px] w-full rounded-2xl object-cover"
                  />

                  {slike.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                      {slike.map((slika) => (
                        <img
                          key={slika.idSlika}
                          src={resolveImageSrc(slika.url)}
                          onClick={() =>
                            setActiveImage(resolveImageSrc(slika.url))
                          }
                          className="h-28 w-full rounded-xl object-cover cursor-pointer hover:scale-105 transition duration-300"
                        />
                      ))}

                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        
      </section>

      {(sadrzajSekcije.length > 0 || lekcije.length > 0) && (
        <section className="relative overflow-hidden bg-[#050505] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(127,29,29,0.18),transparent_40%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_35%)]" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-14 max-w-3xl border-l border-red-800/70 pl-5 sm:pl-7"
            >
              <span className="text-xs uppercase tracking-[0.45em] text-red-400/90">
                Sadržaj kursa
              </span>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight leading-tight text-white md:text-5xl">
                Pregled strukture kursa.
              </h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
                Sadržaj je raspoređen po celinama, tako da možeš brzo da otvoriš deo koji te zanima.
              </p>
            </motion.div>

            <div className="space-y-4">
              {sadrzajSekcije.length > 0 ? (
                sadrzajSekcije.slice(1).map((sekcija, index) => (
                  <motion.details
                    key={`${sekcija.naslov}-${index}`}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, delay: index * 0.04 }}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[2px]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-red-400/90">Sadržaj dela</p>
                        <h4 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                          {sekcija.naslov}
                        </h4>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition group-open:rotate-45">
                        +
                      </span>
                    </summary>

                    <div className="border-t border-white/10 px-6 py-6 md:px-8">
                      <div className="max-w-4xl space-y-3 text-sm leading-7 text-white/80 md:text-[15px]">
                        {sekcija.stavke.map((stavka) => {
                          const bullet = /^[-•.]\s*/.test(stavka);
                          const clean = stavka.replace(/^[-•.]\s*/, "");

                          return bullet ? (
                            <div key={clean} className="flex gap-3">
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                              <span>{clean}</span>
                            </div>
                          ) : (
                            <p key={clean} className="text-white/75">
                              {clean}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </motion.details>
                ))
              ) : (
                lekcije.map((lekcija, i) => {
                  const stavke = formatLekcijaOpis(lekcija?.opis || "");

                  return (
                    <motion.details
                      key={lekcija?.lekcijaId ?? `${i}-${lekcija?.naziv || "lekcija"}`}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.5, delay: i * 0.04 }}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[2px]"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.35em] text-red-400/90">Deo {String(i + 1).padStart(2, "0")}</p>
                          <h4 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                            {lekcija?.naziv}
                          </h4>
                        </div>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition group-open:rotate-45">
                          +
                        </span>
                      </summary>

                      <div className="border-t border-white/10 px-6 py-6 md:px-8">
                        {stavke.length > 0 ? (
                          <ul className="space-y-3 text-sm leading-relaxed text-white/80 md:text-base">
                            {stavke.map((stavka) => (
                              <li key={`${lekcija?.lekcijaId ?? i}-${stavka}`} className="flex gap-3">
                                <span className="mt-2 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                <span>{stavka}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm md:text-base text-white/70 leading-relaxed">
                            {lekcija?.opis || "Sadržaj ove lekcije biće uskoro dopunjen."}
                          </p>
                        )}
                      </div>
                    </motion.details>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
