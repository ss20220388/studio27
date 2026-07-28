import React, { useState, useEffect, useCallback } from "react";
const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

export default function CartModal({ accessToken: initialToken }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [user, setUser] = useState(null);

  // ✅ Čitanje tokena isključivo iz "token" cookie-ja
  const getCookieToken = () => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )token=([^;]+)"));
    return match ? match[2] : null;
  };

  // ✅ Dohvatanje korisnika samo preko cookie-ja ili prosleđenog prop-a
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

  // ✅ Pri prvom renderu (ili osvežavanju stranice) proveri korisnika iz cookie-ja
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
    <>
      {!isOpen && (
        <button
          onClick={() => {
            loadCart();
            fetchUser();
            setIsOpen(true);
          }}
          className="fixed top-40 left-8 z-[100] w-14 h-14 bg-[#e5e7eb] hover:bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <svg
            className="w-7 h-7 text-black stroke-[1.5]"
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
            <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-bold text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-black">
              {totalItems}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <button
            onClick={() => setIsOpen(false)}
            className="fixed top-6 right-8 text-white hover:text-zinc-300 text-3xl font-light z-[10001] cursor-pointer"
          >
            ✕
          </button>

          <div className="relative w-full max-w-[480px] bg-white text-black p-8 shadow-2xl my-auto max-h-[92vh] overflow-y-auto font-sans">
            <h2 className="text-2xl font-bold mb-6 text-black tracking-tight">
              Vaša porudžbina:
            </h2>

            <div className="space-y-6 pb-6 border-b border-zinc-200">
              {cart.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">Vaša korpa je prazna.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                    {item.image && (
                      <img
                        src={API_URL + "/api/uploaded-images" + item.image}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-black uppercase tracking-wide leading-tight">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 hover:border-black hover:text-black transition-colors"
                      >
                        –
                      </button>
                      <span className="font-medium px-1">{item.quantity || 1}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 hover:border-black hover:text-black transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[70px] pt-1 font-semibold text-black">
                      {(item.price * (item.quantity || 1)).toLocaleString()} €
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-zinc-400 hover:text-black pt-1 pl-1 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end items-center py-4 font-bold text-base text-black">
              <span>Ukupno: {totalPrice.toLocaleString()} €</span>
            </div>

            {/* ZONA ZA INFORMISANJE O NALOGU */}
            {!user?.email ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded text-sm text-amber-900 mb-6">
                <p className="font-semibold mb-1">Nemate nalog?</p>
                <p className="text-xs text-amber-800 leading-relaxed mb-2">
                  Unesite podatke ispod. Nakon porudžbine, na vašu email adresu ćemo poslati pristupne podatke (šifru) za kreiranje vašeg naloga.
                </p>
                <p className="text-xs text-zinc-600 border-t border-amber-200/60 pt-2">
                  Već imate nalog?{" "}
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="underline font-bold hover:text-black cursor-pointer"
                  >
                    Prijavite se ovde
                  </button>
                </p>
              </div>
            ) : (
              <div className="bg-zinc-100 p-4 border border-zinc-200 rounded text-sm text-zinc-800 mb-6">
                Prijavljeni ste kao:{" "}
                <span className="font-bold">{user.email || user.name}</span>
              </div>
            )}

            {/* FORMA */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!user?.email && (
                <>
                  <div>
                    <label className="block text-sm text-zinc-800 mb-1.5 font-medium">
                      Ime i prezime
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Petar Petrović"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-zinc-400 focus:border-black focus:outline-none text-sm text-black bg-white rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-800 mb-1.5 font-medium">
                      Email adresa (za dostavu šifre i računa)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="primer@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-zinc-400 focus:border-black focus:outline-none text-sm text-black placeholder-zinc-400 bg-white rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-800 mb-1.5 font-medium">
                      Broj telefona
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+381 6X XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-zinc-400 focus:border-black focus:outline-none text-sm text-black placeholder-zinc-400 bg-white rounded-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3.5 bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-bold transition-colors uppercase tracking-wider text-sm cursor-pointer"
                >
                  Naruči i Nastavi na Plaćanje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}