import React, { useState } from "react";
import VideoPlayerHLS from "./VideoPlayerHLS";

const KursPlayer = ({ lekcije, token }) => {
    const [selectedVideo, setSelectedVideo] = useState(
        lekcije?.[0]?.klipovi?.[0]?.url || null
    );

    const [openLesson, setOpenLesson] = useState(null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Lessons sidebar */}
            <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 min-w-[280px] rounded-xl p-5 h-full overflow-y-auto">

                <h2 className="text-sm font-semibold text-white mb-5">
                    Lekcije
                </h2>

                <div className="space-y-3">
                    {lekcije.map((lekcija) => (
                        <div key={lekcija.lekcijaId}>

                            <button
                                onClick={() =>
                                    setOpenLesson(
                                        openLesson === lekcija.lekcijaId
                                            ? null
                                            : lekcija.lekcijaId
                                    )
                                }
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                  ${openLesson === lekcija.lekcijaId
                                        ? "bg-red-900/15 text-red-400 border border-red-900/20"
                                        : "bg-neutral-800/50 hover:bg-neutral-800 text-neutral-300"
                                    }`}
                            >
                                {lekcija.naziv}
                            </button>

                            {openLesson === lekcija.lekcijaId && (
                                <div className="mt-2 space-y-1 pl-3 border-l border-neutral-800">

                                    {lekcija.klipovi.map((klip) => (
                                        <button
                                            key={klip.videoId}
                                            onClick={() => setSelectedVideo(klip.url)}
                                            className={`group flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 text-xs
                        ${selectedVideo === klip.url
                                                    ? "bg-red-900 text-white"
                                                    : "hover:bg-neutral-800 text-neutral-400"
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                                Video {klip.videoId}
                                            </span>
                                        </button>
                                    ))}

                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>


            {/* VIDEO PLAYER */}
            <div className="lg:col-span-3">

                <div className="bg-black rounded-xl overflow-hidden border border-neutral-800">

                    {selectedVideo ? (
                        <div className="aspect-video">
                            <VideoPlayerHLS
                                videoId={selectedVideo}
                                accessToken={token}
                            />
                        </div>
                    ) : (
                        <div className="aspect-video flex items-center justify-center text-neutral-500 text-sm">
                            Izaberite video
                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

export default KursPlayer;