import React, { useState } from "react";

export default function SettingsPage() {
  // Password form
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [pwSaved, setPwSaved] = useState(false);

  // Bulk email
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });
  const [emailSent, setEmailSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePasswordSave = () => {
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
    setPw({ current: "", newPw: "", confirm: "" });
  };

  const handleSendEmail = () => {
    setShowConfirm(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
    setEmailForm({ subject: "", body: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="pb-5 border-b border-neutral-800/60">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Sistem</p>
        <h1 className="text-2xl font-bold text-white">Podešavanja</h1>
        <p className="text-sm text-neutral-500 mt-1">Admin nalog i sistemske opcije</p>
      </div>

      {/* Change password */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5 text-neutral-400">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Promena lozinke</h2>
              <p className="text-[11px] text-neutral-500">Ažurirajte lozinku admin naloga</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
              Trenutna lozinka
            </label>
            <input
              type="password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
              className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                Nova lozinka
              </label>
              <input
                type="password"
                value={pw.newPw}
                onChange={(e) => setPw({ ...pw, newPw: e.target.value })}
                className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                Potvrdi lozinku
              </label>
              <input
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200"
              />
            </div>
          </div>
          {pw.newPw && pw.confirm && pw.newPw !== pw.confirm && (
            <p className="text-xs text-red-400">Lozinke se ne poklapaju</p>
          )}
          <div className="flex justify-end pt-1">
            <button
              onClick={handlePasswordSave}
              disabled={!pw.current || !pw.newPw || pw.newPw !== pw.confirm}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pwSaved
                  ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30"
                  : "bg-red-900 hover:bg-red-800 text-white shadow-lg shadow-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {pwSaved ? "✓ Lozinka promenjena" : "Promeni lozinku"}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk email */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5 text-neutral-400">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Grupni email</h2>
              <p className="text-[11px] text-neutral-500">Pošaljite svim korisnicima isti email</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
              Naslov (Subject)
            </label>
            <input
              type="text"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              placeholder="Npr. Novi kurs je dostupan!"
              className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
              Sadržaj poruke
            </label>
            <textarea
              value={emailForm.body}
              onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
              placeholder="Napišite poruku koja će biti poslata svim korisnicima..."
              rows={5}
              className="w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600 resize-none"
            />
          </div>

          <div className="bg-amber-900/10 border border-amber-800/20 rounded-lg p-3 flex items-start gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500 mt-0.5 shrink-0">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-amber-400">
              Ova poruka će biti poslata svim registrovanim korisnicima ({1247}). Akcija se ne može poništiti.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            {emailSent ? (
              <div className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-900/20 text-emerald-400 border border-emerald-800/30">
                ✓ Email uspešno poslat
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!emailForm.subject || !emailForm.body}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-900 hover:bg-red-800 text-white transition-colors shadow-lg shadow-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Pošalji svima
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-sm shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeIn 0.25s ease-out" }}
          >
            <div className="w-12 h-12 rounded-full bg-amber-900/20 border border-amber-800/30 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-amber-400">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white text-center mb-1">Jeste li sigurni?</h3>
            <p className="text-xs text-neutral-400 text-center mb-5">
              Email "{emailForm.subject}" će biti poslat svim korisnicima.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-400 bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleSendEmail}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors"
              >
                Pošalji
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
