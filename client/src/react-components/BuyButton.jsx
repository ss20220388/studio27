import { motion } from "framer-motion";

export default function BuyButton({ price }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(127,29,29,0.5)" }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="relative group cursor-pointer overflow-hidden bg-linear-to-r from-red-900 to-red-700 text-white px-12 py-5 rounded-full font-semibold text-lg shadow-xl shadow-red-900/30"
    >
      {/* Shimmer effect */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />

      <span className="relative flex items-center gap-3">
        Kupi kurs
        {price && (
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
            {price} RSD
          </span>
        )}
        <svg
          className="w-5 h-5 group-hover:translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </span>
    </motion.button>
  );
}