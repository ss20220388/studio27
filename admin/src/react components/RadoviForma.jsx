import React, { useState } from "react";

export default function RadoviForma({ sviKursevi = [], API_URL, accessToken }) {
    const [kursId, setKursId] = useState("");
    const [ime, setIme] = useState("");
    const [prezime, setPrezime] = useState("");
    const [files, setFiles] = useState([]);

    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState("");

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!kursId) return alert("Molimo izaberite kurs!");
        if (!ime.trim() || !prezime.trim()) return alert("Molimo unesite ime i prezime!");
        if (files.length === 0) return alert("Molimo izaberite bar jednu sliku!");

        setLoading(true);
        let uspesno = 0;
        let neuspesno = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setStatusText(`Slanje slika (${i + 1}/${files.length})...`);

            try {
                // -------------------------------------------------------------
                // 1. Upload fajla (ZA MULTIPART/FORM-DATA NE STAVLJATI Content-Type!)
                // -------------------------------------------------------------
                const formData = new FormData();
                formData.append("file", file);

                const uploadHeaders = {};
                if (accessToken) {
                    uploadHeaders["Authorization"] = `Bearer ${accessToken}`;
                }

                const uploadRes = await fetch(`${API_URL}/api/upload-local`, {
                    method: "POST",
                    headers: uploadHeaders,
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error(`Upload fajla ${file.name} nije uspeo (Status: ${uploadRes.status}).`);

                const uploadData = await uploadRes.json();
                const filename = uploadData.filename || uploadData.file || uploadData.name;
                const finalSlikaUrl = `/uploads/${filename}`;

                // Zajednička zaglavlja za JSON pozive
                const jsonHeaders = {
                    "Content-Type": "application/json",
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                };

                // -------------------------------------------------------------
                // 2. Upis slike u bazu (/api/dodajsliku)
                // -------------------------------------------------------------
                const slikaRes = await fetch(`${API_URL}/api/dodajsliku`, {
                    method: "POST",
                    headers: jsonHeaders,
                    credentials: "include",
                    body: JSON.stringify({ url: finalSlikaUrl }),
                });

                if (!slikaRes.ok) throw new Error("Upis slike u bazu nije uspeo.");

                const slikaData = await slikaRes.json();
                // Na osnovu tvoje backend slike, ključ u mapi je "idSlika"
                const slikaId = slikaData.idSlika || slikaData.id;

                if (!slikaId) throw new Error("Bekend nije vratio idSlika.");

                // -------------------------------------------------------------
                // 3. Povezivanje rada sa studentom i kursom (/api/addRad)
                // -------------------------------------------------------------
                const radRes = await fetch(`${API_URL}/api/addRad`, {
                    method: "POST",
                    headers: jsonHeaders,
                    credentials: "include",
                    body: JSON.stringify({
                        kursId: Number(kursId),
                        slikaId: Number(slikaId),
                        ime: ime.trim(),
                        prezime: prezime.trim(),
                    }),
                });

                if (!radRes.ok) throw new Error("Upis rada studenta nije uspeo.");

                uspesno++;
            } catch (err) {
                console.error(`Greška za fajl ${file.name}:`, err);
                neuspesno++;
            }
        }

        setLoading(false);
        setStatusText("");

        if (neuspesno === 0) {
            alert(`Uspešno dodato svih ${uspesno} rada/radova!`);
            setFiles([]);
            setIme("");
            setPrezime("");
            setKursId("");
            e.target.reset();
        } else {
            alert(`Obrada završena. Uspešno: ${uspesno}, Neuspešno: ${neuspesno}`);
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {/* Izbor kursa */}
                <div>
                    <label htmlFor="kursSelect" className="block text-sm font-semibold text-zinc-300 mb-2">
                        Izaberite kurs <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="kursSelect"
                        value={kursId}
                        onChange={(e) => setKursId(e.target.value)}
                        disabled={loading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <option value="" className="bg-zinc-900 text-zinc-400">
                            -- Izaberite kurs --
                        </option>
                        {sviKursevi.map((kurs) => {
                            // Proveravamo sve moguće nazive za ID
                            const id = kurs.id ?? kurs.idKurs ?? kurs.id_kurs ?? kurs.kursId;
                            const naziv = kurs.naziv ?? kurs.ime ?? kurs.naslov;

                            return (
                                <option key={id} value={id}>
                                    {naziv}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Ime i Prezime */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="imeInput" className="block text-sm font-semibold text-zinc-300 mb-2">
                            Ime <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="imeInput"
                            value={ime}
                            onChange={(e) => setIme(e.target.value)}
                            disabled={loading}
                            placeholder="Unesite ime"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="prezimeInput" className="block text-sm font-semibold text-zinc-300 mb-2">
                            Prezime <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="prezimeInput"
                            value={prezime}
                            onChange={(e) => setPrezime(e.target.value)}
                            disabled={loading}
                            placeholder="Unesite prezime"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* File Input */}
                <div>
                    <label htmlFor="fileInput" className="block text-sm font-semibold text-zinc-300 mb-2">
                        Slike radova (moguće odabrati više) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="file"
                        id="fileInput"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={loading}
                        className="w-full text-sm text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-950 file:text-red-400 hover:file:bg-red-900 hover:file:text-red-200 transition-colors cursor-pointer border border-zinc-700 rounded-xl bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                    />
                    {files.length > 0 && (
                        <p className="text-xs text-zinc-400 mt-2">
                            Odabrano fajlova: <span className="text-zinc-200 font-semibold">{files.length}</span>
                        </p>
                    )}
                </div>

                {/* Upload Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? statusText : "Dodaj radove"}
                    </button>
                </div>
            </form>
        </div>
    );
}