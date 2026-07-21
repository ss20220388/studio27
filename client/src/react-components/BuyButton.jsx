// BuyButton.jsx
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

// Helperi — bez window poziva na top level
function getGlobalUser() {
  if (typeof window === 'undefined') return null;
  return window.__USER_STATE__?.user || null;
}

function setGlobalUser(user) {
  if (typeof window === 'undefined') return;
  if (!window.__USER_STATE__) window.__USER_STATE__ = { user: null, checked: false, listeners: [] };
  window.__USER_STATE__.user = user;
  window.__USER_STATE__.checked = true;
  window.__USER_STATE__.listeners.forEach(cb => cb(user));
}

function subscribeToUser(callback) {
  if (typeof window === 'undefined') return () => {};
  if (!window.__USER_STATE__) window.__USER_STATE__ = { user: null, checked: false, listeners: [] };
  window.__USER_STATE__.listeners.push(callback);
  return () => {
    const idx = window.__USER_STATE__.listeners.indexOf(callback);
    if (idx > -1) window.__USER_STATE__.listeners.splice(idx, 1);
  };
}

function isAuthChecked() {
  if (typeof window === 'undefined') return false;
  return window.__USER_STATE__?.checked || false;
}

export default function BuyButton({ 
  userPocetni = { data: null, error: null }, 
  kurs = null,
}) {
  const [user, setUser] = React.useState(null); // start null, proveri u useEffect
  const [showCart, setShowCart] = React.useState(false);
  const [cartVisible, setCartVisible] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  // === CLIENT-ONLY AUTH CHECK ===
  React.useEffect(() => {
    // Ako je već provereno od druge komponente
    if (isAuthChecked()) {
      setUser(getGlobalUser());
      setCheckingAuth(false);
      return;
    }

    async function checkAuth() {
      const token = localStorage.getItem("token");
      if (!token) {
        setGlobalUser(null);
        setUser(null);
        setCheckingAuth(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });

        if (res.ok) {
          const meData = await res.json();
          setGlobalUser(meData);
          setUser(meData);
        } else {
          localStorage.removeItem("token");
          setGlobalUser(null);
          setUser(null);
        }
      } catch (e) {
        setGlobalUser(null);
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  // Slušaj promene od LoginSectionForm
  React.useEffect(() => {
    const unsubscribe = subscribeToUser((newUser) => {
      setUser(newUser);
      if (pendingCartRef.current && newUser) {
        openCart();
        pendingCartRef.current = false;
      }
    });

    const onLogin = (e) => {
      setGlobalUser(e.detail);
      setUser(e.detail);
      if (pendingCartRef.current) {
        openCart();
        pendingCartRef.current = false;
      }
    };
    const onLogout = () => {
      setGlobalUser(null);
      setUser(null);
    };

    window.addEventListener('user-logged-in', onLogin);
    window.addEventListener('user-logged-out', onLogout);

    return () => {
      unsubscribe();
      window.removeEventListener('user-logged-in', onLogin);
      window.removeEventListener('user-logged-out', onLogout);
    };
  }, []);

  const pendingCartRef = React.useRef(false);

  const handleBuy = () => {
    if (!user) {
      pendingCartRef.current = true;
      window.dispatchEvent(new CustomEvent('open-login'));
    } else {
      openCart();
    }
  };

  const openCart = () => {
    setShowCart(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setCartVisible(true)));
  };

  const closeCart = () => {
    setCartVisible(false);
    setTimeout(() => setShowCart(false), 350);
  };

  if (checkingAuth) {
    return (
      <button disabled className="relative cursor-not-allowed overflow-hidden rounded-xl bg-gray-200 px-12 py-5 text-lg font-semibold text-gray-400">
        <span className="flex items-center gap-3">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Provera...
        </span>
      </button>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(249,115,22,0.4)" }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="relative group cursor-pointer overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white px-12 py-5 font-semibold text-lg shadow-xl shadow-orange-500/25"
        onClick={handleBuy}
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="relative flex items-center gap-3">
          {user ? "Kupi kurs" : "Prijavi se i kupi"}
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </motion.button>

      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: cartVisible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => e.target === e.currentTarget && closeCart()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: cartVisible ? 1 : 0, scale: cartVisible ? 1 : 0.95, y: cartVisible ? 0 : 20 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              <button
                onClick={closeCart}
                className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 hover:bg-orange-50 hover:border-orange-200 text-gray-400 hover:text-orange-500 transition-all duration-300 text-xl cursor-pointer"
              >
                ×
              </button>
              <CartContent kurs={kurs} user={user} onClose={closeCart} API_URL={API_URL} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// CART CONTENT — isti kao pre
// ============================================
function CartContent({ kurs, user, onClose, API_URL }) {
  const [uploaded, setUploaded] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const resolveImageSrc = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_URL}/api/uploaded-images${path.startsWith("/") ? path : `/${path}`}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploaded) return;

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("path", "/uplatnice");
      formData.append("file", uploaded);

      const uploadRes = await fetch(`${API_URL}/api/upload-hetzner`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Greška pri upload-u uplatnice");

      const placanjeRes = await fetch(`${API_URL}/api/dodaj-placanje`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: user.id || user.userId,
          kursId: kurs.id,
          datumPlacanja: new Date().toISOString().split('T')[0],
          cenaPlacanja: kurs.cena,
          status: "C",
          tip: "UPLATNICA",
          url: `/${uploaded.name}`
        }),
      });

      if (!placanjeRes.ok) {
        throw new Error("Verovatno ste već platili ovaj kurs. Kontaktirajte nas ako mislite da nije tako.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Uplata evidentirana!</h3>
        <p className="text-gray-500 mb-8 leading-relaxed">Vaša uplata je uspešno primljena. Kontaktiraćemo vas ukoliko nešto ne valja.</p>
        <button onClick={onClose} className="h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-8 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-400 hover:to-orange-300 active:scale-[0.98]">Završi</button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">1</div>
        <div className="h-0.5 w-8 bg-orange-500"></div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">2</div>
        <div className="h-0.5 w-8 bg-gray-200"></div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-400">3</div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-1">Plaćanje uplatnicom</h3>
      <p className="text-sm text-gray-500 mb-6">Korak 2 od 3 — Pošaljite dokaz o uplati</p>

      <div className="mb-6 flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <img src={resolveImageSrc(kurs?.slikaUrl)} alt={kurs?.naziv} className="h-20 w-20 rounded-xl object-cover" />
        <div className="flex flex-1 flex-col justify-center">
          <h4 className="font-bold text-gray-900">{kurs?.naziv}</h4>
          <p className="mt-1 text-2xl font-bold text-orange-500">{kurs?.cena} €</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Primaoc</span>
            <p className="mt-1 text-sm font-semibold text-gray-900">Studio 27 DOO</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Svrha uplate</span>
            <p className="mt-1 text-sm font-semibold text-gray-900">Kupovina kursa {kurs?.naziv}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Iznos</span>
            <p className="mt-1 text-sm font-bold text-gray-900">{kurs?.cena} €</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Model</span>
            <p className="mt-1 text-sm font-semibold text-gray-900">97</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Poziv na broj</span>
            <p className="mt-1 text-sm font-semibold text-gray-900">2026/01</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Priložite dokaz o uplati (slika ili PDF)</label>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setUploaded(e.target.files[0])} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-600 hover:file:bg-orange-200" required />
          {uploaded && <p className="mt-2 text-xs text-green-600 flex items-center gap-1"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{uploaded.name}</p>}
        </div>

        {error && <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">Otkaži</button>
          <button type="submit" disabled={isSubmitting || !uploaded} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-400 hover:to-orange-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Slanje...</> : "Pošalji uplatnicu"}
          </button>
        </div>
      </form>
    </div>
  );
}