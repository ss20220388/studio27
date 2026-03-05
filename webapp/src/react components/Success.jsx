export default function Success({ naziv, onBack }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-green-600 mb-4">Uspešno!</h2>
      <p className="text-gray-600 mb-6">
        Tvoj kurs <span className="font-semibold">{naziv}</span> je sada otključan!
      </p>
      <p className="text-gray-500 mb-6">Možeš odmah da ga započneš i uživaš u učenju.</p>
      <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
        Nazad
      </button>
    </div>
  );
}