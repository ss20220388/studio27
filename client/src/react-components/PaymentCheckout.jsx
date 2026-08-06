import React, { useState, useEffect } from "react";

export default function UplatnicaCheckout({ onSuccess = null , onBack= null,API_URL, token }) {
  const [tab, setTab] = useState("srb"); // 'srb' ili 'eng'
  const [uploaded, setUploaded] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailSentMessage, setMailSentMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Stanja za podatke iz korpe i korisnika
  const [cartList, setCartList] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [nazivSrb, setNazivSrb] = useState("");
  const [nazivEng, setNazivEng] = useState("");
  const [ukupnoEur, setUkupnoEur] = useState(0);
  const [ukupnoRsd, setUkupnoRsd] = useState(0);

  // Funkcija za formatiranje RSD sa razmakom umesto zareza/tačke
  const formatRsd = (val) => {
    return Math.round(val)
      .toLocaleString("sr-RS")
      .replace(/[\.,]/g, " ");
  };

  // Čitanje localStorage-a na klijentu
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("userEmail") || "";
      const rawCart = localStorage.getItem("cart_items") || "[]";
      
      setUserEmail(storedEmail);

      try {
        const parsedCart = JSON.parse(rawCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCartList(parsedCart);

          // Izračunavanje ukupne cene u EUR i RSD
          const sumaEur = parsedCart.reduce((acc, item) => acc + (Number(item.price || item.cena) || 0), 0);
          const sumaRsd = sumaEur * 117;

          setUkupnoEur(sumaEur);
          setUkupnoRsd(sumaRsd);

          // Spisak naziva za RSD
          const spisakSrb = parsedCart
            .map((item) => `${item.title || item.naslov || item.naziv} (${formatRsd((Number(item.price || item.cena) || 0) * 117)} RSD)`)
            .join(", ");
          setNazivSrb(spisakSrb);

          // Spisak naziva za EUR
          const spisakEng = parsedCart
            .map((item) => `${item.title || item.naslov || item.naziv} (${Number(item.price || item.cena) || 0} EUR)`)
            .join(", ");
          setNazivEng(spisakEng);
        }
      } catch (err) {
        console.error("Greška pri parsiranju korpe iz localStorage-a:", err);
      }
    }
  }, []);

  const handleSendMail = async () => {
    const targetEmail = userEmail || prompt("Unesite email adresu na koju želite da pošaljemo instrukcije:");
    if (!targetEmail) return;

    setIsSendingMail(true);
    setMailSentMessage("");
    setError("");

    const isSrb = tab === "srb";
    const subject = isSrb 
      ? `Instrukcije za uplatu - ${nazivSrb || "Kursevi Studio 27"}`
      : `Payment Instructions - ${nazivEng || "Studio 27 Courses"}`;

    const bodyText = isSrb
      ? `Poštovani,\n\nU nastavku se nalaze instrukcije za uplatu selektovanih kurseva:\n"${nazivSrb}"\n\nPrimalac: Studio 27\nSvrha uplate: Kupovina kurseva - ${nazivSrb}\nIznos: ${formatRsd(ukupnoRsd)} RSD\nRačun primaoca: 265-1100310090996-19\nŠifra uplate: 289\nModel: 97\nPoziv na broj: 2026/01\n\nNalog vam je već kreiran i dobili ste poruku sa šifrom na vašu mejl adresu. Pristup kursevima ćete dobiti nakon izvršene uplate. Kao potvrdu možete pokazati i izvršenu uplatnicu sa onlajn aplikacije.`
      : `Dear Customer,\n\nHere are your wire transfer payment instructions for:\n"${nazivEng}"\n\nBeneficiary Name: Studio 27 Visualization\nSWIFT / BIC: RZBSRSBG\nIBAN: RS35265100000115128090\nDescription: SEPA PLACANJE - ${nazivEng}\nAmount: ${ukupnoEur} EUR\n\nYour account is already created and you received an email with your password. You will get access once payment goes through.`;

    try {
      const response = await fetch(`${API_URL}/api/send-mail-to-person`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: targetEmail,
          subject: subject,
          subText: "Instrukcije za plaćanje uplatnicom / bankarskim transferom",
          body: bodyText,
        }),
      });

      if (!response.ok) {
        throw new Error("Greška pri slanju emaila. Proverite uneti email.");
      }

      setMailSentMessage(`Instrukcije su uspešno poslate na ${targetEmail}!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploaded) return;

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("path", "/uplatnice");
      formData.append("file", uploaded);

      const meRes = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const meData = await meRes.json();
      

      const response = await fetch(`${API_URL}/api/upload-hetzner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Došlo je do greške prilikom slanja uplatnice.");
      }

      const idsKurseva = cartList.map((item) => item.id || item.kursId);

      const dodajPlacanjeRes = await fetch(`${API_URL}/api/dodaj-placanje`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: meData.userId,
          kursId: idsKurseva.length === 1 ? idsKurseva[0] : idsKurseva,
          datumPlacanja: new Date().toISOString().split("T")[0],
          cenaPlacanja: tab === "srb" ? Math.round(ukupnoRsd) : ukupnoEur,
          status: "C",
          tip: "UPLATNICA",
          url: `/${uploaded.name}`,
        }),
      });

      if (!dodajPlacanjeRes.ok) {
        throw new Error("Došlo je do greške. Verovatno ste već platili neki od ovih kurseva.");
      }

      setSuccessMessage(
        "Vaša uplata je uspešno evidentirana! Nalog vam je već kreiran i dobili ste poruku sa šifrom na vašu mejl adresu. Pristup kursevima ćete dobiti nakon što ga admini odobre. Kao potvrdu možete pokazati i izvršenu uplatnicu sa onlajn aplikacije."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-xl text-center border border-slate-100">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Uplata je u obradi!</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
          {successMessage}
        </p>
        <button
          onClick={onSuccess}
          className="px-8 py-3 bg-[#550000] hover:bg-[#770000] text-white rounded-xl font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
        >
          Završi
        </button>
      </div>
    );
  }

  const trenutniNaziv = tab === "srb" ? nazivSrb : nazivEng;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      {/* ZAGLAVLJE */}
      <div className="bg-slate-950 text-white p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <a
            href = "/"
            className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            ← Nazad
          </a>
          <span className="text-[11px] font-bold uppercase tracking-wider bg-zinc-900 text-zinc-300 px-3 py-1 rounded-full border border-zinc-800">
            Plaćanje Uplatnicom
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
          {trenutniNaziv || "Kursevi Studio 27"}
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Ukupan iznos za uplatu:{" "}
          <span className="text-white font-bold">
            {tab === "srb" ? `${formatRsd(ukupnoRsd)} RSD` : `${ukupnoEur.toLocaleString()} EUR`}
          </span>
        </p>

        {/* OBAVEŠTENJE O NALOGU */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl mb-6 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            Nalog vam je već kreiran i dobili ste poruku sa šifrom na vašu mejl adresu. Pristup kursevima ćete dobiti nakon izvršene uplate. Kao potvrdu možete pokazati i izvršenu uplatnicu sa onlajn aplikacije.
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="grid grid-cols-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab("srb");
              setMailSentMessage("");
            }}
            className={`py-3 rounded-xl transition-all cursor-pointer ${
              tab === "srb"
                ? "bg-[#550000] text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🇷🇸 Srbija (Domaća uplatnica)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("eng");
              setMailSentMessage("");
            }}
            className={`py-3 rounded-xl transition-all cursor-pointer ${
              tab === "eng"
                ? "bg-[#550000] text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🌍 International (EUR / SWIFT)
          </button>
        </div>
      </div>

      <div className="p-6 md:p-10 space-y-8">
        {/* DOMAĆA UPLATNICA */}
        {tab === "srb" && (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-sm relative overflow-hidden font-sans text-xs md:text-sm">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
              <span className="text-xs md:text-sm font-black uppercase tracking-wider text-[#550000]">
                Nalog za uplatu
              </span>
              <span className="text-xs text-slate-400 font-mono">NALOG-2026</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    Uplatilac:
                  </span>
                  <p className="font-bold text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                    Vaše Ime i Prezime / Firma
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    Svrha uplate:
                  </span>
                  <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                    Uplata za kurseve: {nazivSrb}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    Primalac:
                  </span>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="font-extrabold text-slate-900">
                      Doroteja Dokić PR Studio 27
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Beograd, Srbija</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                      Šifra:
                    </span>
                    <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                      289
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                      Iznos:
                    </span>
                    <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                      {formatRsd(ukupnoRsd)} RSD
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    Račun primaoca:
                  </span>
                  <div className="bg-white p-3 rounded-xl border-2 border-slate-300">
                    <span className="font-black text-slate-900 font-mono text-sm md:text-base tracking-tight">
                      265-1100310090996-19
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                      Model:
                    </span>
                    <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                      97
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                      Poziv na broj:
                    </span>
                    <p className="font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200 font-mono">
                      2026/01
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INOSTRANE DEVIZNE INSTRUKCIJE */}
        {tab === "eng" && (
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-inner font-sans text-xs md:text-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-amber-400">
                International Wire Transfer (SEPA / SWIFT)
              </span>
              <span className="text-xs text-slate-400">
                Amount: {ukupnoEur.toLocaleString()} EUR
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                  Beneficiary Name:
                </span>
                <p className="font-bold text-white text-base bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  Studio 27 Visualization (Doroteja Dokić)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    SWIFT / BIC:
                  </span>
                  <span className="font-black text-white font-mono text-base block">
                    RZBSRSBG
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    IBAN:
                  </span>
                  <span className="font-black text-white font-mono text-xs md:text-sm block">
                    RS35265100000115128090
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                  Payment Description:
                </span>
                <p className="font-bold text-slate-200 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  SEPA PLACANJE - {nazivEng}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DUGME ZA SLANJE NA EMAIL */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-600 font-medium">
            Želite li instrukcije na email adresi?
          </div>
          <button
            type="button"
            onClick={handleSendMail}
            disabled={isSendingMail}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow cursor-pointer"
          >
            {isSendingMail ? (
              <span>Slanje e-maila...</span>
            ) : (
              <>
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Pošalji instrukcije na e-mail
              </>
            )}
          </button>
        </div>

        {mailSentMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
            {mailSentMessage}
          </div>
        )}

        {/* FORMA ZA UPLOAD DOKAZA */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Priložite dokaz o uplati (Slika ili PDF)
            </span>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-[#550000] rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50">
              <input
                type="file"
                accept="image/*,.pdf"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={(e) => setUploaded(e.target.files[0])}
                required
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 bg-zinc-100 text-zinc-700 rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                {uploaded ? (
                  <p className="text-sm font-bold text-[#550000]">
                    Izabran fajl: {uploaded.name}
                  </p>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Kliknite ovde ili prevucite sliku uplatnice
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Podržani formati: PNG, JPG, JPEG ili PDF
                    </p>
                  </div>
                )}
              </div>
            </div>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-6 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              Nazad
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !uploaded}
              className="px-8 py-3.5 bg-[#550000] hover:bg-[#770000] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Evidentiranje...
                </>
              ) : (
                "Potvrdi i pošalji uplatnicu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}