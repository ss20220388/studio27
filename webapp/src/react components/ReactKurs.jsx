import { set } from 'astro:schema';
import React from 'react'

const ReactKurs = ({ kurs, userId, accessToken }) => {
    const [pohadjanje, setPohadjanje] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {

        async function fetchPohadjanje() {
            try {
                setLoading(true);
                const response = await fetch(`http://api.studio27.rs/api/pohadjam-kurs?userId=${userId}&kursId=${kurs.kursId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${accessToken}`
                        }
                    }
                );

                const data = await response.json();
                setPohadjanje(data.pohadja);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching pohadjanje:", error);
            }
        }
        fetchPohadjanje();
    }, []);
    if (loading) {
        return (
            <div className="shadow-md w-[350px] h-[500px] bg-white rounded-xl p-6  animate-pulse">

                <div className="w-full h-40 bg-gray-300 rounded-lg mb-4"></div>

                <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>

                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>

                <div className="flex justify-between">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/5"></div>
                </div>

            </div>
        );
    }


    return (
        <div className="relative w-full ">
            <div
                className={` bg-white rounded-xl relative   max-w-[400px] h-[420px] sm:h-[450px] md:h-[500px] overflow-hidden shadow-xl group p-6 transition duration-300 w-full 
            ${pohadjanje ? "hover:shadow-xl cursor-pointer" : "opacity-70"}`}
                onClick={() => {
                    if (pohadjanje) {
                        window.location.href = `/kurs/${kurs.kursId}`
                    }
                }}
            >
                    
                    <div
                        className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition duration-500"
                        style={{ backgroundImage: `url('http://api.studio27.rs/api/uploaded-images${kurs.slikaUrl}')` }}
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

            {!pohadjanje && (
                <div className="absolute inset-0 rounded-xl overflow-hidden">

                    {/* Zamagljena pozadina */}
                    <div
                        className="absolute inset-0 bg-cover bg-center scale-105 blur-sm"
                        style={{
                            backgroundImage: `url(http://api.studio27.rs/api/uploaded-images${kurs.slikaUrl})`
                        }}
                    />

                    {/* Tamni gradient preko slike */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40" />

                    {/* Sadržaj */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">

                        <div className="text-6xl mb-4 animate-pulse">
                            🔒
                        </div>

                        <h2 className="text-2xl font-bold mb-2">
                            {kurs.naziv}
                        </h2>

                        <p className="text-sm opacity-90 mb-4 max-w-xs">
                            Nemate pristup ovom kursu
                        </p>

                        <button
                            onClick={() => window.location.href = `/kupovina/${kurs.kursId}`}
                            className="bg-red-900 hover:bg-red-800 px-6 py-2 font-semibold transition duration-300 shadow-lg hover:scale-105"
                        >
                            Kupi kurs
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}

export default ReactKurs