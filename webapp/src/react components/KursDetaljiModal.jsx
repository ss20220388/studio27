import React from "react";
import { createPortal } from "react-dom";



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
    const APP_URL = import.meta.env.PUBLIC_APP_URL || "http://studio27.rs";

    React.useEffect(() => {
        if (isOpen) {
            // Zabranjujemo skrolovanje pozadine kad je modal otvoren
            document.body.style.overflow = 'hidden';
            const mainContainer = document.querySelector('main');
            if (mainContainer) mainContainer.style.overflow = 'hidden';

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
            document.body.style.overflow = '';
            const mainContainer = document.querySelector('main');
            if (mainContainer) mainContainer.style.overflow = '';
        }

        // Čišćenje kad se komponenta unmount-uje
        return () => {
            document.body.style.overflow = '';
            const mainContainer = document.querySelector('main');
            if (mainContainer) mainContainer.style.overflow = '';
        };
    }, [isOpen, API_URL, kurs.kursId]);

    if (!isOpen) return null;

    // Koristimo createPortal da renderujemo modal izvan hijerarhije gde transform/overflow klase kvare fixed pozicioniranje
    return createPortal(
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
                    className="absolute cursor-pointer top-4 right-4 bg-neutral-900/80 hover:bg-red-900/80 text-white w-10 h-10 flex items-center justify-center rounded-full transition-all z-50 backdrop-blur-sm border border-neutral-700 hover:border-red-800 shadow-xl"
                >
                    ✕
                </button>

                {/* Desktop slika */}
                <div className="w-full md:w-[45%] h-64 md:h-auto relative hidden md:block flex-none">
                    <img src={`${API_URL}/api/uploaded-images${kurs.slikaUrl}`} alt={kurs.naziv} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t md:bg-linear-to-r from-neutral-900 via-neutral-900/70 to-transparent"></div>
                    
                    <div className="absolute bottom-10 left-10 right-10">
                        <h1 className="text-3xl xl:text-4xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">{kurs.naziv}</h1>
                        
                        {kurs.cena > 0 && !pohadjanje && (
                            <div className="inline-block bg-neutral-800/80 border border-neutral-700 backdrop-blur-md rounded-xl mt-4 px-6 py-3">
                                <div className="text-sm text-neutral-400 font-medium">Cena Kursa</div>
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

                   
                        <div className="mt-4 mb-10">
                            <div className="space-y-3">
                                <div className="bg-neutral-800/40 p-4 rounded-xl border border-neutral-800">
                                    <div className="text-red-400 font-medium text-sm mb-1">{kurs.komentarGore}</div>
                                    <div className="text-neutral-300 text-sm mb-2">{kurs.komentarSredina}</div>
                                    <div className="text-neutral-400 text-sm italic">"{kurs.komentarDole}"</div>

                                </div>
                            </div>
                        </div>
                    
                    
                    <div className="mt-auto pt-8"></div>

                    <div className="sticky bottom-0 md:static mt-auto pt-6 border-t border-neutral-800 bg-neutral-900 pb-2 md:pb-0 z-10 w-full">
                        {pohadjanje ?(
                            <button 
                                onClick={() => window.location.href = `/kurs/${kurs.kursId}`} 
                                className="bg-red-900 hover:bg-red-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 w-full text-lg shadow-[0_4px_20px_rgba(127,29,29,0.3)] hover:shadow-[0_4px_30px_rgba(127,29,29,0.6)] cursor-pointer"
                            >
                                Uđi u panel sa lekcijama
                            </button>
                        ) :(
                            <div>
                                <a href={`${APP_URL}/kurs/${kurs.kursId}`}  className="bg-red-900 hover:bg-red-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 w-full text-lg shadow-[0_4px_20px_rgba(127,29,29,0.3)] hover:shadow-[0_4px_30px_rgba(127,29,29,0.6)] cursor-pointer">
                                    Pogledajte kurs
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default KursDetaljiModal;