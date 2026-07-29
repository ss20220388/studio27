import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const features = [
  { icon: "⚡", text: "Automatizacija procesa" },
  { icon: "📊", text: "Analiza podataka" },
  { icon: "🎯", text: "Generisanje ideja" },
  { icon: "🚀", text: "Digitalni proizvodi" },
];

export default function BigTextSection({ naslov, opis, glavniTekst }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const textX = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const textX2 = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  // Fallback text ako nema props
  const displayGlavni = glavniTekst || "27archviz";
  const displayNaslov = naslov || "Od nule do profesionalnog rendera";
  const displayOpis = opis || "Ovaj kurs je dizajniran da vam pokaže kako da iskoristite savremene alate i tehnologije kako biste ubrzali svoj rad, automatizovali procese i stvorili nove poslovne prilike.";

  // Podeli naslov na dva dela (sve osim poslednje 2 reči, i poslednje 2 reči)
  const words = displayNaslov.split(" ");
  const firstPart = words.slice(0, -2).join(" ");
  const lastPart = words.slice(-2).join(" ");

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white py-20 text-gray-900 md:py-28"
    >
      {/* Horizontal scrolling text marquee - decorative */}
      <div className="relative mb-12 overflow-hidden">
        <motion.div style={{ x: textX }} className="whitespace-nowrap">
          <span className="select-none text-[70px] font-black tracking-tighter text-gray-300 md:text-[110px]">
            {displayGlavni} &nbsp; {displayGlavni} &nbsp; {displayGlavni} &nbsp;
          </span>
        </motion.div>
        <motion.div style={{ x: textX2 }} className="-mt-6 whitespace-nowrap">
          <span className="select-none text-[70px] font-black tracking-tighter text-gray-300 md:text-[110px]">
            27archviz &nbsp; 27archviz &nbsp; 27archviz &nbsp;
          </span>
        </motion.div>
      </div>

      {/* Main heading */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-8 text-4xl font-bold tracking-tight md:text-6xl"
        >
          {firstPart} <br />
          <br />
          <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            {lastPart}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-16 max-w-3xl text-lg leading-relaxed text-gray-500 md:text-xl"
        >
          {displayOpis}
        </motion.p>
        
      </div>

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 60%)",
        }}
      />
    </section>
  );
}