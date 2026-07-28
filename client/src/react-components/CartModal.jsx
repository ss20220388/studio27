import React, { useState, useEffect, useCallback } from "react";
const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

export default function CartModal({ accessToken: initialToken }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [user, setUser] = useState(null);

  const getCookieToken = () => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )token=([^;]+)"));
    return match ? match[2] : null;
  };

  const fetchUser = useCallback(async () => {
    const token = getCookieToken() || initialToken;

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch (e) {
      setUser(null);
    }
  }, [initialToken]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const loadCart = () => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cart_items");
        setCart(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setCart([]);
      }
    }
  };

  useEffect(() => {
    loadCart();

    const handleCartUpdate = (e) => {
      if (e?.detail) setCart(e.detail);
      else loadCart();
      setIsOpen(true);
    };

    const handleOpen = () => {
      loadCart();
      fetchUser();
      setIsOpen(true);
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("open-cart", handleOpen);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("open-cart", handleOpen);
    };
  }, [fetchUser]);

  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalPrice = cart.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  const updateQuantity = (id, delta) => {
    const updated = cart
      .map((item) => {
        if (item.id === id) {
          const newQty = (item.quantity || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    setCart(updated);
    localStorage.setItem("cart_items", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: updated }));
  };

  const removeItem = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem("cart_items", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: updated }));
  };

  const openLoginModal = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("open-login"));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const finalData = user
      ? { ...user, isGuest: false }
      : { ...formData, isGuest: true };

    localStorage.setItem("user_order_data", JSON.stringify(finalData));
    localStorage.setItem("cart_order_data", JSON.stringify(cart));

    if (window.navigation) {
      window.navigation.navigate("/pay");
    } else {
      window.location.href = "/pay";
    }
  };

  return (
    <div>
      {!isOpen && (
        <button
          onClick={() => {
            loadCart();
            fetchUser();
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 sm:bottom-auto sm:top-40 sm:left-8 z-[80] w-14 h-14 bg-zinc-900 sm:bg-[#e5e7eb]  text-white sm:text-black rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <svg
            className="w-6 h-6 stroke-[1.5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white sm:border-black">
              {totalItems}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-10002 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 overflow-hidden">
          <div className="relative w-full sm:max-w-[480px] bg-white text-black p-5 sm:p-8 shadow-2xl max-h-[90vh] sm:max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-none font-sans">
            {/* Dugme X spušteno unutar belog kartičnog prozora */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-zinc-400 hover:text-black text-2xl font-light p-2 cursor-pointer leading-none transition-colors"
            >
              ✕
            </button>

            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black tracking-tight border-b border-zinc-100 pb-3 pr-8">
              Vaša porudžbina
            </h2>

            <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-6 border-b border-zinc-200">
              {cart.length === 0 ? (
                <p className="text-zinc-500 text-center py-6 text-sm">
                  Vaša korpa je trenutno prazna.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                    {item.image && (
                      <img
                        src={API_URL + "/api/uploaded-images" + item.image}
                        alt={item.title}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-black uppercase tracking-wide leading-tight text-xs sm:text-sm line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="text-zinc-700 font-semibold mt-1">
                        {(item.price * (item.quantity || 1)).toLocaleString()} €
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-zinc-300 rounded px-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-black font-bold"
                        >
                          –
                        </button>
                        <span className="font-medium px-2 text-xs">{item.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-black font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center py-4 font-bold text-base text-black border-b border-zinc-100 mb-4">
              <span>Ukupno:</span>
              <span className="text-lg">{totalPrice.toLocaleString()} €</span>
            </div>

            {!user?.email ? (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded text-xs text-amber-900 mb-5">
                <p className="font-semibold mb-1 text-sm">Nemate nalog?</p>
                <p className="text-amber-800 leading-relaxed mb-2">
                  Popunite polja ispod. Nakon uplate, šaljemo pristupne podatke na vaš e-mail.
                </p>
                <p className="text-zinc-600 border-t border-amber-200/60 pt-2">
                  Već imate nalog?{" "}
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="underline font-bold text-black hover:text-orange-600 cursor-pointer"
                  >
                    Prijavite se ovde
                  </button>
                </p>
              </div>
            ) : (
              <div className="bg-zinc-100 p-3 border border-zinc-200 rounded text-xs text-zinc-800 mb-5">
                Prijavljeni ste kao:{" "}
                <span className="font-bold text-black">{user.email || user.name}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!user?.email && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Ime i prezime
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Petar Petrović"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 border border-zinc-300 focus:border-black focus:outline-none text-xs sm:text-sm text-black bg-white rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Email adresa
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="primer@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 border border-zinc-300 focus:border-black focus:outline-none text-xs sm:text-sm text-black placeholder-zinc-400 bg-white rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Broj telefona
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+381 6X XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 border border-zinc-300 focus:border-black focus:outline-none text-xs sm:text-sm text-black placeholder-zinc-400 bg-white rounded-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3 sm:py-3.5 bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-bold transition-colors uppercase tracking-wider text-xs sm:text-sm cursor-pointer"
                >
                  Nastavi na Plaćanje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}