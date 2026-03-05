export default function PaymentChoice({ onChoose, naziv, cena }) {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Kupovina kursa</h2>
      <p className="text-gray-500 mb-6">{naziv} - {cena} RSD</p>

      <div className="space-y-3">
        <button
          className="w-full border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition"
          onClick={() => onChoose("kartica")}
        >
          Plaćanje karticom
        </button>

        <button
          className="w-full border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition"
          onClick={() => onChoose("uplatnica")}
        >
          Uplatnica
        </button>
      </div>
    </>
  );
}