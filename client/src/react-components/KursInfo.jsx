/* eslint-disable react/prop-types */
import { motion } from "framer-motion";

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

export default function KursInfo({ kurs }) {
  const lekcije = Array.isArray(kurs?.lekcije) ? kurs.lekcije : [];
  const sadrzajLinije = formatSadrzaj(kurs?.sadrzaj || "");

  return (
    <>
      {(sadrzajLinije.length > 0 || lekcije.length > 0) && (
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
                Pregled lekcija i oblasti koje kurs pokriva.
              </h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
                Sažet prikaz strukture kursa, fokusiran na teme koje polaznik dobija i redosled kojim ih prolazi.
              </p>
            </motion.div>

            <div className="space-y-6">
              {sadrzajLinije.length > 0 ? (
                <div className="max-w-4xl rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-[2px] md:p-8">
                  <div className="max-w-3xl space-y-3 text-sm leading-7 text-white/85 md:text-[15px]">
                    {sadrzajLinije.map((linija) => {
                      const bullet = /^[-•.]\s*/.test(linija);
                      const clean = linija.replace(/^[-•.]\s*/, "");

                      if (bullet) {
                        return (
                          <div key={clean} className="flex gap-3">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                            <span>{clean}</span>
                          </div>
                        );
                      }

                      if (isHeadingLine(clean)) {
                        return (
                          <div key={clean} className="mt-6 text-base font-semibold uppercase tracking-[0.2em] text-white md:text-lg">
                            {clean}
                          </div>
                        );
                      }

                      return (
                        <p key={clean} className="text-white/75">
                          {clean}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : (
                lekcije.map((lekcija, i) => {
                  const stavke = formatLekcijaOpis(lekcija?.opis || "");

                  return (
                    <motion.article
                      key={lekcija?.lekcijaId ?? `${i}-${lekcija?.naziv || "lekcija"}`}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                    >
                      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                        <div className="border-b border-white/10 bg-linear-to-b from-[#111] to-black p-6 text-white md:p-8 lg:border-b-0 lg:border-r">
                          <div>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-red-400">
                              Deo {String(i + 1).padStart(2, "0")}
                            </p>
                            <h4 className="text-2xl font-semibold leading-tight md:text-3xl">
                              {lekcija?.naziv}
                            </h4>
                          </div>

                          <p className="mt-8 text-sm text-white/70">
                            {lekcija?.videoUrls?.length
                              ? `${lekcija.videoUrls.length} video materijala`
                              : "Pregled sadržaja"}
                          </p>
                        </div>

                        <div className="bg-black/20 p-6 md:p-8 lg:p-10">
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
                      </div>
                    </motion.article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

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

          <div className="grid items-center gap-16 md:grid-cols-2">
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
                  : "Ovaj kurs je dizajniran da vam pokaže kako da iskoristite savremene AI alate i tehnologije kako biste ubrzali svoj rad, automatizovali procese i stvorili nove poslovne prilike."}
              </motion.p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Format", value: "Video lekcije", icon: "🎬" },
                  { label: "Nivo", value: "Svi nivoi", icon: "📈" },
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
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <p className="mt-2 text-xs uppercase tracking-wider text-gray-500">
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
              <div className="absolute -inset-4 bg-linear-to-br from-red-900/25 to-red-700/15 rounded-3xl blur-2xl" />
              <img
                src={`${import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs"}/api/uploaded-images${kurs?.slikaUrl}`}
                className="relative aspect-4/5 w-full rounded-2xl object-cover shadow-2xl"
                alt={kurs?.naziv || "Kurs"}
              />
            </motion.div>
          </div>
        </div>

        <div className="w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
      </section>
    </>
  );
}
