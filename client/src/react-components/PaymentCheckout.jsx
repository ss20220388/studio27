import React, { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

export default function PaymentCheckout() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Praćenje stanja mreže
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Mock podaci ako je korpa prazna (da odmah vidiš izgled stranice)
    const cartDataRaw = localStorage.getItem("cart_order_data") || localStorage.getItem("cart_items");
    const userDataRaw = localStorage.getItem("user_order_data");

    if (cartDataRaw) {
      setCart(JSON.parse(cartDataRaw));
    } else {
      // Demo podatak za vizuelni pregled
      setCart([{ id: 1, title: "LIGHTSTART3D", price: 14899, quantity: 1, image: "" }]);
    }

    if (userDataRaw) {
      setUser(JSON.parse(userDataRaw));
    } else {
      setUser({ name: "KF Interior", email: "korisnik@example.com", isGuest: false });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const totalPrice = cart.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[520px]">
      
      {/* LEVA STRANA: Pregled Porudžbine */}
      <div className="w-full md:w-1/2 p-8 md:p-10 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
        <div>
          <a
            href="/"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 transition-colors mb-6"
          >
            ←
          </a>

          <div className="text-center mb-8">
            {/* ✅ NOVI SIVO-NARANDŽASTI STIL IKONICE KORPE */}
            <div className="relative w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-zinc-200 border border-zinc-800">
              <svg className="w-7 h-7 text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {/* Narandžasti akcenat indikator */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 border-2 border-white"></span>
              </span>
            </div>

            <h2 className="font-bold text-slate-800 text-lg">27archviz</h2>
            <div className="text-4xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {totalPrice.toLocaleString()} €
            </div>
          </div>

          <hr className="border-slate-100 mb-6" />

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Stavke u korpi
            </h3>
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={`${API_URL}/api/uploaded-images${item.image}`}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium flex-shrink-0">
                        Slika
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-800 leading-snug">{item.title}</div>
                      <div className="text-xs text-slate-400">{item.quantity || 1} kom</div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-900">
                    {((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString()}€
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {user && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Kupac: <strong className="text-slate-700">{user.name || "Gost"}</strong> ({user.email})
            </div>
          </div>
        )}
      </div>

      {/* DESNA STRANA: Prikaz Dugmića */}
      <div className="w-full md:w-1/2 p-8 md:p-10 bg-slate-50/50 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Izaberite način plaćanja</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Plaćanje je brzo i bezbedno. Možete platiti direktno preko svog PayPal naloga ili karticom.
          </p>

          {/* KONTEJNER ZA PAYPAL DUGMAD */}
          <div className="w-full relative min-h-[160px]">
            {!isOffline ? (
              /* Pravi PayPal kad ima interneta */
              <PayPalScriptProvider
                options={{
                  "client-id": "test", // Kad stigneš kući ovde stavi svoj pravi Client ID
                  currency: "EUR",
                }}
              >
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "black",
                    shape: "rect",
                    label: "pay",
                    height: 48,
                  }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          amount: { currency_code: "EUR", value: totalPrice.toString() },
                        },
                      ],
                    });
                  }}
                />
              </PayPalScriptProvider>
            ) : (
              /* VISUAL PREVIEW / MOCK REŽIM (Prikazuje se kad nema interneta na poslu) */
              <div className="space-y-3">
                <div className="w-full h-12 bg-[#ffc439] hover:bg-[#f2ba32] text-[#003087] font-extrabold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                  <span className="text-lg italic font-serif tracking-tighter font-black">
                    <span className="text-[#003087]">Pay</span>
                    <span className="text-[#0079C1]">Pal</span>
                  </span>
                  <span className="text-sm font-sans font-bold text-slate-900">Plati odmah</span>
                </div>

                <div className="w-full h-12 bg-[#2C2E2F] hover:bg-[#1f2021] text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                  </svg>
                  Debitna ili Kreditna Kartica
                </div>

                <div className="text-[11px] text-center text-slate-400 mt-2">
                  (Simulacija prikaza bez internet konekcije)
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          256-bit enkripcija & sigurna obrada transakcije
        </div>
      </div>

    </div>
  );
}