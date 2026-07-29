import React, { useState, useEffect } from "react";

import CourseList from "./CourseList";
import CourseDetail from "./CourseDetail";
import CourseModals from "./CourseModals";

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
  sadrzaj: string | null;
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


export default function CoursesPage({accesToken}: {accesToken: string | null}) {
  const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";
  
  const getImageUrl = (slikaUrl: string | undefined): string | null => {
    if (!slikaUrl) return null;
    if (slikaUrl.startsWith("http")) return slikaUrl;
    const cleanUrl = slikaUrl.startsWith("/") ? slikaUrl.substring(1) : slikaUrl;
    return `${API_URL}/api/uploaded-images${cleanUrl}`;
  };
  
  const [kursevi, setKursevi] = useState<Kurs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKurs, setSelectedKurs] = useState<Kurs | null>(null);
  const [expandedLekcija, setExpandedLekcija] = useState<number | null>(null);
  const [showAddLekcija, setShowAddLekcija] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState<number | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string } | null>(null);
  const [addLekcijaForm, setAddLekcijaForm] = useState({ naziv: "", opis: "" });
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showDeleteCourse, setShowDeleteCourse] = useState(false);
  const [courseToEditOrDelete, setCourseToEditOrDelete] = useState<Kurs | null>(null);

  const fetchKursevi = async () => {
    try {
      setLoading(true);
      setError(null);
      let endpoint = `${API_URL}/api/kursevi-sa-lekcijama`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
      });
      
      if (response.status === 403) {
        endpoint = `${API_URL}/api/kursevi`;
        const fallbackResponse = await fetch(endpoint, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!fallbackResponse.ok) throw new Error(`Greška pri učitavanju kurseva: ${fallbackResponse.status}`);
        const fallbackData = await fallbackResponse.json();
        setKursevi(fallbackData.kursevi || fallbackData || []);
        setLoading(false);
        return;
      }
      
      if (!response.ok) throw new Error(`Greška pri učitavanju kurseva: ${response.status}`);
      
      const data = await response.json();
      const kurseviArray = data.kursevi || data || [];
      setKursevi(kurseviArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri učitavanju kurseva");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKursevi();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in" style={{paddingInline:"20px"}}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-800/60">
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Upravljanje</p>
            <h1 className="text-2xl font-bold text-white">Kursevi</h1>
            <p className="text-sm text-neutral-500 mt-1">Učitavanje...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in" style={{paddingInline:"20px"}}>
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CourseModals
        showAddModal={showAddCourse}
        setShowAddModal={setShowAddCourse}
        showEditModal={showEditCourse}
        setShowEditModal={setShowEditCourse}
        showDeleteModal={showDeleteCourse}
        setShowDeleteModal={setShowDeleteCourse}
        selectedKurs={courseToEditOrDelete}
        onRefresh={fetchKursevi}
        setSelectedKurs={setSelectedKurs} 
        API_URL={API_URL}
        accesToken={accesToken}
      />

      {!selectedKurs ? (
        <CourseList 
          kursevi={kursevi}
          getImageUrl={getImageUrl}
          onSelectKurs={setSelectedKurs}
          onAddCourseClick={() => setShowAddCourse(true)}
          onEditCourseClick={(kurs, e) => {
            e.stopPropagation();
            setCourseToEditOrDelete(kurs);
            setShowEditCourse(true);
          }}
          onDeleteCourseClick={(kurs, e) => {
            e.stopPropagation();
            setCourseToEditOrDelete(kurs);
            setShowDeleteCourse(true);
          }}
        />
      ) : (
        <CourseDetail 
          selectedKurs={selectedKurs}
          setSelectedKurs={setSelectedKurs}
          expandedLekcija={expandedLekcija}
          setExpandedLekcija={setExpandedLekcija}
          showAddLekcija={showAddLekcija}
          setShowAddLekcija={setShowAddLekcija}
          showAddVideo={showAddVideo}
          setShowAddVideo={setShowAddVideo}
          previewVideo={previewVideo}
          setPreviewVideo={setPreviewVideo}
          addLekcijaForm={addLekcijaForm}
          setAddLekcijaForm={setAddLekcijaForm}
          accesToken={accesToken}
          API_URL={API_URL}
          onEditCourseClick={(kurs: any, e: any) => {
            e.stopPropagation();
            setCourseToEditOrDelete(kurs);
            setShowEditCourse(true);
          }}
          onDeleteCourseClick={(kurs: any, e: any) => {
            e.stopPropagation();
            setCourseToEditOrDelete(kurs);
            setShowDeleteCourse(true);
          }}
        />
      )}
    </>
  );
}

