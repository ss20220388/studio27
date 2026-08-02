import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import FloatingShapes from "./FloatingShapes";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

const resolveImageSrc = (imagePath) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${API_URL}/api/uploaded-images${imagePath}`;
};

export default function KursHero({ kurs, kursSlike }) {
  const ref = useRef(null);

  const firstGalleryImage = kursSlike && kursSlike.length > 0 ? kursSlike[0]?.url : null;
  const primaryImage = resolveImageSrc(firstGalleryImage || kurs?.slikaUrl);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const scrollToDetails = (e) => {
    e.preventDefault();
    const target = document.getElementById("detalje-kursa");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  // komentarSredina pretvaramo u bullet linije
  const bulletLines = kurs?.komentarSredina
    ? kurs.komentarSredina.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    : [];

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-start overflow-hidden bg-black text-white px-6 md:px-16 py-20"
    >
      {/* Pozadinska slika kursa */}
      {primaryImage && (
        <motion.img
          src={primaryImage}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ scale }}
          alt={kurs?.naziv || "slika kursa"}
        />
      )}

      {/* Tamni sloj prekrit s ciljem lakšeg čitanja */}
      <div className="absolute inset-0 bg-black/60 backdrop-brightness-90" />

      <FloatingShapes />

      {/* Sadržaj na levoj strani */}
      <motion.div
        style={{ opacity, y }}
        className="relative z-10 max-w-4xl text-left flex flex-col items-start space-y-6 mt-10"
      >
        <div>
          {/* Naslov (naziv) i komentarGore desno */}
          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md">
              {kurs?.naziv}
            </h1>

            {kurs?.komentarGore && (
              <span className="text-xs sm:text-sm font-semibold text-zinc-300 border-l-2 border-orange-500 pl-3">
                {kurs.komentarGore}
              </span>
            )}
          </div>

          {/* glavniKurs (npr. 3Ds MAX + CORONA) */}
          {kurs?.glavniKurs && (
            <p className="text-xs sm:text-sm md:text-base font-semibold tracking-wider uppercase text-zinc-300 mt-3">
              {kurs.glavniKurs}
            </p>
          )}
        </div>

        {/* komentarSredina ispisan kao bulleti sa crticom */}
        {bulletLines.length > 0 && (
          <div className="space-y-2 py-2 text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white drop-shadow">
            {bulletLines.map((line, idx) => (
              <p key={idx}>- {line.replace(/^-\s*/, "")}</p>
            ))}
          </div>
        )}

        {/* komentarDole - veliki donji tekst */}
        {kurs?.komentarDole && (
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold uppercase leading-tight text-white max-w-3xl pt-2">
            {kurs.komentarDole}
          </h2>
        )}

        {/* Zaobljeno narandžasto dugme sa sjajem */}
        <div className="pt-6">
          <a
            href="#detalje-kursa"
            onClick={scrollToDetails}
            className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white text-sm md:text-base font-black uppercase tracking-widest px-10 py-4 rounded-full transition-all duration-300 shadow-[0_0_25px_rgba(249,115,22,0.6)] hover:shadow-[0_0_35px_rgba(249,115,22,0.85)] hover:scale-105 active:scale-95 cursor-pointer"
          >
            Saznaj više
          </a>
        </div>
      </motion.div>
    </section>
  );
}