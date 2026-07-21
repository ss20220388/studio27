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

  const [slike, setSlike] = useState([]);
  const [activeImage, setActiveImage] = useState("");

  const resolveImageSrc = (imagePath) => {
    if (!imagePath) return "";
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${API_URL}/api/uploaded-images${normalizedPath}`;
  };

  useEffect(() => {
    setActiveImage(resolveImageSrc(kurs?.slikaUrl));
  }, [kurs?.slikaUrl]);

  useEffect(() => {
    async function fetchSlike() {
      if (kurs?.id) {
        try {
          const response = await fetch(`${API_URL}/api/kursslika/${kurs.id}`);
          if (response.ok) {
            const data = await response.json();
            setSlike(data.kursSlika || []);
          }
        } catch (error) {
          console.error("Greška pri dohvatanju slika", error);
        }
      }
    }
    fetchSlike();
  }, [kurs?.id]);

  return (
    <>
      {/* Section 1: Course Info */}
      <section className="relative overflow-hidden bg-white text-gray-900">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-2xl border-l-2 border-orange-400 pl-5 sm:pl-7"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.45em] text-orange-500">
              O kursu
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Sve što treba da znaš o kursu.
            </h2>
          </motion.div>

          <div className="grid items-start gap-14 lg:grid-cols-[0.92fr_1.08fr]">
            {/* Left: Text */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mb-8 text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl"
              >
                {kurs?.naziv || "Kurs"}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="mb-10 text-lg leading-relaxed text-gray-500"
              >
                {kurs?.opis ||
                  "Ovaj kurs je dizajniran da vam pokaže kako da iskoristite savremene alate i tehnologije kako biste ubrzali svoj rad, automatizovali procese i stvorili nove poslovne prilike."}
              </motion.p>

              {/* Price Card */}
              <div className="mt-10 rounded-3xl border border-gray-100 bg-gray-50 px-6 py-5 shadow-lg shadow-orange-500/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                      Cena kursa
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {kurs?.cena ? `${kurs.cena} €` : "Cena na upit"}
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-7 text-gray-500">
                      Kupovina otključava kompletan sadržaj kursa odmah nakon potvrde.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <BuyButton
                      price={kurs?.cena}
                      kurs={{
                        id: kurs?.id,
                        naziv: kurs?.naziv,
                        cena: kurs?.cena,
                        slikaUrl: kurs?.slikaUrl
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Format", value: "Video", icon: "🎬" },
                  { label: "Nivo", value: "Svi", icon: "📈" },
                  { label: "Pristup", value: "Doživotno", icon: "♾️" },
                  { label: "Podrška", value: "24/7", icon: "💬" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    custom={index}
                    variants={cardVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Image Gallery */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-orange-100/50 to-orange-50/30 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 shadow-xl shadow-orange-500/5">
                <div className="flex flex-col gap-4">
                  <img
                    src={activeImage}
                    alt={kurs?.naziv || "Kurs"}
                    className="h-[600px] w-full rounded-2xl object-cover"
                    loading="lazy"
                  />

                  {slike.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {slike.map((slika) => (
                        <img
                          key={slika.idSlika}
                          src={resolveImageSrc(slika.url)}
                          onClick={() => setActiveImage(resolveImageSrc(slika.url))}
                          loading="lazy"
                          className="h-28 w-full cursor-pointer rounded-xl object-cover transition duration-300 hover:scale-105"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </section>

      {/* Section 2: Course Content */}
      {(sadrzajSekcije.length > 0 || lekcije.length > 0) && (
        <section className="relative overflow-hidden bg-gray-50 text-gray-900">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.06),transparent_40%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.5),transparent_35%)]" />

          <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-14 max-w-3xl border-l-2 border-orange-400 pl-5 sm:pl-7"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.45em] text-orange-500">
                Sadržaj kursa
              </span>
              <h3 className="mt-4 text-3xl font-bold tracking-tight leading-tight text-gray-900 md:text-5xl">
                Pregled strukture kursa.
              </h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-500 md:text-base">
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
                    className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg shadow-orange-500/5"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-orange-500">
                          Sadržaj dela
                        </p>
                        <h4 className="mt-2 text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                          {sekcija.naslov}
                        </h4>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gray-200 bg-gray-50 text-gray-400 transition group-open:rotate-45">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 5v14m-7-7h14" />
                        </svg>
                      </span>
                    </summary>

                    <div className="border-t border-gray-100 px-6 py-6 md:px-8">
                      <div className="max-w-4xl space-y-3 text-sm leading-7 text-gray-600 md:text-[15px]">
                        {sekcija.stavke.map((stavka) => {
                          const bullet = /^[-•.]\s*/.test(stavka);
                          const clean = stavka.replace(/^[-•.]\s*/, "");

                          return bullet ? (
                            <div key={clean} className="flex gap-3">
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-400" />
                              <span>{clean}</span>
                            </div>
                          ) : (
                            <p key={clean} className="text-gray-600">
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
                      className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg shadow-orange-500/5"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-orange-500">
                            Deo {String(i + 1).padStart(2, "0")}
                          </p>
                          <h4 className="mt-2 text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                            {lekcija?.naziv}
                          </h4>
                        </div>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gray-200 bg-gray-50 text-gray-400 transition group-open:rotate-45">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 5v14m-7-7h14" />
                          </svg>
                        </span>
                      </summary>

                      <div className="border-t border-gray-100 px-6 py-6 md:px-8">
                        {stavke.length > 0 ? (
                          <ul className="space-y-3 text-sm leading-relaxed text-gray-600 md:text-base">
                            {stavke.map((stavka) => (
                              <li key={`${lekcija?.lekcijaId ?? i}-${stavka}`} className="flex gap-3">
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-400" />
                                <span>{stavka}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm leading-relaxed text-gray-500 md:text-base">
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