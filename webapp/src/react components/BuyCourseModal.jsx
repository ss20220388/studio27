import { useState } from "react";
import { createPortal } from "react-dom";
import PaymentChoice from "./PaymentChoice.jsx";
import CardPaymentForm from "./CardPaymentForm.jsx";
import UplatnicaForm from "./UplatnicaForm.jsx";
import Success from "./Success.jsx";

export default function BuyCourseModal({ naziv, cena,kursId ,API_URL, token}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("");

  const handleChooseMethod = (chosen) => {
    setMethod(chosen);
    setStep(2);
  };

  const handleSuccess = () => {
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleClose = () => {
    setOpen(false);
    setStep(1);
    setMethod("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full z-50 bg-red-900 hover:bg-red-800 cursor-pointer text-white py-3 rounded-xl font-semibold transition"
      >
        Kupi kurs
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80"
          style={{
            zIndex: 99999,
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'auto',
          }}
          onClick={handleClose}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl p-8 relative shadow-2xl"
            style={{
              zIndex: 100000,
              isolation: 'isolate',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              style={{ zIndex: 100001 }}
            >
              ✕
            </button>
            {/* TRACKER */}
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition
                    ${step >= s ? "bg-red-800" : "bg-gray-300"}`}
                  >
                    {s}
                  </div>
                  {s !== 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors
                      ${step > s ? "bg-red-800" : "bg-gray-300"}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            {/* STEP RENDER */}
            {step === 1 && (
              <PaymentChoice
                onChoose={handleChooseMethod}
                naziv={naziv}
                cena={cena}
              />
            )}
            {step === 2 && method === "kartica" && (
              <CardPaymentForm
                onSuccess={handleSuccess}
                naziv={naziv}
                cena={cena}
                kursId = {kursId}
                onBack={handleBack}
                API_URL={API_URL}
                token={token}
              />
            )}
            {step === 2 && method === "uplatnica" && (
              <UplatnicaForm
                onSuccess={handleSuccess}
                naziv={naziv}
                cena={cena}
                onBack={handleBack}
                kursId={kursId}
                API_URL={API_URL}
                token={token}
              />
            )}
            {step === 3 && <Success naziv={naziv} onBack={handleBack} />}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}