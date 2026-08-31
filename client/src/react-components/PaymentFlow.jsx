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
    new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(val);
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

    if (totals.rsd <= 0) {
      return setError("Iznos za plaćanje nije ispravan.");
    }
    
    setIsSubmitting(true);
    setError("");

    let container = null;

    try {
      const orderId = `ORD-${Date.now()}`;

      const response = await fetch(`${API_URL}/api/payment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          orderId,
          totalAmountRsd: String(totals.rsd.toFixed(2)),
          purchaseDesc: `Porudzbina ${orderId}`
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.paymentForm) {
        throw new Error(data.message || "Greška pri kreiranju forme za plaćanje.");
      }

      container = document.createElement("div");
      container.style.display = "none";
      container.innerHTML = data.paymentForm;
      document.body.appendChild(container);

      const form = container.querySelector("form");
      if (!form) {
        throw new Error("Forma za plaćanje nije pronađena u odgovoru.");
      }

      form.submit();

    } catch (err) {
      console.error("Greška pri kartičnom plaćanju:", err);
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
      setError(err.message || "Došlo je do greške prilikom kartičnog plaćanja.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* HEADER */}
          <div className="bg-slate-950 text-white p-6 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <button
                type="button"
                onClick={handleGoHome}
                disabled={isSubmitting}
                className="text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="text-lg">←</span> Nazad
              </button>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-slate-900 text-slate-300 px-4 py-2 rounded-full border border-slate-800">
                Bezbedno plaćanje
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3">Studio 27</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Plaćanje</h1>
            <p className="text-sm md:text-base text-slate-400 max-w-xl leading-relaxed">
              Završite kupovinu sigurnim plaćanjem putem platne kartice i ostvarite trenutni, trajni pristup kursevima.
            </p>
          </div>

          {/* CONTENT */}
          <div className="p-6 md:p-10">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Vaša porudžbina</h2>
                <span className="text-xs font-semibold text-slate-400">
                  {cartList.length} {cartList.length === 1 ? "kurs" : "kurseva"}
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                {cartList.length > 0 ? (
                  <div>
                    {cartList.map((item, idx) => (
                      <div
                        key={item.id || item.kursId || idx}
                        className={`flex items-center justify-between gap-4 p-4 md:p-5 ${
                          idx !== cartList.length - 1 ? "border-b border-slate-200" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{item.title || item.naslov || item.naziv || "Kurs"}</p>
                            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Jednokratna kupovina • Trajni pristup</p>
                          </div>
                        </div>
                        <div className="text-sm font-black text-slate-900 whitespace-nowrap">
                          {formatEur(item.price || item.cena)} EUR
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500">Korpa je prazna.</div>
                )}

                {/* TOTAL & KURS */}
                <div className="bg-slate-50 border-t border-slate-200 p-5 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Iznos u EUR</p>
                      <p className="text-2xl font-black text-slate-950 mt-1">{formatEur(totals.eur)} EUR</p>
                      <p className="text-xs text-slate-400 mt-1">Informativni prikaz</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Ukupno za naplatu</p>
                      <p className="text-2xl font-black text-slate-950 mt-1">{formatRsd(totals.rsd)} RSD</p>
                      <p className="text-xs text-slate-400 mt-1">Zvanična valuta transakcije</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Primenjeni obračunski kurs:</span>
                    <span className="font-bold text-slate-800 bg-slate-200/60 px-2.5 py-1 rounded-md">
                      1 EUR = {EUR_RSD_RATE} RSD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="mb-8">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Način plaćanja</h2>
              <div className="mb-4 bg-slate-800 p-4 rounded-lg flex items-center justify-center">
                <img src="/images/logo_kartice.svg" alt="Payment Method" className="w-full h-auto rounded-lg" />
              </div>

              <div className="border-2 border-[#550000] rounded-2xl p-5 md:p-6 bg-[#550000]/[0.02]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#550000] text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
                        <path d="M3 10h18" strokeWidth="2" />
                        <path d="M7 15h3" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base md:text-lg font-black text-slate-900">Platna kartica</h3>
                        <span className="text-[9px] uppercase tracking-wider font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Sigurno</span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-500 mt-1">Visa / Mastercard / DinaCard</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-700">VISA</div>
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-700">Mastercard</div>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-200">
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                    Nakon klika na dugme bićete preusmereni na zaštićeni gateway banke gde bezbedno unosite podatke sa kartice.
                  </p>
                </div>
              </div>
            </div>

            {/* CHECKBOX SAGLASNOSTI */}
            <div className="mb-6 space-y-3 bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#550000] focus:ring-[#550000] cursor-pointer"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  Potvrđujem da sam saglasan/na sa uslovima kupovine i da pristup digitalnom sadržaju dobijam odmah nakon uspešne uplate.
                </span>
              </label>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full px-6 py-4 md:py-5 bg-[#550000] hover:bg-[#770000] text-white rounded-2xl text-sm md:text-base font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
              <p className="text-[10px] text-slate-400 leading-normal max-w-lg mx-auto">
                *Sva plaćanja biće izvršena u dinarima (RSD) po navedenom kursu (1 EUR = {EUR_RSD_RATE} RSD). Ukoliko se plaća platnim karticama inostranih banaka izdavalaca, dinarski iznos transakcije biće konvertovan u novčanu jedinicu kartice po kursu poslovne banke ili kartičnih organizacija.
              </p>
            </div>

            {/* BACK */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
              <button
                type="button"
                onClick={handleGoHome}
                disabled={isSubmitting}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
              >
                ← Vrati se na početnu
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          Podaci o kartici se unose na sigurnoj stranici platnog sistema banke.
        </p>
      </div>
    </div>
  );
}