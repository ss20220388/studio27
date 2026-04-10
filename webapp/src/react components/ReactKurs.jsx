import React from "react";
import BuyCourseModal from "./BuyCourseModal";
import KursDetaljiModal from "./KursDetaljiModal";

const ReactKurs = ({
    kurs,
    userId,
    accessToken,
    unpaid = true,
    paid = true,
}) => {
    const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";
    const [pohadjanje, setPohadjanje] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = React.useState(false);

    React.useEffect(() => {
        async function fetchPohadjanje() {
            try {
                setLoading(true);

                const response = await fetch(
                    `${API_URL}/api/pohadjam-kurs?userId=${userId}&kursId=${kurs.kursId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                const data = await response.json();
                setPohadjanje(data.pohadja);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching pohadjanje:", error);
                setLoading(false);
            }
        }

        fetchPohadjanje();
    }, []);

    const handleMouseMove = (e) => {
        // Pravimo offset da bi prozorčić bio uz miš
        setMousePos({ x: e.clientX - 500, y: e.clientY - 80 });
    };

    if (loading) {
        return (
            <div className="w-full h-[420px] bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-pulse">
                <div className="w-full h-40 bg-neutral-800 rounded-lg mb-4"></div>
                <div className="h-5 bg-neutral-800 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-neutral-800/60 rounded w-full mb-2"></div>
                <div className="h-4 bg-neutral-800/60 rounded w-5/6 mb-4"></div>
                <div className="flex justify-between">
                    <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
                    <div className="h-4 bg-neutral-800 rounded w-1/5"></div>
                </div>
            </div>
        );
    }


    if (!paid && pohadjanje) {
        return null;
    }

    if (!unpaid && !pohadjanje) {
        return null;
    }


    return (
        <>
            <div 
                className="relative w-full cursor-pointer group" 
                onClick={() => setIsModalOpen(true)}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <div
                    className={`bg-neutral-900 border border-neutral-800 rounded-xl relative max-w-[400px] h-[420px] overflow-hidden p-6 transition-all duration-300 w-full hover:border-neutral-700 ${!pohadjanje ? 'opacity-70 group-hover:opacity-100' : ''}`}
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition duration-500"
                        style={{
                            backgroundImage: `url('${API_URL}/api/uploaded-images${kurs.slikaUrl}')`,
                        }}
                    ></div>

                    <div className="absolute inset-0 bg-black/70 group-hover:bg-black/60 transition duration-500"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white pointer-events-none">
                        <div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 drop-shadow-md">
                                {kurs.naziv}
                            </h3>

                            <p className="text-xs sm:text-sm md:text-base opacity-90 leading-relaxed line-clamp-4">
                                {kurs.opis}
                            </p>
                        </div>

                        <div className="flex justify-end pointer-events-auto">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsModalOpen(true);
                                }}
                                onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    setIsHovering(false);
                                }}
                                onMouseLeave={(e) => {
                                    e.stopPropagation();
                                    setIsHovering(true);
                                }}
                                className="bg-red-900 hover:bg-red-800 transition-all duration-300 px-5 py-2 sm:px-6 sm:py-3 text-sm font-semibold rounded-lg shadow-lg"
                            >
                                Detaljnije
                            </button>
                        </div>
                    </div>
                </div>

                {!pohadjanje && unpaid && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none" style={{ zIndex: 10 }}>
                        <div
                            className="absolute inset-0 bg-cover bg-center scale-105 blur-sm"
                            style={{
                                backgroundImage: `url(${API_URL}/api/uploaded-images${kurs.slikaUrl})`,
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40" />
                        <div className="relative flex flex-col items-center justify-center h-full text-center px-6 pointer-events-auto" style={{ zIndex: 20 }}>
                            <div className="text-6xl mb-4 text-white">🔒</div>
                            <h2 className="text-2xl font-bold text-white mb-2 shadow-sm drop-shadow-md">
                                {kurs.naziv}
                            </h2>
                            <p className="text-sm opacity-90 mb-6 text-white max-w-xs shadow-sm">
                                Nemate pristup ovom kursu
                            </p>
                            <div 
                                className="w-full max-w-[220px]" 
                                onClick={e => e.stopPropagation()}
                                onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    setIsHovering(false);
                                }}
                                onMouseLeave={(e) => {
                                    e.stopPropagation();
                                    setIsHovering(true);
                                }}
                            >
                                <BuyCourseModal API_URL={API_URL} token={accessToken} kursId={kurs.kursId} naziv={kurs.naziv} cena={kurs.cena} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MOUSE TRACKING TOOLTIP */}
            {isHovering && (
                <div 
                    className="fixed pointer-events-none z-[110] transition-opacity duration-150 ease-out text-sm font-medium"
                    style={{ left: mousePos.x, top: mousePos.y }}
                >
                    <div className="bg-red-950/90 text-white px-4 py-2 rounded-lg shadow-2xl border border-red-800/80 backdrop-blur-md animate-in fade-in zoom-in-95 flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        Klikni za detalje kursa
                    </div>
                </div>
            )}

            {/* POBOLJŠANI MODAL ZA DETALJE KURSA - EKSTRAKTOVAN U ZASEBNU KOMPONENTU */}
            <KursDetaljiModal 
                kurs={kurs}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                API_URL={API_URL}
                pohadjanje={pohadjanje}
                accessToken={accessToken}
            />
        </>
    );
};

export default ReactKurs;