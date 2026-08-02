/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import BuyButton from "./BuyButton.jsx";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

export default function KursInfo({ kurs, accessToken }) {
  const [slike, setSlike] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [openSection, setOpenSection] = useState(null);

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

  const parseSekcije = (rawText) => {
    if (!rawText) return [];

    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const sekcije = [];
    let currentSekcija = null;

    lines.forEach((line) => {
      const cleanLine = line.replace(/[^a-zA-ZČĆŽŠĐčćžšđ]/g, "");
      const isALLCAPS = cleanLine.length > 0 && cleanLine === cleanLine.toUpperCase();

      if (isALLCAPS) {
        if (currentSekcija) {
          sekcije.push(currentSekcija);
        }
        currentSekcija = { naslov: line, stavke: [] };
      } else if (currentSekcija) {
        currentSekcija.stavke.push(line);
      } else {
        currentSekcija = { naslov: "SADRŽAJ KURSA", stavke: [line] };
      }
    });

    if (currentSekcija) {
      sekcije.push(currentSekcija);
    }

    return sekcije;
  };

  const rawSadrzaj = kurs?.sadrzajKursa || kurs?.sadrzaj;
  const sekcije = parseSekcije(rawSadrzaj);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <div id="detalje-kursa" className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* HEADER SECTION - TEMA SA DRUGE SLIKE */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEVO: Glavna slika i galerija */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl aspect-[4/3] sm:aspect-[5/4]">
              <img
                src={
                  activeImage ||
                  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80"
                }
                alt={kurs?.naziv || "Kurs preview"}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>

            {/* Galerija sličica sa narandžastim akcentom */}
            {slike.length > 0 && (
              <div className="grid grid-cols-4 gap-3 pt-2">
                {slike.map((slika) => (
                  <button
                    key={slika.idSlika}
                    onClick={() => setActiveImage(resolveImageSrc(slika.url))}
                    className={`relative overflow-hidden rounded-md border-2 aspect-square cursor-pointer transition-all ${
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

          {/* DESNO: Informacije o kursu po uzoru na sliku 2 */}
          <div className="flex flex-col justify-start space-y-6">
            <div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
                {kurs?.naziv || "Od 0 do prvog profesionalnog rendera"}
              </h2>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-200 mt-2">
                {kurs?.glavniKurs || "3Ds Max + Corona"}
              </p>
            </div>

            {/* Prikaz Cene */}
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {kurs?.cena ? `${kurs.cena} €` : "Javite nam se kako biste poceli sa slusanjem kursa!"}
              </div>
              {kurs?.cenaRSD && (
                <div className="text-lg font-semibold text-zinc-400">
                  {kurs.cenaRSD} RSD
                </div>
              )}
            </div>

            {/* Dugme za kupovinu */}
            {kurs?.cena ? (
              <div className="pt-2">
                <BuyButton kurs={kurs} />
              </div>
            ):<span className="text-sm text-zinc-400">Ovaj kurs se prati isključivo uzivo</span>}

            {/* Opisni tekst u dva paragrafa */}
            <div className="space-y-4 pt-2 text-zinc-300 text-sm sm:text-base leading-relaxed font-normal">
              <p>
                {kurs?.opis ||
                  "Kurs je osmišljen tako da uz svaki snimak imate zakačenu vežbu i propratne fajlove, sa kojima možete da radite uporedo - dok gledate snimak, a pristup snimcima je neograničen."}
              </p>
              <p>
                {kurs?.komentarSredina ||
                  "Jednom kada kupite kurs, možete snimke gledati kad god vama odgovara, uz podršku na privatnom chatu."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ACCORDION PROGRAM KURSA */}
      {sekcije.length > 0 && (
        <section className="border-t border-zinc-900 bg-zinc-950 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider mb-8">
              Sadržaj i Program Kursa
            </h2>

            <div className="space-y-4">
              {sekcije.map((sekcija, index) => {
                const isOpen = openSection === index;
                return (
                  <div
                    key={index}
                    className="bg-black border border-zinc-800 rounded-lg overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => sekcija.stavke.length > 0 && toggleSection(index)}
                      className="w-full flex items-center justify-between p-6 text-left cursor-pointer hover:bg-zinc-900/60 transition-colors"
                    >
                      <span className="text-lg sm:text-xl font-bold text-white tracking-wide uppercase">
                        {sekcija.naslov}
                      </span>

                      {sekcija.stavke.length > 0 && (
                        <span
                          className={`text-orange-500 font-bold text-xl transition-transform duration-300 ${
                            isOpen ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          ▼
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 pt-2 border-t border-zinc-900 bg-zinc-900/30 space-y-3">
                        {sekcija.stavke.map((stavka, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-start gap-3 text-zinc-300 text-sm sm:text-base leading-relaxed"
                          >
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{stavka}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}