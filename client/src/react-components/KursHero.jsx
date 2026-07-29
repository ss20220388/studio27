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

  // Koristimo sliku iz kursSlike ako postoji, inače slikaUrl iz kursa
  const firstGalleryImage = kursSlike && kursSlike.length > 0 ? kursSlike[0]?.url : null;
  const primaryImage = resolveImageSrc(firstGalleryImage || kurs?.slikaUrl);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const imgBrightness = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  const scrollToDetails = (e) => {
    e.preventDefault();
    const target = document.getElementById("detalje-kursa");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={ref}
      className="relative h-[120vh] flex items-center justify-center overflow-hidden bg-black text-white"
    >
      <h1 className="sr-only">{kurs?.naziv || "Kurs"}</h1>
      {primaryImage && (
        <motion.img
          src={primaryImage}
          className="absolute w-full h-full object-cover"
          style={{
            scale,
            filter: useTransform(imgBrightness, (v) => `brightness(${v})`),
          }}
          alt="slika kursa"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

      <FloatingShapes />

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 max-w-5xl text-center px-6 flex flex-col items-center"
      >
        {/* Kategorija badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-block mb-6"
        >
          <span className="px-5 py-2 text-xs md:text-sm font-semibold tracking-[0.25em] uppercase bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90">
            27archviz
          </span>
        </motion.div>

        {/* Naslov Kursa */}
        <motion.h1
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-4xl md:text-8xl max-w-[90vw] font-black leading-tight mb-8 tracking-tight uppercase text-white"
        >
          {kurs?.naziv || "Kurs"}
        </motion.h1>

        {/* Akciono Dugme */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <a
            href="#detalje-kursa"
            onClick={scrollToDetails}
            className="inline-flex items-center justify-center bg-[#bc3b24] hover:bg-[#9e301c] text-white text-xs md:text-sm font-bold uppercase tracking-wider px-8 py-4 rounded-full transition-all duration-300 shadow-xl hover:scale-105"
          >
            Pogledaj kurs
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-12"
        >
          <a href="#detalje-kursa" onClick={scrollToDetails} className="block cursor-pointer">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-6 h-10 mx-auto border-2 border-white/30 rounded-full flex justify-center pt-2 hover:border-white/60 transition-colors"
            >
              <motion.div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
            </motion.div>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}