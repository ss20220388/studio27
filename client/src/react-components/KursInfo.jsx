/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import BuyButton from "./BuyButton.jsx";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

export default function KursInfo({ kurs,accessToken }) {
  const [slike, setSlike] = useState([]);
  const [activeImage, setActiveImage] = useState("");

  const resolveImageSrc = (imagePath) => {
    if (!imagePath) return "";
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${API_URL}/api/uploaded-images${normalizedPath}`;
  };

  useEffect(() => {
    if (kurs?.slikaUrl) {
      setActiveImage(resolveImageSrc(kurs.slikaUrl));
    }
  }, [kurs?.slikaUrl]);

  useEffect(() => {
    async function fetchSlike() {
      if (kurs?.id) {
        try {
          const response = await fetch(`${API_URL}/api/kursslika/${kurs.id}`);
          if (response.ok) {
            const data = await response.json();
            setSlike(data.kursSlika || []);
          }
        } catch (error) {
          console.error("Greška pri dohvatanju slika", error);
        }
      }
    }
    fetchSlike();
  }, [kurs?.id]);

  return (
    <div className="min-h-screen bg-[#18181b] text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* HEADER SECTION - HERO & DETAILS */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* LEVO: Glavna slika i galerija */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl aspect-[4/3] sm:aspect-square">
              <img
                src={activeImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80"}
                alt={kurs?.naziv || "Kurs preview"}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>

            {/* Mala galerija slika ako postoje dodatne slike */}
            {slike.length > 0 && (
              <div className="grid grid-cols-4 gap-3 pt-2">
                {slike.map((slika) => (
                  <button
                    key={slika.idSlika}
                    onClick={() => setActiveImage(resolveImageSrc(slika.url))}
                    className={`relative overflow-hidden rounded-xl border-2 aspect-square cursor-pointer transition-all ${
                      activeImage === resolveImageSrc(slika.url)
                        ? "border-orange-500 scale-95"
                        : "border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={resolveImageSrc(slika.url)}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DESNO: Informacije o kursu */}
          <div className="flex flex-col justify-start pt-2 space-y-6">
            {/* Naslov */}
            <div>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white uppercase leading-none">
                {kurs?.naziv || "LIGHTSTART3D"}
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base mt-2 font-light">
                {kurs?.podnaslov || "3D visualization course from scratch to pro in recording"}
              </p>
            </div>

            {/* Cene */}
            <div className="space-y-1">
              <div className="text-3xl font-black text-white tracking-wide">
                {kurs?.cena ? `${kurs.cena} €` : "337$"}
              </div>
              <div className="text-zinc-500 text-sm font-medium">
                {kurs?.softveri || "3DsMAX + Corona renderer"}
              </div>
              {kurs?.cenaRSD && (
                <div className="text-lg font-bold text-zinc-300 pt-2">
                  {kurs.cenaRSD} RSD
                </div>
              )}
            </div>

            {/* Buy button */}
            <div className="pt-2">
              <BuyButton kurs={kurs} />
            </div>

            {/* Opisne kartice / Tekst */}
            <div className="space-y-4 pt-4 text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
              <p>
                {kurs?.opis ||
                  "The course is designed for one and a half to two months of intensive study with 2-3 theoretical classes and practice at least three times a week."}
              </p>
              <p className="text-zinc-400">
                {kurs?.dodatniOpis ||
                  "The course is aimed at mastering the profession of a 3D visualizer from scratch to the first results. The course program will give you a complete understanding of the profession and teach you how to cope with any tasks."}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* MODULI / SADRŽAJ KURSA */}
      {Array.isArray(kurs?.lekcije) && kurs.lekcije.length > 0 && (
        <section className="border-t border-zinc-800 bg-zinc-900/50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider mb-8">
              Program Kursa
            </h2>

            <div className="space-y-4">
              {kurs.lekcije.map((lekcija, idx) => (
                <details
                  key={lekcija.id || idx}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none select-none">
                    <span className="text-lg font-semibold text-zinc-200 group-hover:text-white">
                      {lekcija.naziv || `Lekcija ${idx + 1}`}
                    </span>
                    <span className="text-zinc-500 group-open:rotate-180 transition-transform duration-200">
                      ▼
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50 pt-4">
                    {lekcija.opis || "Nema dostupnog opisa za ovu lekciju."}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}