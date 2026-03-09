import React, { useState } from "react";

interface ContentSection {
  id: string;
  label: string;
  description: string;
  fields: { key: string; label: string; type: "text" | "textarea"; value: string }[];
}

const initialSections: ContentSection[] = [
  {
    id: "hero",
    label: "Hero sekcija",
    description: "Glavni naslov i podnaslov na početnoj strani",
    fields: [
      { key: "heroTitle", label: "Naslov", type: "text", value: "STUDIO 27" },
      { key: "heroSubtitle", label: "Podnaslov", type: "text", value: "Profesionalna 3D obuka za kreativce" },
      { key: "heroCta", label: "Tekst dugmeta", type: "text", value: "Pogledaj kurseve" },
    ],
  },
  {
    id: "kursevi",
    label: "Sekcija kurseva",
    description: "Naslovi i opisi sekcije kurseva",
    fields: [
      { key: "kurseviTitle", label: "Naslov sekcije", type: "text", value: "NAŠI KURSEVI" },
      { key: "kurseviSubtitle", label: "Podnaslov", type: "textarea", value: "Izaberite kurs koji vam odgovara i započnite svoje putovanje u svetu 3D dizajna." },
    ],
  },
  {
    id: "prednosti",
    label: "Prednosti obuke",
    description: "Tekst sekcije sa prednostima",
    fields: [
      { key: "prednostiTitle", label: "Naslov", type: "text", value: "PREDNOSTI OBUKE" },
      { key: "prednost1", label: "Prednost 1 — naslov", type: "text", value: "KONTINUIRANO AŽURIRANJE INFORMACIJA" },
      { key: "prednost1Opis", label: "Prednost 1 — opis", type: "textarea", value: "Besplatna ažuriranja i dopune za sve koji su kupili kurs." },
      { key: "prednost2", label: "Prednost 2 — naslov", type: "text", value: "PODRŠKA ZA SVA PITANJA" },
      { key: "prednost2Opis", label: "Prednost 2 — opis", type: "textarea", value: "Pristup privatnom studentskom chatu sa mentorom." },
    ],
  },
  {
    id: "onama",
    label: "O nama",
    description: "Sadržaj sekcije 'O nama'",
    fields: [
      { key: "onamaTitle", label: "Naslov", type: "text", value: "O NAMA" },
      { key: "onamaText", label: "Tekst", type: "textarea", value: "Studio 27 je osnovan sa ciljem da pruži pristupačnu i kvalitetnu 3D obuku svima koji žele da unaprede svoje veštine." },
    ],
  },
  {
    id: "kontakt",
    label: "Kontakt informacije",
    description: "Kontakt podaci na sajtu",
    fields: [
      { key: "email", label: "Email", type: "text", value: "info@studio27.rs" },
      { key: "telefon", label: "Telefon", type: "text", value: "+381 11 123 4567" },
      { key: "adresa", label: "Adresa", type: "text", value: "Beograd, Srbija" },
    ],
  },
];

export default function ContentEditor() {
  const [sections, setSections] = useState(initialSections);
  const [saved, setSaved] = useState<string | null>(null);

  const updateField = (sectionId: string, fieldKey: string, value: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) => (f.key === fieldKey ? { ...f, value } : f)),
            }
          : s
      )
    );
  };

  const handleSave = (sectionId: string) => {
    setSaved(sectionId);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-5 border-b border-neutral-800/60">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Sistem</p>
        <h1 className="text-2xl font-bold text-white">Sadržaj sajta</h1>
        <p className="text-sm text-neutral-500 mt-1">Ažurirajte tekstove i opise na klijentskoj strani</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">{section.label}</h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">{section.description}</p>
              </div>
              <button
                onClick={() => handleSave(section.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  saved === section.id
                    ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30"
                    : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 border border-neutral-700"
                }`}
              >
                {saved === section.id ? "✓ Sačuvano" : "Sačuvaj"}
              </button>
            </div>

            <div className="p-5 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    {field.label}
                  </label>
                  {field.type === "text" ? (
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(section.id, field.key, e.target.value)}
                      className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600"
                    />
                  ) : (
                    <textarea
                      value={field.value}
                      onChange={(e) => updateField(section.id, field.key, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600 resize-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
