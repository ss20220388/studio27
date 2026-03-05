import React, { useState } from "react";
import VideoPlayerHLS from "./VideoPlayerHLS";

const KursPlayer = ({ lekcije, token }) => {
    const [selectedVideo, setSelectedVideo] = useState(
        lekcije?.[0]?.klipovi?.[0]?.url || null
    );

    const [openLesson, setOpenLesson] = useState(null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 ">

            <div className="lg:col-span-1 bg-white min-w-[300px] shadow-2xl rounded-3xl p-6 h-full overflow-y-auto border border-gray-100">

                <h2 className="text-2xl font-bold mb-8 text-gray-800">
                    Lekcije
                </h2>

                {lekcije.map((lekcija) => (
                    <div key={lekcija.lekcijaId} className="mb-6">

                        <button
                            onClick={() =>
                                setOpenLesson(
                                    openLesson === lekcija.lekcijaId
                                        ? null
                                        : lekcija.lekcijaId
                                )
                            }
                            className={`w-full text-left p-4 rounded-2xl transition-all duration-300 font-semibold
              ${openLesson === lekcija.lekcijaId
                                    ? "bg-red-50 text-red-700 shadow-md"
                                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            {lekcija.naziv}
                        </button>

                        {openLesson === lekcija.lekcijaId && (
                            <div className="mt-4 space-y-3 pl-3 border-l-2 border-red-200">

                                {lekcija.klipovi.map((klip) => (
                                    <button
                                        key={klip.videoId}
                                        onClick={() => setSelectedVideo(klip.url)}
                                        className={`group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 text-sm
                    ${selectedVideo === klip.url
                                                ? "bg-red-800 text-white shadow-lg"
                                                : "bg-white hover:bg-red-50 text-gray-700"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            Video {klip.videoId}
                                        </span>

                                        {selectedVideo === klip.url && (
                                            <span className="text-xs opacity-80">
                                                {"<"}
                                            </span>
                                        )}
                                    </button>
                                ))}

                            </div>
                        )}
                    </div>
                ))}
            </div>


            {/* VIDEO PLAYER */}
            <div className="lg:col-span-3">

                <div className="bg-black rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]">

                    {selectedVideo ? (
                        <div className="aspect-video ">
                            <VideoPlayerHLS
                                videoId={selectedVideo}
                                accessToken={token}
                            />
                        </div>
                    ) : (
                        <div className="h-[600px] opacity-80 flex items-center justify-center text-white text-lg">
                            Izaberite video
                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

export default KursPlayer;