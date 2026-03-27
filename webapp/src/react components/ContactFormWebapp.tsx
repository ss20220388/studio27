import React, { useEffect, useState } from 'react'

type Props = {
    publicApiUrl: string
}

type UserData = {
    ime?: string
    prezime?: string
    email?: string
    brojTelefona?: string
}

const ContactFormWebapp: React.FC<Props> = ({ publicApiUrl }) => {
    const [user, setUser] = useState<UserData | null>(null)
    const [naslov, setNaslov] = useState('')
    const [poruka, setPortuka] = useState('')
    const [telefon, setTelefon] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        console.log('ContactForm mounted, publicApiUrl:', publicApiUrl)
        
        // Preuzmi korisnikove podatke
        const authUrl = `${publicApiUrl}/api/auth/me`
        console.log('Fetching from:', authUrl)
        
        fetch(authUrl, { 
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(r => {
                console.log('Auth response status:', r.status, r.statusText)
                console.log('Response headers:', {
                    'content-type': r.headers.get('content-type'),
                    'content-length': r.headers.get('content-length')
                })
                return r.json().catch(() => null)
            })
            .then(u => {
                console.log('Parsed user data:', u)
                console.log('User data keys:', u ? Object.keys(u) : 'null')
                console.log('brojTelefona value:', u?.brojTelefona)
                console.log('telefon value:', u?.telefon)
                if (u && typeof u === 'object' && !u.error) {
                    console.log('User set successfully')
                    setUser(u)
                    // Ako korisnik ima broj, postavi ga
                    // Pokušaj i brojTelefona i telefon, jer može biti bilo koji ključ
                    const phoneNumber = u.brojTelefona || u.telefon || u.phone || ''
                    console.log('Final phone number to set:', phoneNumber)
                    if (phoneNumber) {
                        setTelefon(phoneNumber)
                    }
                } else {
                    console.log('User is null or has error')
                    setUser(null)
                }
            })
            .catch((err) => {
                console.error('Auth fetch error:', err)
                setUser(null)
            })
            .finally(() => {
                console.log('Auth fetch completed')
                setLoading(false)
            })
    }, [publicApiUrl])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!naslov.trim() || !poruka.trim()) {
            alert('Popunite sva polja!')
            return
        }

        // Proverim da li ima telefona
        const finalTelefon = telefon.trim() || user?.brojTelefona || ''
        if (!finalTelefon) {
            alert('Molimo unesite broj telefona!')
            return
        }

        const fullName = `${user?.ime || ''} ${user?.prezime || ''}`.trim()
        const email = user?.email || ''

        // Formatiraj poruku za WhatsApp
        const whatsappMessage = `Ime: ${fullName}%0AEmail: ${email}%0ATelefon: ${finalTelefon}%0ANaslov: ${naslov}%0APorukaッ: ${poruka}`

        // Admin WhatsApp broj
        const adminNumber = '381612563121'
        const whatsappUrl = `https://wa.me/${adminNumber}?text=${whatsappMessage}`

        window.open(whatsappUrl, '_blank')

        // Resetuj formu
        setNaslov('')
        setPortuka('')
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 3000)
    }

    if (loading) {
        return <div className="text-neutral-400">Učitavanje...</div>
    }

    // Prikaži formu čak i ako korisnik nije preuzet, ali sa praznim poljima
    const displayUser = user || {
        ime: '',
        prezime: '',
        email: '',
        brojTelefona: ''
    }

    const fullName = `${displayUser.ime || ''} ${displayUser.prezime || ''}`.trim()

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prikazane informacije (samo za prikaz, nisu editable) */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 space-y-2">
                <div>
                    <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                        Ime i prezime
                    </label>
                    <div className="text-sm text-neutral-300">{fullName || '(nije dostupno)'}</div>
                </div>
                <div>
                    <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                        Email
                    </label>
                    <div className="text-sm text-neutral-300">{displayUser.email || '(nije dostupno)'}</div>
                </div>
                <div>
                    <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                        Telefon
                    </label>
                    <input
                        type="text"
                        value={telefon}
                        onChange={(e) => setTelefon(e.target.value)}
                        placeholder="Unesite vaš broj telefona"
                        className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600"
                    />
                </div>
                {!user && (
                    <div className="text-xs text-yellow-600 bg-yellow-900/20 border border-yellow-900/50 rounded p-2 mt-2">
                        ⚠ Neke informacije nisu dostupne. Pokušajte da se vratite na stranicu.
                    </div>
                )}
            </div>

            {/* Naslov i poruka koje korisnik unosi */}
            <div>
                <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Naslov
                </label>
                <input
                    type="text"
                    value={naslov}
                    onChange={(e) => setNaslov(e.target.value)}
                    className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600"
                    placeholder="Unesite naslov poruke"
                />
            </div>

            <div>
                <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Poruka
                </label>
                <textarea
                    value={poruka}
                    onChange={(e) => setPortuka(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all duration-200 placeholder-neutral-600 resize-none"
                    placeholder="Unesite vašu poruku"
                />
            </div>

            <button
                type="submit"
                className="w-full px-5 py-2.5 rounded-lg bg-red-900 hover:bg-red-800 text-white text-sm font-medium transition-colors duration-200 shadow-lg shadow-red-900/20"
            >
                Pošalji na WhatsApp
            </button>

            {submitted && (
                <div className="text-sm text-green-400 text-center bg-green-900/20 border border-green-900/50 rounded-lg py-2">
                    ✓ Poruka je poslata!
                </div>
            )}
        </form>
    )
}

export default ContactFormWebapp
