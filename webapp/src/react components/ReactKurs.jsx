import React from "react";
import BuyCourseModal from "./BuyCourseModal";

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
        <div className="relative w-full">
            <div
                className={`bg-neutral-900 border border-neutral-800 rounded-xl relative max-w-[400px] h-[420px] overflow-hidden group p-6 transition-all duration-300 w-full 
        ${pohadjanje ? "hover:border-neutral-700 cursor-pointer" : "opacity-70"}`}
                onClick={() => {
                    if (pohadjanje) {
                        window.location.href = `/kurs/${kurs.kursId}`;
                    }
                }}
            >
                <div
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition duration-500"
                    style={{
                        backgroundImage: `url('${API_URL}/api/uploaded-images${kurs.slikaUrl}')`,
                    }}
                ></div>

                <div className="absolute inset-0 bg-black/70 group-hover:bg-black/60 transition duration-500"></div>

                <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
                    <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                            {kurs.naziv}
                        </h3>

                        <p className="text-xs sm:text-sm md:text-base opacity-90 leading-relaxed">
                            {kurs.opis}
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <a
                            href={`/kurs/${kurs.kursId}`}
                            className="bg-red-900 hover:bg-red-800 transition-all duration-300 px-5 py-2 sm:px-6 sm:py-3 text-sm font-semibold"
                        >
                            Detaljnije
                        </a>
                    </div>
                </div>
            </div>

            {!pohadjanje && unpaid && (
                <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ zIndex: 10 }}>
                    {/* blur pozadina */}
                    <div
                        className="absolute inset-0 bg-cover bg-center scale-105 blur-sm pointer-events-none"
                        style={{
                            backgroundImage: `url(${API_URL}/api/uploaded-images${kurs.slikaUrl})`,
                            zIndex: 10,
                        }}
                    />
                    {/* gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40 pointer-events-none" style={{ zIndex: 10 }} />
                    {/* sadržaj */}
                    <div className="relative flex flex-col items-center justify-center h-full text-center px-6" style={{ zIndex: 20 }}>
                        <div className="text-6xl mb-4 animate-pulse text-white">🔒</div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {kurs.naziv}
                        </h2>
                        <p className="text-sm opacity-90 mb-6 text-white max-w-xs">
                            Nemate pristup ovom kursu
                        </p>
                        {/* dugme sada radi */}
                        <div className="w-full max-w-[220px]">
                            <BuyCourseModal API_URL={API_URL} token={accessToken} kursId={kurs.kursId} naziv={kurs.naziv} cena={kurs.cena} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReactKurs;