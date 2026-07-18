import React, { useState } from "react";

const MaterijaliForma = ({ fileInputRef, onSubmit, idKurs }) => {
    const [fileName, setFileName] = useState("");

    return (
        <div className="bg-transparent flex items-center justify-center p-6">
            <div
                className="w-full max-w-md rounded-xl bg-zinc-900 p-6 border border-zinc-800 shadow-xl"
            >
                <h2 className="text-xl font-semibold text-white mb-6">
                    Dodavanje materijala
                </h2>

                <div className="space-y-5">

                    <div>
                        <label className="text-sm text-zinc-400 block mb-2">
                            ID kursa
                        </label>

                        <div className="h-11 rounded-lg bg-zinc-800 border border-zinc-700 px-4 flex items-center text-white">
                            {idKurs}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-zinc-400 block mb-2">
                            Materijal
                        </label>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
                        >
                            Izaberi fajl
                        </button>

                        <span className="block mt-2 text-sm text-neutral-400">
                            {fileName || "Nije izabran fajl"}
                        </span>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip,.pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx"
                            hidden
                            onChange={(e) =>
                                setFileName("Postavljeni fajlovi")
                            }
                        />
                    </div>

                </div>

                <button
                    onClick={onSubmit}
                    className="mt-7 w-full rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700 transition"
                >
                    Sačuvaj materijal
                </button>
            </div>
        </div>
    );
};

export default MaterijaliForma;