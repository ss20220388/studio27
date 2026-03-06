import { useState } from "react";

export default function CardPaymentForm({ onSuccess, naziv, cena, onBack }) {
  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess();
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4 text-black">Plaćanje karticom</h2>
      <p className="text-gray-500 mb-6">{naziv} - {cena} RSD</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input type="text" placeholder="Ime na kartici" className="w-full border border-gray-300 rounded-xl p-3" value={name} onChange={(e)=>setName(e.target.value)} required/>
        <input type="text" placeholder="Broj kartice" className="w-full border border-gray-300 rounded-xl p-3" value={cardNumber} onChange={(e)=>setCardNumber(e.target.value)} required/>
        <div className="flex gap-3">
          <input type="text" placeholder="MM/YY" className="flex-1 border border-gray-300 rounded-xl p-3" value={expiry} onChange={(e)=>setExpiry(e.target.value)} required/>
          <input type="text" placeholder="CVV" className="w-24 border border-gray-300 rounded-xl p-3" value={cvv} onChange={(e)=>setCvv(e.target.value)} required/>
        </div>

        <div className="flex justify-between mt-4">
          <button type="button" onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
            Nazad
          </button>

          <button type="submit" className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-semibold transition">
            Dalje
          </button>
        </div>
      </form>
    </>
  );
}