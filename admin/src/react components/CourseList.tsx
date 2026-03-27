import React from "react";


interface Kurs {
  id: number;
  naziv: string;
  opis: string;
  cena: number;
  slikaUrl: string;
  brojStudenata: number;
  trajanje: number;
  glavniKurs: string | null;
  komentarGore: string | null;
  komentarSredina: string | null;
  komentarDole: string | null;
  lekcije: Lekcija[];
}
interface Video {
  id: number;
  naziv: string;
  trajanje: string;
  url: string;
}

interface Lekcija {
  lekcijaId: number;
  naziv: string;
  opis: string;
  videoUrls: string[];
}

export default function CourseList({
  kursevi,
  getImageUrl,
  onSelectKurs,
  onAddCourseClick,
  onEditCourseClick,
  onDeleteCourseClick
}: {
  kursevi: Kurs[];
  getImageUrl: (url: string | undefined) => string | null;
  onSelectKurs: (kurs: Kurs) => void;
  onAddCourseClick: () => void;
  onEditCourseClick: (kurs: Kurs, e: React.MouseEvent) => void;
  onDeleteCourseClick: (kurs: Kurs, e: React.MouseEvent) => void;
}) {
  return (
    <div className="space-y-8 animate-fade-in" style={{paddingInline:"20px"}}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
          <h1 className="text-2xl font-bold text-white">Kursevi</h1>
          <p className="text-sm text-neutral-500 mt-1">{kursevi.length} aktivnih kurseva</p>
        </div>
        <div>
          <button onClick={onAddCourseClick} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors">
            + Dodaj kurs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
        {kursevi.map((kurs) => (
          <div
            key={kurs.id}
            onClick={() => onSelectKurs(kurs)}
            className="group bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all duration-200 cursor-pointer flex flex-col"
          >
            {/* Course image */}
            <div className="h-36 bg-neutral-800 flex items-center justify-center relative overflow-hidden shrink-0">
              {getImageUrl(kurs.slikaUrl) ? (
                <img 
                  src={getImageUrl(kurs.slikaUrl)!} 
                  alt={kurs.naziv}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-linear-to-br from-red-900/20 to-transparent" />
              {!getImageUrl(kurs.slikaUrl) && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-neutral-700">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              )}
              <span style={{padding:"10px"}} className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[11px] font-medium text-white">
                {(kurs.lekcije?.length || 0)} lekcija
              </span>
            </div>

            <div className="p-4 flex flex-col flex-1" style={{paddingInline:"20px",paddingBlock:"10px"}}>
              <h3 className="font-semibold text-white text-sm group-hover:text-red-400 transition-colors line-clamp-1">
                {kurs.naziv}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{kurs.glavniKurs || kurs.opis}</p>
              
              <div className="mt-auto pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {(kurs.cena || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">RSD</span>
                  </span>
                  <span className="text-xs text-neutral-400">
                    {kurs.trajanje ? `${kurs.trajanje} dana` : ''}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {(kurs.brojStudenata || 0)}
                  </span>
                </div>
                
                
              </div>
            </div>
          </div>

        ))}
      </div>
    </div>
  );
}