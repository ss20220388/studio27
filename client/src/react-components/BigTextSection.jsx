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

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-black text-white relative overflow-hidden"
    >
      {/* Horizontal scrolling text marquee - decorative */}
      <div className="relative mb-12 overflow-hidden">
        <motion.div style={{ x: textX }} className="whitespace-nowrap">
          <span className="text-[70px] md:text-[110px] font-black text-white/3 select-none tracking-tighter">
            {glavniTekst} &nbsp; {glavniTekst} &nbsp; {glavniTekst} &nbsp;
          </span>
        </motion.div>
        <motion.div style={{ x: textX2 }} className="whitespace-nowrap -mt-6">
          <span className="text-[70px] md:text-[110px] font-black text-white/3 select-none tracking-tighter">
            STUDIO 27 &nbsp; STUDIO 27 &nbsp; STUDIO 27 &nbsp;
          </span>
        </motion.div>
      </div>

      {/* Main heading */}
      <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-8"
        >
          {naslov.split(" ").slice(0, -2).join(" ")} <br />
          <br />
          <span className="bg-linear-to-r from-red-800 to-red-500 bg-clip-text text-transparent">
            {naslov.split(" ").slice(-2).join(" ")}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto mb-16"
        >
          {opis? opis : "Ovaj kurs je dizajniran da vam pokaže kako da iskoristite savremene AI alate i tehnologije kako biste ubrzali svoj rad, automatizovali procese i stvorili nove poslovne prilike."}
        </motion.p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-4">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full"
            >
              <span className="text-xl">{feat.icon}</span>
              <span className="text-sm font-medium text-gray-300">
                {feat.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(127,29,29,0.08) 0%, transparent 60%)",
        }}
      />
    </section>
  );
}