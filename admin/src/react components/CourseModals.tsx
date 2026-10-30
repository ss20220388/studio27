import React, { useState, useEffect } from "react";
import { SharedModal } from "./SharedModal";
import PaketiKursa from "./PaketiKursa";
import { GlavnaSlikaPolje, SporedneSlikePolje, otpremiSliku, type PostojecaSlika } from "./SlikeKursa";




interface CourseModalsProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  selectedKurs: any;
  onRefresh?: () => void;
  setSelectedKurs?: (kurs: any) => void;
  API_URL: string;
  accesToken: string | null;
}

export default function CourseModals({
  showAddModal,
  setShowAddModal,
  showEditModal,
  setShowEditModal,
  showDeleteModal,
  setShowDeleteModal,
  selectedKurs,
  onRefresh,
  setSelectedKurs,
  API_URL,
  accesToken
}: CourseModalsProps) {

  const textAreaClass = "w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600 resize-y min-h-10";

  // Add Form State
  const [addForm, setAddForm] = useState({ naziv: "", opis: "", sadrzaj: "", cena: "", trajanje: "", glavniKurs: "", komentarGore: "", komentarSredina: "", komentarDole: "" });
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addSporedneSlike, setAddSporedneSlike] = useState<File[]>([]);
  // Edit Form State
  const [editForm, setEditForm] = useState({ naziv: "", opis: "", sadrzaj: "", cena: "", trajanje: "", glavniKurs: "", komentarGore: "", komentarSredina: "", komentarDole: "" });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSporedneSlike, setEditSporedneSlike] = useState<File[]>([]);

  const [trenutneSporedneSlike, setTrenutneSporedneSlike] = useState<PostojecaSlika[]>([]);
  const [zaBrisanje, setZaBrisanje] = useState<Set<number>>(new Set());
  const [cuvanje, setCuvanje] = useState(false);
  const [greska, setGreska] = useState("");

  const jsonHeaders = {
    "Content-Type": "application/json",
    ...(accesToken ? { Authorization: `Bearer ${accesToken}` } : {})
  };

  useEffect(() => {
    if (selectedKurs && showEditModal) {
      setEditForm({
        naziv: selectedKurs.naziv || "",
        opis: selectedKurs.opis || "",
        sadrzaj: selectedKurs.sadrzaj || "",
        cena: selectedKurs.cena?.toString() || "",
        trajanje: selectedKurs.trajanje?.toString() || "",
        glavniKurs: selectedKurs.glavniKurs || "",
        komentarGore: selectedKurs.komentarGore || "",
        komentarSredina: selectedKurs.komentarSredina || "",
        komentarDole: selectedKurs.komentarDole || ""
      });
      setEditFile(null);
      setEditSporedneSlike([]);
      setZaBrisanje(new Set());
      setGreska("");
      setTrenutneSporedneSlike([]);
      fetch(`${API_URL}/api/kursslika/${selectedKurs.id}`)
        .then((r) => (r.ok ? r.json() : { kursSlika: [] }))
        .then((d) => setTrenutneSporedneSlike(
          (d.kursSlika || []).map((s: any) => ({ idSlika: s.idSlika ?? s.slikaId, url: s.url }))
        ))
        .catch(() => setTrenutneSporedneSlike([]));
    }
  }, [selectedKurs, showEditModal]);

  // Upload sporednih slika i povezivanje sa kursom
  const dodajSporedneSlike = async (idKurs: number, fajlovi: File[]) => {
    for (const slika of fajlovi) {
      const url = await otpremiSliku(API_URL, accesToken, slika);
      const slikaRes = await fetch(`${API_URL}/api/dodajsliku`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ url })
      });
      if (!slikaRes.ok) throw new Error("Greška pri dodavanju slike u bazu.");
      const { idSlika } = await slikaRes.json();
      await fetch(`${API_URL}/api/dodajkursslika`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ idKurs, idSlika })
      });
    }
  };

  const handleAddSubmit = async () => {
    setCuvanje(true);
    setGreska("");
    try {
      const finalSlikaUrl = addFile ? await otpremiSliku(API_URL, accesToken, addFile) : "";

      const response = await fetch(`${API_URL}/api/dodaj-kurs`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          naziv: addForm.naziv,
          opis: addForm.opis,
          sadrzaj: addForm.sadrzaj,
          cena: parseFloat(addForm.cena) || 0,
          trajanje: parseInt(addForm.trajanje) || 0,
          slikaUrl: finalSlikaUrl,
          glavniKurs: addForm.glavniKurs,
          komentarGore: addForm.komentarGore,
          komentarSredina: addForm.komentarSredina,
          komentarDole: addForm.komentarDole
        })
      });
      if (!response.ok) throw new Error("Greška pri dodavanju kursa");

      const kurs = await response.json();
      await dodajSporedneSlike(kurs.id, addSporedneSlike);

      setShowAddModal(false);
      setAddForm({ naziv: "", opis: "", sadrzaj: "", cena: "", trajanje: "", glavniKurs: "", komentarGore: "", komentarSredina: "", komentarDole: "" });
      setAddFile(null);
      setAddSporedneSlike([]);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      console.error(e);
      setGreska(e?.message || "Greška pri dodavanju kursa");
    } finally {
      setCuvanje(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedKurs) return;
    setCuvanje(true);
    setGreska("");

    try {
      // Upload glavne slike ako je promenjena
      const finalSlikaUrl = editFile
        ? await otpremiSliku(API_URL, accesToken, editFile)
        : selectedKurs.slikaUrl || "";

      // Izmena kursa
      const response = await fetch(`${API_URL}/api/promeni-kurs/${selectedKurs.id}`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({
          naziv: editForm.naziv,
          opis: editForm.opis,
          sadrzaj: editForm.sadrzaj,
          cena: parseFloat(editForm.cena) || 0,
          trajanje: parseInt(editForm.trajanje) || 0,
          slikaUrl: finalSlikaUrl,
          glavniKurs: editForm.glavniKurs,
          komentarGore: editForm.komentarGore,
          komentarSredina: editForm.komentarSredina,
          komentarDole: editForm.komentarDole
        })
      });
      if (!response.ok) throw new Error("Greška pri izmeni kursa");

      // Brisanje označenih sporednih slika, pa dodavanje novih (stare ostaju)
      for (const idSlika of zaBrisanje) {
        await fetch(`${API_URL}/api/deletekursslika/${selectedKurs.id}/${idSlika}`, {
          method: "POST",
          headers: jsonHeaders
        });
      }
      await dodajSporedneSlike(selectedKurs.id, editSporedneSlike);

      setShowEditModal(false);
      setEditFile(null);
      setEditSporedneSlike([]);
      setZaBrisanje(new Set());

      if (onRefresh) onRefresh();

      if (setSelectedKurs) {
        setSelectedKurs({
          ...selectedKurs,
          naziv: editForm.naziv,
          opis: editForm.opis,
          sadrzaj: editForm.sadrzaj,
          cena: parseFloat(editForm.cena) || 0,
          trajanje: parseInt(editForm.trajanje) || 0,
          slikaUrl: finalSlikaUrl,
          glavniKurs: editForm.glavniKurs,
          komentarGore: editForm.komentarGore,
          komentarSredina: editForm.komentarSredina,
          komentarDole: editForm.komentarDole
        });
      }
    } catch (e: any) {
      console.error(e);
      setGreska(e?.message || "Greška pri izmeni kursa");
    } finally {
      setCuvanje(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedKurs) return;
    try {
      const response = await fetch(`${API_URL}/api/obrisi-kurs/${selectedKurs.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accesToken ? { "Authorization": `Bearer ${accesToken}` } : {})
        }
      });
      if (response.ok) {
        setShowDeleteModal(false);
        if (setSelectedKurs) setSelectedKurs(null);
        if (onRefresh) onRefresh();
      } else {
        console.error("Greška pri brisanju kursa");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <SharedModal open={showAddModal} onClose={() => setShowAddModal(false)} title="Dodaj novi kurs">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Naziv kursa</label>
            <textarea
              value={addForm.naziv}
              onChange={(e) => setAddForm({ ...addForm, naziv: e.target.value })}
              placeholder="Npr. React napredni kurs"
              rows={2}
              className={textAreaClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Opis</label>
            <textarea
              value={addForm.opis}
              onChange={(e) => setAddForm({ ...addForm, opis: e.target.value })}
              placeholder="Opis kursa..."
              rows={4}
              className={textAreaClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Sadržaj kursa</label>
            <textarea
              value={addForm.sadrzaj}
              onChange={(e) => setAddForm({ ...addForm, sadrzaj: e.target.value })}
              placeholder="Upišite sadržaj kursa kako treba da se prikaže na stranici"
              rows={8}
              className={textAreaClass}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Cena ($)</label>
              <input
                type="number"
                value={addForm.cena}
                onChange={(e) => setAddForm({ ...addForm, cena: e.target.value })}
                placeholder="Npr. 5000"
                className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Trajanje (dani)</label>
              <input
                type="number"
                value={addForm.trajanje}
                onChange={(e) => setAddForm({ ...addForm, trajanje: e.target.value })}
                placeholder="Npr. 30"
                className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Glavni kurs (preporučuje se)</label>
            <textarea
              value={addForm.glavniKurs}
              onChange={(e) => setAddForm({ ...addForm, glavniKurs: e.target.value })}
              placeholder="Npr. 3Ds Max + Corona Render"
              rows={2}
              className={textAreaClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Komentar gore</label>
              <textarea
                value={addForm.komentarGore}
                onChange={(e) => setAddForm({ ...addForm, komentarGore: e.target.value })}
                placeholder="Gornji naslov/komentar"
                rows={3}
                className={textAreaClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Komentar sredina</label>
              <textarea
                value={addForm.komentarSredina}
                onChange={(e) => setAddForm({ ...addForm, komentarSredina: e.target.value })}
                placeholder="Srednji opis"
                rows={3}
                className={textAreaClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Komentar dole</label>
              <textarea
                value={addForm.komentarDole}
                onChange={(e) => setAddForm({ ...addForm, komentarDole: e.target.value })}
                placeholder="Donji opis/tagovi"
                rows={3}
                className={textAreaClass}
              />
            </div>
          </div>
          <GlavnaSlikaPolje fajl={addFile} onFajl={setAddFile} />
          <SporedneSlikePolje nove={addSporedneSlike} onNove={setAddSporedneSlike} />
          {greska && <p className="text-xs text-red-400">{greska}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">Otkaži</button>
            <button onClick={handleAddSubmit} disabled={cuvanje} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors disabled:opacity-60">{cuvanje ? "Čuvanje..." : "Dodaj kurs"}</button>
          </div>
        </div>
      </SharedModal>

      <SharedModal open={showEditModal} onClose={() => setShowEditModal(false)} title="Izmeni kurs" wide>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-neutral-400 mb-2">Trenutno se menja: <span className="text-white font-bold">{selectedKurs?.naziv}</span></p>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Novi naziv</label>
            <textarea
              value={editForm.naziv}
              onChange={(e) => setEditForm({ ...editForm, naziv: e.target.value })}
              rows={2}
              className={textAreaClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Novi opis</label>
            <textarea
              value={editForm.opis}
              onChange={(e) => setEditForm({ ...editForm, opis: e.target.value })}
              rows={4}
              className={textAreaClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Sadržaj kursa</label>
            <textarea
              value={editForm.sadrzaj}
              onChange={(e) => setEditForm({ ...editForm, sadrzaj: e.target.value })}
              rows={8}
              className={textAreaClass}
              placeholder="Sadržaj kursa..."
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Nova cena (€)</label>
              <input
                type="number"
                value={editForm.cena}
                onChange={(e) => setEditForm({ ...editForm, cena: e.target.value })}
                className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Trajanje (dani)</label>
              <input
                type="number"
                value={editForm.trajanje}
                onChange={(e) => setEditForm({ ...editForm, trajanje: e.target.value })}
                className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 transition-all placeholder-neutral-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Glavni kurs (preporučuje se)</label>
            <textarea
              value={editForm.glavniKurs}
              onChange={(e) => setEditForm({ ...editForm, glavniKurs: e.target.value })}
              rows={2}
              className={textAreaClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Komentar gore</label>
              <textarea
                value={editForm.komentarGore}
                onChange={(e) => setEditForm({ ...editForm, komentarGore: e.target.value })}
                rows={3}
                className={textAreaClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Komentar sredina</label>
              <textarea
                value={editForm.komentarSredina}
                onChange={(e) => setEditForm({ ...editForm, komentarSredina: e.target.value })}
                rows={3}
                className={textAreaClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Komentar dole</label>
              <textarea
                value={editForm.komentarDole}
                onChange={(e) => setEditForm({ ...editForm, komentarDole: e.target.value })}
                rows={3}
                className={textAreaClass}
              />
            </div>
          </div>
          <GlavnaSlikaPolje trenutnaUrl={selectedKurs?.slikaUrl} fajl={editFile} onFajl={setEditFile} />
          <SporedneSlikePolje
            postojece={trenutneSporedneSlike}
            zaBrisanje={zaBrisanje}
            onZaBrisanje={setZaBrisanje}
            nove={editSporedneSlike}
            onNove={setEditSporedneSlike}
          />
          {selectedKurs?.id && <PaketiKursa kursId={selectedKurs.id} API_URL={API_URL} accesToken={accesToken} />}
          {greska && <p className="text-xs text-red-400">{greska}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">Otkaži</button>
            <button onClick={handleEditSubmit} disabled={cuvanje} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-60">{cuvanje ? "Čuvanje..." : "Sačuvaj izmene"}</button>
          </div>
        </div>
      </SharedModal>

      <SharedModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Obriši kurs">
        <div className="space-y-4">
          <p className="text-sm text-neutral-300">
            Da li ste sigurni da želite da obrišete kurs <span className="font-bold text-white">{selectedKurs?.naziv}</span>? Ova akcija je nepovratna.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">Otkaži</button>
            <button onClick={handleDeleteSubmit} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-900 hover:bg-red-800 transition-colors">Obriši kurs</button>
          </div>
        </div>
      </SharedModal>
    </>
  );
}