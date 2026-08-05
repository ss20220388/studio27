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

      {/* Tamni sloj prekrivača */}
      <div className="absolute inset-0 bg-black/60 backdrop-brightness-90" />

      <FloatingShapes />

      {/* Sadržaj na levoj strani */}
      <motion.div
        style={{ opacity, y }}
        className="relative z-10 max-w-3xl text-left flex flex-col items-start space-y-6 mt-10"
      >
        <div className="space-y-3">
          {/* Naslov (naziv) i komentarGore desno */}
          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-md">
              {kurs?.naziv}
            </h1>

            {kurs?.komentarGore && (
              <span className="text-xs sm:text-sm font-semibold text-zinc-300 border-l-2 border-[#550000] pl-3 uppercase">
                {kurs.komentarGore}
              </span>
            )}
          </div>

          {/* glavniKurs (npr. 3Ds MAX + CORONA) */}
          {kurs?.glavniKurs && (
            <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-zinc-400">
              {kurs.glavniKurs}
            </p>
          )}
        </div>

        {/* komentarSredina - elegantan i moderan stil umesto prevelikih slova */}
        {bulletLines.length > 0 && (
          <div className="space-y-2.5 pt-2 text-sm sm:text-base md:text-lg font-medium text-zinc-200 leading-relaxed max-w-2xl drop-shadow">
            {bulletLines.map((line, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <span className="text-[#550000] font-bold text-lg select-none">•</span>
                <span>{line.replace(/^-\s*/, "")}</span>
              </div>
            ))}
          </div>
        )}

        {/* Dugme sa tamno crvenim akcentom */}
        <div className="pt-4">
          <a
            href="#detalje-kursa"
            onClick={scrollToDetails}
            className="inline-flex items-center justify-center bg-[#550000] hover:bg-[#770000] text-white text-xs sm:text-sm font-bold uppercase tracking-widest px-8 py-3.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          >
            Saznaj više
          </a>
        </div>
      </motion.div>
    </section>
  );
}