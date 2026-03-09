import React, { useState } from "react";
function maskCard(card) {
  if (!card) return "";
  return card.slice(0, 4) + " **** **** " + card.slice(-4);
}

export default function CardTab() {
      const [card, setCard] = useState("4242424242424242");
      const [cardName, setCardName] = useState("Petar Petrović");
      const [expiry, setExpiry] = useState("12/28");
      const [showModal, setShowModal] = useState(false);

      // Polja za unos
      const [newCard, setNewCard] = useState("");
      const [newName, setNewName] = useState("");
      const [newExpiry, setNewExpiry] = useState("");
      const [newCVV, setNewCVV] = useState("");

      // Automatsko formatiranje MM/YY
      const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, "");
        if (val.length > 4) val = val.slice(0, 4);
        if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
        setNewExpiry(val);
      };

      const handleSave = (e) => {
        e.preventDefault();
    
        const nameValid = newName.trim().length > 3;
        const expiryValid = /^\d{2}\/\d{2}$/.test(newExpiry);
        
      };

      return (
        <div className="flex flex-col items-center w-full px-2 sm:px-0">
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 text-white rounded-xl p-6 sm:p-8 w-full max-w-xs flex flex-col items-center">
            <div className="text-lg sm:text-xl mb-2 tracking-widest break-all text-neutral-100">{maskCard(card)}</div>
            <div className="text-xs sm:text-sm text-neutral-400 mb-1">{cardName}</div>
            <div className="text-xs sm:text-sm text-neutral-500 mb-5">Exp: {expiry} &nbsp; | &nbsp; Visa</div>
            <button
              className="bg-red-900 text-white rounded-lg px-4 py-2 hover:bg-red-800 transition-colors text-sm font-medium w-full"
              onClick={() => setShowModal(true)}
            >
              Promeni karticu
            </button>
          </div>
          <div className="mt-4 text-neutral-600 text-xs text-center max-w-xs">
            Samo prva i poslednja četiri broja su prikazana radi vaše sigurnosti.
          </div>

          {/* Modal za promenu kartice */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-2" onClick={() => setShowModal(false)}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 w-full max-w-xs sm:max-w-sm relative" onClick={e => e.stopPropagation()}>
                <button
                  className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-300 text-2xl transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
                <h3 className="text-lg font-semibold mb-5 text-center text-neutral-100">Promena kartice</h3>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <input
                    type="text"
                    maxLength={16}
                    minLength={16}
                    pattern="\d{16}"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-900 transition-colors"
                    placeholder="Broj kartice (16 cifara)"
                    value={newCard}
                    onChange={e => setNewCard(e.target.value.replace(/[^0-9]/g, ""))}
                    required
                  />
                  <input
                    type="text"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-900 transition-colors"
                    placeholder="Ime i prezime na kartici"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                  />
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      maxLength={5}
                      pattern="\d{2}/\d{2}"
                      className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 w-1/2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-900 transition-colors"
                      placeholder="MM/YY"
                      value={newExpiry}
                      onChange={handleExpiryChange}
                      required
                    />
                    <input
                      type="text"
                      maxLength={3}
                      pattern="\d{3}"
                      className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 w-1/2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-900 transition-colors"
                      placeholder="CVV"
                      value={newCVV}
                      onChange={e => setNewCVV(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-red-900 text-white rounded-lg px-4 py-2.5 hover:bg-red-800 transition-colors text-sm font-medium w-full mt-1"
                  >
                    Sačuvaj karticu
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }