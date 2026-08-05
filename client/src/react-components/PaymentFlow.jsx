import { useState } from "react";
import PaymentCheckout from "./PaymentCheckout.jsx";
import UplatnicaForm from "./UplatnicaForm.jsx";

export default function PaymentFlow({ API_URL, token }) {
  const [method, setMethod] = useState(null); // null | 'card' | 'uplatnica'
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBack = () => {
    window.location.href = "/";
  };

  const handleSuccess = () => {
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-green-600">Uspešno ste kupili kurs!</h2>
        <p className="text-sm text-gray-600">
          Vaša porudžbina je zabeležena. Pristup kursu biće aktiviran nakon provere.
        </p>
        <button
          onClick={handleBack}
          className="mt-4 px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition"
        >
          Nazad na početnu
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-xl w-full">
      {method === "uplatnica" ? (
        <UplatnicaForm
          API_URL={API_URL}
          token={token}
          onSuccess={handleSuccess}
          onBack={handleBack}
        />
      ) : (
        <PaymentCheckout
          API_URL={API_URL}
          token={token}
          onSelectUplatnica={() => setMethod("uplatnica")}
          onBack={handleBack}
        />
      )}
    </div>
  );
}