import { useState, useEffect } from "react";

export default function UplatnicaForm({ onSuccess, onBack, API_URL, token,kursevi }) {
  const [tab, setTab] = useState("srb"); // 'srb' ili 'eng'
  const [uploaded, setUploaded] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailSentMessage, setMailSentMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const [userEmail, setUserEmail] = useState("");

  // Računanje iznosa: cena u EUR se množi sa 117 za RSD
  const cenaEur = Number(cena) || 0;
  const cenaRsdNum = cenaEur * 117;

  // Formatiranje RSD sa razmakom umesto zareza/tačke (npr. 40 950)
  const cenaRsdFormatted = Math.round(cenaRsdNum)
    .toLocaleString("sr-RS")
    .replace(/[\.,]/g, " ");

  // Čitanje emaila sa klijenta
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("userEmail") || "";
      setUserEmail(storedEmail);
    }
  }, []);

  const handleBackToHome = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleSendMail = async () => {
    const targetEmail = userEmail || prompt("Unesite email adresu na koju želite da pošaljemo instrukcije:");
    if (!targetEmail) return;

    setIsSendingMail(true);
    setMailSentMessage("");
    setError("");

    const isSrb = tab === "srb";
    const subject = isSrb 
      ? `Instrukcije za uplatu - ${naziv || "Kurs Studio 27"}`
      : `Payment Instructions - ${naziv || "Studio 27 Course"}`;

    const bodyText = isSrb
      ? `Poštovani,\n\nU nastavku se nalaze instrukcije za uplatu kursa:\n"${naziv}"\n\nPrimalac: Studio 27\nSvrha uplate: Kupovina kursa - ${naziv}\nIznos: ${cenaRsdFormatted} RSD\nRačun primaoca: 265-1100310090996-19\nŠifra uplate: 289\nModel: 97\nPoziv na broj: 2026/01\n\nNalog vam je već kreiran i dobili ste poruku sa šifrom na vašu mejl adresu. Pristup kursevima ćete dobiti nakon izvršene uplate. Kao potvrdu možete pokazati i izvršenu uplatnicu sa onlajn aplikacije.`
      : `Dear Customer,\n\nHere are your wire transfer payment instructions for:\n"${naziv}"\n\nBeneficiary Name: Studio 27 Visualization \nSWIFT / BIC: RZBSRSBG\nIBAN: RS35265100000115128090\nDescription: SEPA PLACANJE - ${naziv}\nAmount: ${cenaEur} EUR\n\nYour account is already created and you received an email with your password. You will get access once admins approve your payment.`;

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

      const dodajPlacanjeRes = await fetch(`${API_URL}/api/dodaj-placanje`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: meData.userId,
          kursId: kursId,
          datumPlacanja: new Date().toISOString().split("T")[0],
          cenaPlacanja: cenaEur,
          status: "C",
          tip: "UPLATNICA",
          url: `/${uploaded.name}`,
        }),
      });

      if (!dodajPlacanjeRes.ok) {
        throw new Error(
          "Došlo je do greške, verovatno ste već platili ovaj kurs, ako mislite da nije tako kontaktirajte nas."
        );
      }

      setSuccessMessage("Uspešno ste kupili kurs!");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-black text-green-600">
          Uspešno ste kupili kurs!
        </h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Vaša uplatnica je priložena i poslata na proveru. Pristup kursu biće aktiviran uskoro.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Plaćanje uplatnicom</h2>
        <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200">
          Jedan kurs
        </span>
      </div>

      <p className="text-gray-500 mb-4">
        {naziv} -{" "}
        <span className="font-bold text-gray-800">
          {tab === "srb" ? `${cenaRsdFormatted} RSD` : `${cenaEur} EUR`}
        </span>
      </p>

      {/* OBAVEŠTENJE O NALOGU */}
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 text-xs text-amber-900 leading-relaxed">
        Nalog vam je već kreiran i dobili ste poruku sa šifrom na vašu mejl adresu. Pristup kursu ćete dobiti nakon izvršene uplate. Kao potvrdu možete pokazati i izvršenu uplatnicu sa onlajn aplikacije.
      </div>

      {/* TAB SWITCHER */}
      <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl mb-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setTab("srb");
            setMailSentMessage("");
          }}
          className={`py-2 rounded-lg transition-all ${
            tab === "srb" ? "bg-red-800 text-white shadow" : "text-gray-600 hover:text-gray-900"
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
          className={`py-2 rounded-lg transition-all ${
            tab === "eng" ? "bg-red-800 text-white shadow" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🌍 International (EUR / SWIFT)
        </button>
      </div>

      {/* DOMAĆA UPLATNICA */}
      {tab === "srb" && (
        <div className="border-2 border-gray-400 rounded-lg p-4 bg-gray-50 mb-4 text-xs md:text-sm">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">Uplatilac:</span>
              <p className="font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
                Vaše Ime i Prezime / Firma
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">Svrha uplate:</span>
              <p className="font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
                Kupovina kursa {naziv}
              </p>
            </div>
          </div>

          <div className="mb-3">
            <span className="text-xs text-gray-500 block mb-0.5">Primalac:</span>
            <p className="font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
              Doroteja Dokić PR Studio 27, Beograd
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">Šifra:</span>
              <p className="font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
                289
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-500 block mb-0.5">Iznos:</span>
              <p className="font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
                {cenaRsdFormatted} RSD
              </p>
            </div>
          </div>

          <div className="mb-3">
            <span className="text-xs text-gray-500 block mb-0.5">Račun primaoca:</span>
            <p className="font-mono font-bold text-gray-900 bg-white p-2 rounded border border-gray-300">
              265-1100310090996-19
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">Model:</span>
              <p className="font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
                97
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-500 block mb-0.5">Poziv na broj:</span>
              <p className="font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200 font-mono">
                2026/01
              </p>
            </div>
          </div>
        </div>
      )}

      {/* INOSTRANE DEVIZNE INSTRUKCIJE */}
      {tab === "eng" && (
        <div className="border-2 border-gray-800 bg-gray-900 text-white rounded-lg p-4 mb-4 text-xs md:text-sm space-y-3">
          <div className="border-b border-gray-800 pb-2 flex justify-between items-center">
            <span className="font-bold uppercase text-amber-400">International Wire Transfer (SEPA / SWIFT)</span>
            <span>Amount: {cenaEur} EUR</span>
          </div>

          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Beneficiary Name:</span>
            <p className="font-bold bg-gray-800 p-2 rounded border border-gray-700">
              Studio 27 Visualization (Doroteja Dokić)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-gray-400 text-xs block mb-0.5">SWIFT / BIC:</span>
              <p className="font-mono font-bold bg-gray-800 p-2 rounded border border-gray-700">
                RZBSRSBG
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs block mb-0.5">IBAN:</span>
              <p className="font-mono font-bold bg-gray-800 p-2 rounded border border-gray-700 text-xs">
                RS35265100000115128090
              </p>
            </div>
          </div>

          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Payment Description:</span>
            <p className="font-bold bg-gray-800 p-2 rounded border border-gray-700">
              SEPA PLACANJE - {naziv}
            </p>
          </div>
        </div>
      )}

      {/* DUGME ZA SLANJE NA EMAIL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4">
        <span className="text-xs text-gray-600">Pošaljite instrukcije na vašu e-mail adresu:</span>
        <button
          type="button"
          onClick={handleSendMail}
          disabled={isSendingMail}
          className="w-full sm:w-auto px-4 py-2 bg-gray-800 hover:bg-black text-white text-xs font-semibold rounded-lg transition"
        >
          {isSendingMail ? "Slanje..." : "Pošalji na e-mail"}
        </button>
      </div>

      {mailSentMessage && (
        <p className="text-xs text-green-700 font-bold mb-4 text-center bg-green-50 p-2 rounded-lg border border-green-200">
          {mailSentMessage}
        </p>
      )}

      {/* FORMA ZA UPLOAD DOKAZA */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*,.pdf"
          className="w-full border border-gray-300 rounded-xl p-3 text-xs"
          onChange={(e) => setUploaded(e.target.files[0])}
          required
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={handleBackToHome}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Nazad
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !uploaded}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Slanje...
              </span>
            ) : (
              "Pošalji uplatnicu"
            )}
          </button>
        </div>
      </form>
    </>
  );
}