import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import FloatingShapes from "./FloatingShapes";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

export default function KursHero({ kurs }) {

  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const imgBrightness = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <section
      ref={ref}
      className="relative h-[120vh] flex items-center justify-center overflow-hidden bg-black text-white"
    >

      <motion.img
        src={`${API_URL}/api/uploaded-images${kurs.slikaUrl}`}
        className="absolute w-full h-full object-cover"
        style={{
          scale,
          filter: useTransform(imgBrightness, (v) => `brightness(${v})`),
        }}
      />

      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/60 to-black" />

      <FloatingShapes />

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 max-w-5xl text-center px-6"
      >

        {/* Kategorija badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-block mb-8"
        >
          <span className="px-5 py-2 text-sm font-medium tracking-widest uppercase bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80">
            Studio 27 Kurs
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-6xl md:text-8xl font-bold leading-tight mb-8 tracking-tight"
        >
          {kurs.naziv}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto"
        >
          {kurs.opis? kurs.opis : "U ovom kursu naučićete kako da koristite moderne AI alate za generisanje ideja, automatizaciju poslovnih procesa, analizu podataka i kreiranje digitalnih proizvoda."}
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-6 h-10 mx-auto border-2 border-white/30 rounded-full flex justify-center pt-2"
          >
            <motion.div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>

      </motion.div>

    </section>
  );
}