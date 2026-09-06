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
  const [orderId, setOrderId] = useState("");
  const [copiedField, setCopiedField] = useState("");

  const EUR_RSD_RATE = 117.4;

  const COMPANY_INFO = {
    name: "Doroteja Đokić PR 27archviz",
    pib: "114735847",
    mb: "67814657",
    address: "Aleksinačkih rudara 39E, 11070 Beograd-Novi Beograd",
    phone: "+381 66 5934 314",
    email: "studio27.vizz@gmail.com",
    account: "205-0000000529845-48",
    code: "289",
  };

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
        setTotals({ eur, rsd: Math.round(eur * EUR_RSD_RATE) });
      }
      
      const generatedOrder = `27-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedOrder);
    } catch (err) {
      console.error("Greška pri čitanju korpe:", err);
      setError("Došlo je do greške prilikom učitavanja korpe.");
    }
  }, []);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleConfirmOrder = async () => {
    if (cartList.length === 0) {
      return setError("Korpa je prazna.");
    }

    setIsSubmitting(true);
    setError("");

    try {
      const courseIds = cartList.map((item) => item.id || item.kursId).filter(Boolean);

      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      if (API_URL) {
        await fetch(`${API_URL}/api/orders/manual`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            orderId,
            courseIds,
            totalAmountRsd: totals.rsd,
            paymentType: "UPLATNICA",
          }),
        }).catch(() => {});
      }

      alert(`Uspešno ste kreirali instrukcije za uplatu! Poziv na broj: ${orderId}. Nakon uplate, pristup se aktivira u najkraćem roku.`);
      
    } catch (err) {
      console.error("Greška pri kreiranju porudžbine:", err);
      setError("Došlo je do greške. Pokušajte ponovo ili nas kontaktirajte direktno.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* POZADINA CELOG EKRANA JE SADA BELA (bg-white) */
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        
        {/* TAMNA KARTICA SAČUVANA U ORIGINALNOM STILU */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">

          {/* HEADER */}
          <div className="bg-slate-950 p-6 md:p-8 border-b border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={handleGoHome}
                disabled={isSubmitting}
                className="text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="text-lg">←</span> Nazad na sajt
              </button>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10">
                Plaćanje Uplatnicom / e-Bankingom
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest font-bold mb-1 text-red-500">27archviz</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-white">Instrukcije za uplatu</h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
              Možete uplatiti putem mobilne aplikacije (e-Banking / m-Banking) ili na šalteru pošte / banke.
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-8">

            {/* PREGLED KORPE */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Vaša porudžbina</h2>
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                {cartList.map((item, idx) => (
                  <div
                    key={item.id || item.kursId || idx}
                    className={`flex items-center justify-between gap-4 p-4 ${
                      idx !== cartList.length - 1 ? "border-b border-slate-800" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-white truncate">{item.title || item.naslov || item.naziv || "Kurs"}</span>
                    </div>
                    <span className="text-sm font-black text-slate-200 whitespace-nowrap">{formatEur(item.price || item.cena)} EUR</span>
                  </div>
                ))}

                <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Ukupno za uplatu</p>
                    <p className="text-xl font-black text-red-400 mt-0.5">{formatRsd(totals.rsd)} RSD</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>1 EUR = {EUR_RSD_RATE} RSD</div>
                    <div className="text-slate-500 text-[10px]">({formatEur(totals.eur)} EUR)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PODACI ZA UPLATNICU */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Podaci za popunjavanje uplatnice</h2>
                <span className="text-[11px] text-emerald-400 font-semibold">Kliknite na polje za brzo kopiranje</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                
                {/* PRIMALAC */}
                <div 
                  onClick={() => copyToClipboard(COMPANY_INFO.name, "Primalac")}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition relative group"
                >
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Primalac</p>
                  <p className="text-sm font-bold text-white mt-0.5">{COMPANY_INFO.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{COMPANY_INFO.address}</p>
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-red-400 opacity-0 group-hover:opacity-100 transition">
                    {copiedField === "Primalac" ? "Kopirano!" : "Kopiraj"}
                  </span>
                </div>

                {/* SVRHA UPLATE */}
                <div 
                  onClick={() => copyToClipboard(`Uplata za kurs - Porudžbina ${orderId}`, "Svrha")}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition relative group"
                >
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Svrha uplate</p>
                  <p className="text-sm font-bold text-white mt-0.5">Uplata za edukativni kurs ({orderId})</p>
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-red-400 opacity-0 group-hover:opacity-100 transition">
                    {copiedField === "Svrha" ? "Kopirano!" : "Kopiraj"}
                  </span>
                </div>

                {/* RAČUN PRIMAOCA */}
                <div 
                  onClick={() => copyToClipboard(COMPANY_INFO.account, "Racun")}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition relative group"
                >
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Račun primaoca</p>
                  <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">{COMPANY_INFO.account}</p>
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-red-400 opacity-0 group-hover:opacity-100 transition">
                    {copiedField === "Racun" ? "Kopirano!" : "Kopiraj"}
                  </span>
                </div>

                {/* POZIV NA BROJ & ŠIFRA */}
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    onClick={() => copyToClipboard(COMPANY_INFO.code, "Sifra")}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition relative group"
                  >
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Šifra</p>
                    <p className="text-sm font-mono font-bold text-white mt-0.5">{COMPANY_INFO.code}</p>
                  </div>
                  <div 
                    onClick={() => copyToClipboard(orderId, "Poziv")}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition relative group"
                  >
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Poziv na broj</p>
                    <p className="text-sm font-mono font-bold text-amber-400 mt-0.5">{orderId}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* DIRECT KONTAKT */}
            <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-red-400">Direktan kontakt i podrška</p>
                <h3 className="text-base font-bold text-white mt-0.5">Doroteja Đokić</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nakon izvršene uplate, pošaljite nam dokaz/sliku uplatnice na WhatsApp ili E-mail za ekspresnu aktivaciju kursa.
                </p>
              </div>

              <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto shrink-0">
                <a
                  href={`tel:${COMPANY_INFO.phone.replace(/\s+/g, '')}`}
                  className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white text-center transition"
                >
                  📞 {COMPANY_INFO.phone}
                </a>
                <a
                  href={`mailto:${COMPANY_INFO.email}?subject=Potvrda uplate - ${orderId}`}
                  className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white text-center transition"
                >
                  ✉️ {COMPANY_INFO.email}
                </a>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-950/50 border border-red-800/70 text-red-300 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            {/* DUGME POTVRDE */}
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting || totals.rsd <= 0 || cartList.length === 0}
              className="w-full py-4 text-white rounded-2xl text-sm font-black transition-all cursor-pointer hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: "#550000", boxShadow: "0 10px 25px -5px rgba(85, 0, 0, 0.4)" }}
            >
              {isSubmitting ? "Zapisujem porudžbinu..." : "Potvrdi i preuzmi podatke za uplatu"}
            </button>

            {/* LEGAL FOOTER */}
            <div className="pt-4 border-t border-slate-800/60 text-center text-[10px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-400">©2026 27archviz • SRBIJA PIB: {COMPANY_INFO.pib} • MB: {COMPANY_INFO.mb}</p>
              <p>{COMPANY_INFO.address}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}