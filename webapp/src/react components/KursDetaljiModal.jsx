import React from "react";
import BuyCourseModal from "./BuyCourseModal";

const KursDetaljiModal = ({
    kurs,
    isOpen,
    onClose,
    API_URL,
    pohadjanje,
    accessToken
}) => {
    const [komentari, setKomentari] = React.useState([]);
    const [loadingKomentari, setLoadingKomentari] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            // Zabranjujemo skrolovanje pozadine kad je modal otvoren
            document.body.style.overflow = 'hidden';

            async function fetchRecenzije() {
                try {
                    setLoadingKomentari(true);
                    const response = await fetch(`${API_URL}/api/recenzije`);
                    if (response.ok) {
                        const data = await response.json();
                        const filtered = data.filter(r => r.kursId === kurs.kursId);
                        setKomentari(filtered.length > 0 ? filtered : data.slice(0, 3));
                    }
                    setLoadingKomentari(false);
                } catch (error) {
                    console.error("Error fetching comments:", error);
                    setLoadingKomentari(false);
                }
            }
            fetchRecenzije();
        } else {
            document.body.style.overflow = 'auto';
        }

        // Čišćenje kad se komponenta unmount-uje
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, API_URL, kurs.kursId]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div 
                className="bg-neutral-900 border-0 sm:border border-neutral-700/60 rounded-none sm:rounded-3xl w-full max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden relative flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-default animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-neutral-900/80 hover:bg-red-900/80 text-white w-10 h-10 flex items-center justify-center rounded-full transition-all z-50 backdrop-blur-sm border border-neutral-700 hover:border-red-800 shadow-xl"
                >
                    ✕
                </button>

                {/* Desktop slika */}
                <div className="w-full md:w-[45%] h-64 md:h-auto relative hidden md:block flex-none">
                    <img src={`${API_URL}/api/uploaded-images${kurs.slikaUrl}`} alt={kurs.naziv} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-neutral-900 via-neutral-900/70 to-transparent"></div>
                    
                    <div className="absolute bottom-10 left-10 right-10">
                        <h1 className="text-3xl xl:text-4xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">{kurs.naziv}</h1>
                        
                        {kurs.cena > 0 && !pohadjanje && (
                            <div className="inline-block bg-neutral-800/80 border border-neutral-700 backdrop-blur-md rounded-xl mt-4 px-6 py-3">
                                <div className="text-sm text-neutral-400 font-medium">Cena Modula</div>
                                <div className="text-3xl font-bold text-red-500">{kurs.cena} <span className="text-lg">EUR</span></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile slika */}
                <div className="w-full h-[30vh] min-h-[220px] flex-none relative md:hidden">
                    <img src={`${API_URL}/api/uploaded-images${kurs.slikaUrl}`} alt={kurs.naziv} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/20 to-transparent"></div>
                    <h1 className="absolute bottom-4 left-6 right-6 text-3xl font-bold text-white drop-shadow-lg">{kurs.naziv}</h1>
                </div>

                {/* Sadržaj (Desna strana / Donja strana na mobilnom) */}
                <div className="w-full md:w-[55%] p-6 md:p-10 flex flex-col flex-1 overflow-y-auto no-scrollbar bg-neutral-900 relative">
                    <div className="border-b border-neutral-800 pb-4 mb-6">
                        <h3 className="text-lg font-semibold text-red-500 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Opis Modula
                        </h3>
                    </div>
                    
                    <div className="prose prose-invert max-w-none text-neutral-300 font-light leading-relaxed whitespace-pre-line text-sm md:text-base mb-10">
                        {kurs.opis}
                    </div>

                    {loadingKomentari ? (
                        <div className="animate-pulse space-y-4 mt-4">
                            <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
                            <div className="h-16 bg-neutral-800 rounded w-full"></div>
                        </div>
                    ) : komentari.length > 0 ? (
                        <div className="mt-4 mb-10">
                            <h3 className="text-lg font-semibold text-neutral-200 mb-4 pb-2 border-b border-neutral-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.898 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                Utisci polaznika
                            </h3>
                            <div className="space-y-3">
                                {komentari.map((komentar, i) => (
                                    <div key={i} className="bg-neutral-800/40 p-4 rounded-xl border border-neutral-800">
                                        <div className="text-red-400 font-medium text-sm mb-1">{komentar.imeIPrezime}</div>
                                        <div className="text-neutral-400 text-sm italic">"{komentar.tekst}"</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 mb-4 text-sm italic text-neutral-500 flex items-center gap-2">
                             ~ Za ovaj kurs trenutno nema prikazanih recenzija.
                        </div>
                    )}
                    
                    <div className="mt-auto pt-8"></div>

                    <div className="sticky bottom-0 md:static mt-auto pt-6 border-t border-neutral-800 bg-neutral-900 pb-2 md:pb-0 z-10 w-full">
                        {pohadjanje ? (
                            <button 
                                onClick={() => window.location.href = `/kurs/${kurs.kursId}`} 
                                className="bg-red-900 hover:bg-red-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 w-full text-lg shadow-[0_4px_20px_rgba(127,29,29,0.3)] hover:shadow-[0_4px_30px_rgba(127,29,29,0.6)] cursor-pointer"
                            >
                                Uđi u panel sa lekcijama
                            </button>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="w-full">
                                    <BuyCourseModal API_URL={API_URL} token={accessToken} kursId={kurs.kursId} naziv={kurs.naziv} cena={kurs.cena} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KursDetaljiModal;