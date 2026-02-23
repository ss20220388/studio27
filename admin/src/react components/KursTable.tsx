import { set } from 'astro:schema';
import React, { useEffect, useState } from 'react'

type Props = {}
interface Lekcija {
    id: number;
    naziv: string;
    opis: string;
    videoUrl: string;
}
interface Kurs {
    id: number;
    naziv: string;
    opis: string;
    cena: number;
    slikaUrl: string;
    lekcije: Lekcija[];
}


const KursTable = (props: Props) => {
    const [kursevi, setKursevi] = useState<Kurs[]>([])
    const [active, setActive] = useState(false)
    const [currentKurs, setCurrentKurs] = useState<Kurs>()
    useEffect(() => {
        async function fetchKursevi() {
            try {
                const response = await fetch("/api/kursevi-sa-lekcijama")
                const data = await response.json();
                console.log(data);
                setKursevi(data);
            }
            catch (error) {
                console.log("Error fetching kursevi:", error);
            }
        }
        fetchKursevi();
    }, [])

    return (
        <div>
            <div className="container mx-auto p-6">
                <div className="overflow-x-auto rounded-lg shadow">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">

                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    <button className="flex items-center">
                                        Id
                                        <svg className="w-3 h-3 ml-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                                        </svg>
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">Naziv</th>
                                <th scope="col" className="px-6 py-3">Opis</th>
                                <th scope="col" className="px-6 py-3">Cena</th>
                                <th scope="col" className="px-6 py-3">Slika</th>
                                <th scope="col" className="px-6 py-3">Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                kursevi?.map((kurs,index) => (
                                    <React.Fragment key={index}>
                                        <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700" onClick={() => { setCurrentKurs(kurs); setActive(true) }}>
                                            <td className="px-6 py-4">{kurs?.id}</td>
                                            <td className="px-6 py-4">{kurs?.naziv}</td>
                                            <td className="px-6 py-4">{kurs?.opis}</td>
                                            <td className="px-6 py-4 text-green-500">{kurs?.cena} RSD</td>
                                            <td className="px-6 py-4">
                                                <img src="https://res.cloudinary.com/djv4xa6wu/image/upload/v1735722159/AbhirajK/Abhirajk5.webp" alt={kurs?.naziv} className="w-10 h-10 rounded-full" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-blue-500 hover:underline mr-2">Edit</button>
                                                <button className="text-red-500 hover:underline">Delete</button>
                                            </td>

                                        </tr>
                                        {active && currentKurs?.id === kurs.id && (
                                            <tr className="bg-gray-100 dark:bg-gray-800">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <h3 className="text-lg font-semibold mb-2">Lekcije:</h3>
                                                    <ul className="list-disc list-inside">
                                                        {kurs.lekcije.map((lekcija,index) => (
                                                            <li key={index} className="mb-1">
                                                                <p className="font-medium">{lekcija.naziv}</p>
                                                                <p className="text-sm text-gray-600">{lekcija.opis}</p>
                                                                <a href={lekcija.videoUrl} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Pogledaj video</a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            </tr>
                                        )}

                                    </React.Fragment>

                                ))
                            }


                        </tbody>
                    </table>

                </div>
            </div>
        </div>

    )
}

export default KursTable