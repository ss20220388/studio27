export default function Success({ naziv, onBack }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-green-600 mb-4">Uspešno!</h2>
      <p className="text-gray-600 mb-6">
        Tvoj kurs <span className="font-semibold">{naziv}</span> bi trebalo da je otkljucan,ukoliko je placen karticom, ukoliko je placen uplatnicom molicemo vas da sacekate da nas tim potvrdi uplatu.
      </p>
      <p className="text-gray-500 mb-6">Uzivaj u učenju.</p>
      <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
        Nazad
      </button>
    </div>
  );
}