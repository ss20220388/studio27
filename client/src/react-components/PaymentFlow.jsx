// No changes needed here. This component just POSTs { orderId, courseIds, totalAmount }
// to /api/payment/create and injects+submits whatever HTML form the backend returns.
// The bug was entirely on the server side (PaymentService.java): the amount format sent
// to the bank and the signature field order. Once those are fixed, this file works as-is.
//
// One thing worth double-checking once payments are live: totals.rsd is a JS float
// (eur * EUR_RSD_RATE). Floating point can occasionally produce values like
// 45198.999999999996 instead of 45199. That's sent to the backend as JSON, where it
// becomes a BigDecimal, so it's not corrupted — but if you ever see a signature mismatch
// that "looks right", check whether the amount value has extra decimal noise before it
// hits toMinorUnits() on the server.

import React, { useState, useEffect } from "react";

export default function UplatnicaCheckout({
  onBack = null,
  API_URL,
  token,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cartList, setCartList] = useState([]);
  const [totals, setTotals] = useState({ eur: 0, rsd: 0 });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const EUR_RSD_RATE = 117.4;

  const handleGoHome = () => (onBack ? onBack() : (window.location.href = "/"));

  const formatRsd = (val) =>
    new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(val || 0);
  const formatEur = (val) =>
    new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const parsedCart = JSON.parse(localStorage.getItem("cart_items") || "[]");
      if (Array.isArray(parsedCart) && parsedCart.length > 0) {
        setCartList(parsedCart);
        const eur = parsedCart.reduce((acc, item) => acc + (Number(item.price || item.cena) || 0), 0);
        setTotals({ eur, rsd: eur * EUR_RSD_RATE });
      }
    } catch (err) {
      console.error("Greška pri čitanju korpe:", err);
      setError("Došlo je do greške prilikom učitavanja korpe.");
    }
  }, []);

  const handleCardPayment = async () => {
    if (!termsAccepted) {
      return setError("Morate prihvatiti uslove kupovine i potvrditi saglasnost pre nastavka.");
    }

    if (cartList.length === 0) {
      return setError("Korpa je prazna.");
    }

    setIsSubmitting(true);
    setError("");

    try {
      const orderId = `${Date.now()}`;
      const courseIds = cartList
        .map((item) => item.id || item.kursId)
        .filter(Boolean);

      if (courseIds.length !== cartList.length) {
        throw new Error("Neki od kurseva u korpi nemaju ispravan ID. Osvežite stranicu i pokušajte ponovo.");
      }

      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/payment/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          orderId,
          courseIds,
          totalAmount: totals.rsd,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.paymentForm) {
        throw new Error(data.message || "Greška pri kreiranju forme za plaćanje.");
      }

      const wrapper = document.createElement("div");
      wrapper.id = "payment-form-wrapper";
      wrapper.innerHTML = data.paymentForm;
      document.body.appendChild(wrapper);

      const form = wrapper.querySelector("form");
      if (!form) {
        throw new Error("Forma za plaćanje nije pronađena u odgovoru servera.");
      }

      form.submit();

    } catch (err) {
      console.error("Greška pri kartičnom plaćanju:", err);
      const existingWrapper = document.getElementById("payment-form-wrapper");
      if (existingWrapper) {
        existingWrapper.remove();
      }
      setError(err.message || "Došlo je do greške prilikom kartičnog plaćanja.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl mx-auto">
        {/* TAMNA KARTICA */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">

          {/* HEADER */}
          <div className="bg-slate-950 p-6 md:p-10 border-b border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <button
                type="button"
                onClick={handleGoHome}
                disabled={isSubmitting}
                className="text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="text-lg">←</span> Nazad
              </button>
              <span 
                className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-red-200 px-4 py-2 rounded-full border"
                style={{ backgroundColor: "rgba(85, 0, 0, 0.4)", borderColor: "#550000" }}
              >
                Bezbedno plaćanje
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest font-bold mb-2 text-red-400">Studio 27</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-white">Plaćanje karticom</h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
              Završite kupovinu sigurnim plaćanjem putem platne kartice i ostvarite trenutni, trajni pristup kursevima.
            </p>
          </div>

          {/* CONTENT */}
          <div className="p-6 md:p-10">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Vaša porudžbina</h2>
                <span className="text-xs font-semibold text-slate-400">
                  {cartList.length} {cartList.length === 1 ? "kurs" : "kurseva"}
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                {cartList.length > 0 ? (
                  <div>
                    {cartList.map((item, idx) => (
                      <div
                        key={item.id || item.kursId || idx}
                        className={`flex items-center justify-between gap-4 p-4 md:p-5 ${
                          idx !== cartList.length - 1 ? "border-b border-slate-800" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: "rgba(85, 0, 0, 0.3)", borderColor: "#550000" }}
                          >
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{item.title || item.naslov || item.naziv || "Kurs"}</p>
                            <p className="text-xs text-emerald-400 font-semibold mt-0.5">Jednokratna kupovina • Trajni pristup</p>
                          </div>
                        </div>
                        <div className="text-sm font-black text-white whitespace-nowrap">
                          {formatEur(item.price || item.cena)} EUR
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-slate-400">Korpa je prazna.</div>
                )}

                {/* TOTAL & KURS */}
                <div className="bg-slate-950/90 border-t border-slate-800 p-5 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Iznos u EUR</p>
                      <p className="text-2xl font-black text-white mt-1">{formatEur(totals.eur)} EUR</p>
                      <p className="text-xs text-slate-400 mt-1">Informativni prikaz</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Ukupno za naplatu</p>
                      <p className="text-2xl font-black text-red-400 mt-1">{formatRsd(totals.rsd)} RSD</p>
                      <p className="text-xs text-slate-400 mt-1">Zvanična valuta transakcije</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <span className="font-medium">Primenjeni obračunski kurs:</span>
                    <span className="font-bold text-slate-200 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md">
                      1 EUR = {EUR_RSD_RATE} RSD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="mb-8">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">Način plaćanja</h2>
              <div className="mb-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-center">
                <img src="/images/logo_kartice.svg" alt="Payment Method" className="w-full h-auto rounded-lg max-h-12 object-contain" />
              </div>

              <div 
                className="border rounded-2xl p-5 md:p-6"
                style={{ backgroundColor: "rgba(85, 0, 0, 0.15)", borderColor: "rgba(85, 0, 0, 0.5)" }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                      style={{ backgroundColor: "#550000" }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
                        <path d="M3 10h18" strokeWidth="2" />
                        <path d="M7 15h3" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base md:text-lg font-black text-white">Platna kartica</h3>
                        <span className="text-[9px] uppercase tracking-wider font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Sigurno</span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-300 mt-1">Visa / Mastercard / DinaCard</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-black text-slate-200">VISA</div>
                    <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-black text-slate-200">Mastercard</div>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-800/80">
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    Nakon klika na dugme bićete preusmereni na zaštićeni gateway banke gde bezbedno unosite podatke sa kartice.
                  </p>
                </div>
              </div>
            </div>

            {/* CHECKBOX SAGLASNOSTI */}
            <div className="mb-6 space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 focus:ring-red-500 cursor-pointer accent-[#550000]"
                />
                <span className="text-xs text-slate-300 leading-normal">
                  Potvrđujem da sam saglasan/na sa uslovima kupovine i da pristup digitalnom sadržaju dobijam odmah nakon uspešne uplate.
                </span>
              </label>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 p-4 bg-red-950/50 border border-red-800/70 text-red-300 rounded-2xl text-sm font-medium flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.2 3 1.73 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* PAY BUTTON */}
            <button
              type="button"
              onClick={handleCardPayment}
              disabled={isSubmitting || totals.rsd <= 0 || cartList.length === 0 || !termsAccepted}
              className="w-full px-6 py-4 md:py-5 text-white rounded-2xl text-sm md:text-base font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg cursor-pointer hover:brightness-110"
              style={{ backgroundColor: "#550000", boxShadow: "0 10px 25px -5px rgba(85, 0, 0, 0.4)" }}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Preusmeravanje na plaćanje...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
                    <path d="M3 10h18" strokeWidth="2" />
                  </svg>
                  Plati {formatRsd(totals.rsd)} RSD
                </>
              )}
            </button>

            {/* INFO */}
            <div className="mt-5 text-center space-y-2">
              <p className="text-[11px] text-slate-400">
                Kupovina je jednokratna. Odabrani kurs ostaje u vašem vlasništvu **trajno**.
              </p>
              <p className="text-[10px] text-slate-500 leading-normal max-w-lg mx-auto">
                *Sva plaćanja biće izvršena u dinarima (RSD) po navedenom kursu (1 EUR = {EUR_RSD_RATE} RSD). Ukoliko se plaća platnim karticama inostranih banaka izdavalaca, dinarski iznos transakcije biće konvertovan u novčanu jedinicu kartice po kursu poslovne banke ili kartičnih organizacija.
              </p>
            </div>

            {/* BACK */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center">
              <button
                type="button"
                onClick={handleGoHome}
                disabled={isSubmitting}
                className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                ← Vrati se na početnu
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          Podaci o kartici se unose na sigurnoj stranici platnog sistema banke.
        </p>
      </div>
    </div>
  );
}