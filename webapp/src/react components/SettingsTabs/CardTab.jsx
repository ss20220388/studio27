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
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">Vaša kartica</h2>
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl p-4 sm:p-8 w-full max-w-xs shadow-lg flex flex-col items-center">
            <div className="text-lg sm:text-xl mb-2 tracking-widest break-all">{maskCard(card)}</div>
            <div className="text-xs sm:text-sm text-gray-300 mb-1">{cardName}</div>
            <div className="text-xs sm:text-sm text-gray-300 mb-4">Exp: {expiry} &nbsp; | &nbsp; Visa</div>
            <button
              className="bg-white text-gray-900 rounded px-4 py-2 hover:bg-gray-200 transition text-sm font-semibold w-full sm:w-auto"
              onClick={() => setShowModal(true)}
            >
              Promeni karticu
            </button>
          </div>
          <div className="mt-6 text-gray-500 text-xs sm:text-sm text-center max-w-xs">
            Samo prva i poslednja četiri broja su prikazana radi vaše sigurnosti.
          </div>

          {/* Modal za promenu kartice */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-2">
              <div className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-xs sm:max-w-sm relative shadow-2xl">
                <button
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 text-2xl"
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-center">Promena kartice</h3>
                <form onSubmit={handleSave} className="flex flex-col gap-3 sm:gap-4">
                  <input
                    type="text"
                    maxLength={16}
                    minLength={16}
                    pattern="\d{16}"
                    className="border rounded px-3 py-2 text-sm sm:text-base"
                    placeholder="Broj kartice (16 cifara)"
                    value={newCard}
                    onChange={e => setNewCard(e.target.value.replace(/[^0-9]/g, ""))}
                    required
                  />
                  <input
                    type="text"
                    className="border rounded px-3 py-2 text-sm sm:text-base"
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
                      className="border rounded px-3 py-2 w-1/2 text-sm sm:text-base"
                      placeholder="MM/YY"
                      value={newExpiry}
                      onChange={handleExpiryChange}
                      required
                    />
                    <input
                      type="text"
                      maxLength={3}
                      pattern="\d{3}"
                      className="border rounded px-3 py-2 w-1/2 text-sm sm:text-base"
                      placeholder="CVV"
                      value={newCVV}
                      onChange={e => setNewCVV(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-red-900 text-white rounded px-4 py-2 hover:bg-red-800 transition text-sm sm:text-base w-full"
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