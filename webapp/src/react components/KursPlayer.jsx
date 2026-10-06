import React, { useState } from "react";
import VideoPlayerHLS from "./VideoPlayerHLS";

// Poslovni WhatsApp broj (isti kao u kontakt formi na sajtu)
const WHATSAPP_BROJ = "381665934314";

const KursPlayer = ({ lekcije, token, API_URL, materijali }) => {
    const [selectedVideo, setSelectedVideo] = useState(
        lekcije?.[0]?.klipovi?.[0] || null
    );

    const [openLesson, setOpenLesson] = useState(lekcije?.[0]?.lekcijaId || null);

    // Razdvajanje materijala na scene (imaju urlSlika) i obične fajlove
    const scene = materijali?.filter((m) => m.urlSlika) || [];
    const obicniMaterijali = materijali?.filter((m) => !m.urlSlika) || [];

    // WhatsApp poruka unapred popunjena nazivom lekcije koju student trenutno gleda
    const trenutnaLekcija = lekcije?.find((l) =>
        l.klipovi?.some((k) => k.videoId === selectedVideo?.videoId)
    );
    const whatsappPoruka = trenutnaLekcija
        ? `Zdravo, imam pitanje u vezi lekcije "${trenutnaLekcija.naziv}".`
        : "Zdravo, imam pitanje u vezi kursa.";
    const whatsappLink = `https://wa.me/${WHATSAPP_BROJ}?text=${encodeURIComponent(whatsappPoruka)}`;

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

                    {/* WHATSAPP KONTAKT */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
                        <p className="text-sm text-neutral-300">
                            Imate pitanje? Pošaljite nam poruku
                        </p>
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] text-black text-sm font-semibold transition-colors duration-200 shrink-0"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Pošalji WhatsApp poruku
                        </a>
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
                {(() => {
                    if (obicniMaterijali.length === 0) {
                        return scene.length === 0 ? (
                            <p className="text-neutral-500 text-sm">
                                Nema dostupnih materijala za ovaj kurs.
                            </p>
                        ) : null;
                    }

                    // Grupisanje: grupe po tagu + posebna lista za materijale bez taga
                    const grupisaniMaterijali = obicniMaterijali.reduce((acc, item) => {
                        const tagKey = item.tag ? item.tag.trim() : null;
                        if (tagKey) {
                            if (!acc.grupe[tagKey]) {
                                acc.grupe[tagKey] = [];
                            }
                            acc.grupe[tagKey].push(item);
                        } else {
                            acc.bezTaga.push(item);
                        }
                        return acc;
                    }, { grupe: {}, bezTaga: [] });

                    return (
                        <div className="space-y-8 max-w-xl mx-auto">
                            {/* 1. Grupe sa tagovima */}
                            {Object.entries(grupisaniMaterijali.grupe).map(([tag, stavke]) => (
                                <div key={tag} className="space-y-3">
                                    <h3 className="text-lg font-semibold text-neutral-300 text-left border-b border-neutral-800 pb-1">
                                        {tag}
                                    </h3>
                                    <div className="flex flex-col items-center space-y-3">
                                        {stavke.map((materijal) => (
                                            <a
                                                key={materijal.id}
                                                href={`${API_URL}/api/media?remoteFilePath=${materijal.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 px-6 rounded-full border border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 hover:border-orange-500 text-neutral-200 text-sm font-medium transition-all duration-200 shadow-sm text-center"
                                            >
                                                {materijal.naziv || materijal.url}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* 2. Materijali bez taga (prikazuju se skroz dole) */}
                            {grupisaniMaterijali.bezTaga.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    {Object.keys(grupisaniMaterijali.grupe).length > 0 && (
                                        <h3 className="text-lg font-semibold text-neutral-400 text-left border-b border-neutral-800 pb-1">
                                            Ostali materijali
                                        </h3>
                                    )}
                                    <div className="flex flex-col items-center space-y-3">
                                        {grupisaniMaterijali.bezTaga.map((materijal) => (
                                            <a
                                                key={materijal.id}
                                                href={`${API_URL}/api/media?remoteFilePath=${materijal.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 px-6 rounded-full border border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 hover:border-orange-500 text-neutral-200 text-sm font-medium transition-all duration-200 shadow-sm text-center"
                                            >
                                                {materijal.naziv || materijal.url}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

            </div>
        </div>
    );
};

export default KursPlayer;