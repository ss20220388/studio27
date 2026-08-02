import React, { useState } from "react";
import VideoPlayerHLS from "./VideoPlayerHLS";

const KursPlayer = ({ lekcije, token, API_URL, materijali }) => {
    const [selectedVideo, setSelectedVideo] = useState(
        lekcije?.[0]?.klipovi?.[0] || null
    );

    const [openLesson, setOpenLesson] = useState(lekcije?.[0]?.lekcijaId || null);

    // Razdvajanje materijala na scene (imaju urlSlika) i obične fajlove
    const scene = materijali?.filter((m) => m.urlSlika) || [];
    const obicniMaterijali = materijali?.filter((m) => !m.urlSlika) || [];

    return (
        <div className="space-y-12">
            {/* GORNJI DEO: LEKCIJE I VIDEO PLAYER */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Lekcije sidebar */}
                <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 min-w-[280px] rounded-xl p-5 h-full overflow-y-auto">
                    <h2 className="text-sm font-semibold text-white mb-5">
                        Lekcije
                    </h2>

                    <div className="space-y-3">
                        {lekcije?.map((lekcija) => (
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
                                        {lekcija.klipovi?.map((klip) => (
                                            <button
                                                key={klip.videoId}
                                                onClick={() => setSelectedVideo(klip)}
                                                className={`group cursor-pointer flex flex-col w-full px-3 py-2 rounded-lg transition-all duration-200 text-xs
                                                ${selectedVideo?.videoId === klip.videoId
                                                        ? "bg-red-900 text-white"
                                                        : "hover:bg-neutral-800 text-neutral-400"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="flex items-center gap-2">
                                                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        <span className="truncate">{klip.naziv || "Video"}</span>
                                                    </span>
                                                    <span className="text-[10px] opacity-70 ml-2 shrink-0">{klip.procenat}%</span>
                                                </div>

                                                {/* Progress bar tracker */}
                                                <div className="w-full bg-black/40 h-1.5 mt-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${selectedVideo?.videoId === klip.videoId ? "bg-white" : "bg-red-600"}`}
                                                        style={{ width: `${klip.procenat}%` }}
                                                    ></div>
                                                </div>
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
                                    videoId={selectedVideo.url}
                                    videoData={selectedVideo}
                                    API_URL={API_URL}
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

            {/* DONJI DEO: SCENE I MATERIJALI */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-10 space-y-12">
                
                {/* 1. SEKCIJA: DODATNE SCENE (Sa slikama) */}
                {scene.length > 0 && (
                    <div className="space-y-6 text-center">
                        <div>
                            <h2 className="text-2xl font-bold tracking-wider text-white uppercase">
                                Dodatne Scene
                            </h2>
                            <p className="text-sm text-neutral-400 mt-1">
                                Scene za vežbu i analizu
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto pt-4">
                            {scene.map((scena) => (
                                <a
                                    key={scena.id}
                                    href={`${API_URL}/api/media?remoteFilePath=${scena.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block space-y-3 cursor-pointer"
                                >
                                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-neutral-800 group-hover:border-red-600 transition-all duration-300">
                                        <img
                                            src={`${API_URL}/api/uploaded-images${scena.urlSlika}`}
                                            alt={scena.naziv || "Scena"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <h3 className="text-base font-medium text-neutral-200 group-hover:text-red-500 transition-colors">
                                        {scena.naziv || "Scena"}
                                    </h3>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* LINIJA RAZDVAJANJA AKO POSTOJE OBE SEKCIJE */}
                {scene.length > 0 && obicniMaterijali.length > 0 && (
                    <hr className="border-neutral-800 my-8" />
                )}

                {/* 2. SEKCIJA: MATERIJALI KURSA (Oblik pilule/dugmadi sa slike) */}
                <div className="space-y-6 text-center">
                    <h2 className="text-2xl font-bold tracking-wider text-white uppercase">
                        Materijali Kursa
                    </h2>

                    {obicniMaterijali.length > 0 ? (
                        <div className="flex flex-col items-center space-y-3 max-w-xl mx-auto">
                            {obicniMaterijali.map((materijal) => (
                                <a
                                    key={materijal.id}
                                    href={`${API_URL}/api/media?remoteFilePath=${materijal.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 px-6 rounded-full border border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 hover:border-red-600 text-neutral-200 text-sm font-medium transition-all duration-200 shadow-sm"
                                >
                                    {materijal.naziv || materijal.url}
                                </a>
                            ))}
                        </div>
                    ) : (
                        scene.length === 0 && (
                            <p className="text-neutral-500 text-sm">
                                Nema dostupnih materijala za ovaj kurs.
                            </p>
                        )
                    )}
                </div>

            </div>
        </div>
    );
};

export default KursPlayer;