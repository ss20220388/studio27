import { useState } from "react";
import PaymentChoice from "./PaymentChoice.jsx";
import CardPaymentForm from "./CardPaymentForm.jsx";
import UplatnicaForm from "./UplatnicaForm.jsx";
import Success from "./Success.jsx";

export default function BuyCourseModal({ naziv, cena }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1); // 1,2,3
    const [method, setMethod] = useState(""); // "kartica" | "uplatnica"

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
    }

    const handleClose = () => {
        setOpen(false);
        setStep(1);
        setMethod("");
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-xl font-semibold transition"
            >
                Kupi kurs
            </button>

            {open && (
                <div
                    className="fixed left-0 right-0 inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={handleClose}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-2xl p-8 relative shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <div className="flex  items-center justify-center mb-6 ">
                            {[1, 2, 3].map((s, idx) => (
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

                        {/* Step rendering */}
                        {step === 1 && <PaymentChoice onChoose={handleChooseMethod} naziv={naziv} cena={cena} />}
                        {step === 2 && method === "kartica" && (
                            <CardPaymentForm onSuccess={handleSuccess} naziv={naziv} cena={cena} onBack={handleBack} />
                        )}
                        {step === 2 && method === "uplatnica" && (
                            <UplatnicaForm onSuccess={handleSuccess} naziv={naziv} cena={cena} onBack={handleBack} />
                        )}
                        {step === 3 && <Success naziv={naziv} onBack={handleBack} />}
                    </div>
                </div>
            )}
        </>
    );
}