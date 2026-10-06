/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import BuyButton from "./BuyButton.jsx";
import DugmeKontakt from "./DugmeKontakt.jsx";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";
const APP_URL = import.meta.env.PUBLIC_APP_URL || "http://app.studio27.rs";

// Poslovni WhatsApp broj (isti kao u kontakt formi na sajtu)
const WHATSAPP_BROJ = "381665934314";

export default function KursInfo({ kurs, accessToken, isLoggedIn, hasPurchasedCourse }) {
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

  // WhatsApp poruka unapred popunjena nazivom kursa
  const whatsappPoruka = kurs?.naziv
    ? `Zdravo, imam pitanje u vezi kursa "${kurs.naziv}".`
    : "Zdravo, imam pitanje u vezi kursa.";
  const whatsappLink = `https://wa.me/${WHATSAPP_BROJ}?text=${encodeURIComponent(whatsappPoruka)}`;

  return (
    <div id="detalje-kursa" className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEVO: Glavna slika i galerija */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl min-w-[500px]">
              <img
                src={
                  activeImage ||
                  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80"
                }
                alt={kurs?.naziv || "Kurs preview"}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
          </div>

          {/* DESNO: Informacije o kursu */}
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
                {kurs?.cena ? `${kurs.cena} €` : "Javite nam se kako biste počeli sa slušanjem kursa!"}
              </div>
              {kurs?.cenaRSD && (
                <div className="text-lg font-semibold text-zinc-400">
                  {kurs.cenaRSD} RSD
                </div>
              )}
            </div>

            {/* Dugme za akciju: Pristupi ili Kupi */}
            <div className="pt-2">
              {hasPurchasedCourse ? (
                <div className="space-y-3">
                  <a
                    href={`${APP_URL}`}
                    className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center shadow-lg"
                  >
                    Pristupi web aplikaciji za gledanje kursa
                  </a>
                  <p className="text-sm font-medium text-zinc-400">
                    Već ste kupili ovaj kurs. Pristup snimcima je neograničen.
                  </p>
                </div>
              ) : kurs?.cena ? (
                <BuyButton kurs={kurs} />
              ) : (
                <DugmeKontakt />
              )}
            </div>

            {/* WhatsApp kontakt */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4">
              <p className="text-sm sm:text-base text-zinc-300 font-medium">
                Imate pitanje? Pošaljite nam poruku
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] text-black text-sm font-semibold transition-colors duration-200 shrink-0 sm:ml-auto"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Pošalji WhatsApp poruku
              </a>
            </div>

            {/* Opisni tekst */}
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
                          className={`text-[#550000] font-bold text-xl transition-transform duration-300 ${
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
                            <span className="text-[#550000] mt-1">•</span>
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