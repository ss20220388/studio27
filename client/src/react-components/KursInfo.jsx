import { motion } from "framer-motion";

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function KursInfo({ kurs }) {
  return (
    <section className="relative bg-black text-white overflow-hidden">

      {/* Decorative divider */}
      <div className="w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

      <div className="max-w-6xl mx-auto py-32 md:py-40 px-6">

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-red-400">
            O kursu
          </span>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-center">

          <div>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-4xl md:text-5xl font-bold mb-8 tracking-tight leading-tight"
            >
              Sve što treba da
              <br />
              <span className="bg-linear-to-r from-red-800 to-red-500 bg-clip-text text-transparent">
                znaš o kursu
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-lg text-gray-400 leading-relaxed mb-10"
            >
              {kurs.opis}
            </motion.p>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Format", value: "Video lekcije", icon: "🎬" },
                { label: "Nivo", value: "Svi nivoi", icon: "📈" },
                { label: "Pristup", value: "Doživotno", icon: "♾️" },
                { label: "Podrška", value: "24/7", icon: "💬" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={cardVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-xs text-gray-500 mt-2 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-white mt-1">
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
              src={`http://api.studio27.rs/api/uploaded-images${kurs.slikaUrl}`}
              className="relative rounded-2xl shadow-2xl w-full object-cover aspect-4/5"
              alt={kurs.naziv}
            />
          </motion.div>

        </div>

      </div>

      {/* Bottom divider */}
      <div className="w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

    </section>
  );
}