import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

export default function CartModal({ accessToken }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [user, setUser] = useState(null);

  // ✅ Fetch user podataka preko prosleđenog accessToken
  const fetchUser = async (token) => {
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
  };

  // ✅ ODMAH reaguje na promenu tokena — bez obzira da li je login ili logout
  useEffect(() => {
    fetchUser(accessToken);
  }, [accessToken]);

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
      fetchUser(accessToken);
      setIsOpen(true);
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("open-cart", handleOpen);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("open-cart", handleOpen);
    };
  }, [accessToken]);

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
      ? { name: user.name, email: user.email, phone: user.phone }
      : formData;

    console.log("Submit order:", finalData, cart);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => {
            loadCart();
            fetchUser(accessToken);
            setIsOpen(true);
          }}
          className="fixed top-40 right-8 z-[9999] w-14 h-14 bg-[#e5e7eb] hover:bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <button
            onClick={() => setIsOpen(false)}
            className="fixed top-6 right-8 text-white hover:text-zinc-300 text-3xl font-light z-[10001] cursor-pointer"
          >
            ✕
          </button>

          <div className="relative w-full max-w-[480px] bg-white text-black p-8 shadow-2xl my-auto max-h-[92vh] overflow-y-auto font-sans">
            <h2 className="text-2xl font-bold mb-6 text-black tracking-tight">Vaša porudžbina:</h2>

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

            {/* Nije ulogovan */}
            {!user ? (
              <div className="bg-[#eaeaea] p-4 text-sm text-black mb-6">
                Već imate nalog kod nas?{" "}
                <button
                  onClick={openLoginModal}
                  className="underline font-medium hover:text-zinc-700 cursor-pointer"
                >
                  Prijavite se ili registrujte
                </button>
              </div>
            ) : (
              /* Ulogovan */
              <div className="bg-zinc-100 p-4 border border-zinc-200 rounded text-sm text-zinc-800 mb-6">
                Prijavljeni ste kao:{" "}
                <span className="font-bold">{user.email || user.name}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {user ? (
                <div className="bg-zinc-100 p-4 border border-zinc-200 rounded text-sm text-zinc-800">
                  Podaci će biti preuzeti iz vašeg naloga.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-zinc-800 mb-1.5">Ime i prezime</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-black focus:outline-none text-sm text-black bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-800 mb-1.5">Email adresa</label>
                    <input
                      type="email"
                      required
                      placeholder="Email adresa"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-black focus:outline-none text-sm text-black placeholder-zinc-400 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-800 mb-1.5">Broj telefona</label>
                    <input
                      type="tel"
                      required
                      placeholder="Broj telefona"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-black focus:outline-none text-sm text-black placeholder-zinc-400 bg-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-6">
                <div className="flex justify-end items-center font-bold text-base text-black mb-4">
                  <span>Ukupno: {totalPrice.toLocaleString()} €</span>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3.5 bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-bold transition-colors uppercase tracking-wider text-sm cursor-pointer"
                >
                  Naruči
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}