import { set } from "astro:schema";
import { motion } from "framer-motion";
import React from "react";
export default function BuyButton({ price, token }) {
  const [nistePrijavljeni, setNistePrijavljeni] = React.useState(false);
  const [user, setUser] = React.useState({ data: null, error: null });
  function handelBut() {
    if (!token) {
      setNistePrijavljeni(true);
      setTimeout(() => setNistePrijavljeni(false), 1500);
    } else {
      window.location.href = `http://app.studio27.rs/kurs`;
    }

  }

  React.useEffect(() => {
    if (token) {
      async function fetchUser() {
        try {
          const res = await fetch(`http://api.studio27.rs/api/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          setUser(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
          return { error: "Failed to fetch user data" };
        }
      }
      fetchUser()
    }
  }, [token]);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(127,29,29,0.5)" }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="relative group cursor-pointer overflow-hidden bg-linear-to-r from-red-900 to-red-700 text-white px-12 py-5  font-semibold text-lg shadow-xl shadow-red-900/30"
        onClick={() => handelBut()}
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
      {nistePrijavljeni && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 flex justify-center items-center flex-col bottom-0 left-0 right-0 mt-16 bg-black/80 text-white px-4 py-2 rounded shadow-lg"
        >
          <div className="bg-black px-4 py-8 shadow-lg shadow-grey-500/50 rounded-lg shadow-2xl mb-4" transition={{ duration: 1, ease: "easeInOut" }} >
            <h3>Morate biti prijavljeni</h3>
            <p>Morate biti prijavljeni da kupite kurs.</p>
          </div>

        </motion.div>
      )}
    </>
  );
}