import React, { useState } from 'react'

/**
 * @typedef {Object} RegisterPayload
 * @property {string} email
 * @property {string} password
 * @property {string} ime
 * @property {string} prezime
 * @property {string} [brojTelefona]
 */

/**
 * @typedef {Object} RegisterFormProps
 * @property {(payload: RegisterPayload) => void} onSubmit
 * @property {boolean} loading
 * @property {string | null} error
 * @property {string | null} success
 * @property {() => void} onSwitchToLogin
 */

/** @type {React.FC<RegisterFormProps>} */
const RegisterForm = ({
    onSubmit,
    loading,
    error,
    success,
    onSwitchToLogin,
}) => {
    const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";
    
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [ime, setIme] = useState('')
    const [prezime, setPrezime] = useState('')
    const [brojTelefona, setBrojTelefona] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [validationErrors, setValidationErrors] = useState({})

    /**
     * Validira sve polje registracije
     * @returns {boolean} true ako su sva polja validna
     */
    const validateForm = () => {
        const errors = {}

        // Validacija imena
        if (!ime.trim()) {
            errors.ime = 'Ime je obavezno'
        } else if (ime.trim().length < 2) {
            errors.ime = 'Ime mora sadržavati najmanje 2 karaktera'
        }

        // Validacija prezimena
        if (!prezime.trim()) {
            errors.prezime = 'Prezime je obavezno'
        } else if (prezime.trim().length < 2) {
            errors.prezime = 'Prezime mora sadržavati najmanje 2 karaktera'
        }

        // Validacija emaila
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email.trim()) {
            errors.email = 'E-pošta je obavezna'
        } else if (!emailRegex.test(email.trim())) {
            errors.email = 'Unesite validnu e-poštu'
        }

        // Validacija lozinke
        if (!password) {
            errors.password = 'Lozinka je obavezna'
        } else if (password.length < 8) {
            errors.password = 'Lozinka mora sadržavati najmanje 8 karaktera'
        } else if (!/[A-Z]/.test(password)) {
            errors.password = 'Lozinka mora sadržavati najmanje jedno veliko slovo'
        } else if (!/[0-9]/.test(password)) {
            errors.password = 'Lozinka mora sadržavati najmanje jedan broj'
        }

        // Validacija potvrde lozinke
        if (!confirmPassword) {
            errors.confirmPassword = 'Potvrda lozinke je obavezna'
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Lozinke se ne poklapaju'
        }

        // Validacija terms checkbox-a
        if (!termsAccepted) {
            errors.terms = 'Morate prihvatiti uslove korišćenja i politiku privatnosti'
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleOpenTerms = (docType) => {
        try {
            const fileName = docType === 'terms' ? 'Analiticka - formule.pdf' : 'Analiticka - formule.pdf'
            const filePath = `/pravila/${fileName}`
            const url = `${API_URL}/api/media?remoteFilePath=${encodeURIComponent(filePath)}`
            window.open(url, '_blank')
        } catch (err) {
            console.error('Greška pri otvaranju dokumenta:', err)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const payload = {
            email: email.trim(),
            password,
            ime: ime.trim(),
            prezime: prezime.trim(),
            brojTelefona: brojTelefona.trim() || undefined,
        }

        onSubmit(payload)
    }

    return (
        <>
            <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21c-2.676 0-5.216-.584-7.499-1.882z" />
                    </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-black">Registruj se</h2>
                <p className="text-sm text-gray-600">Napravite novi nalog</p>
            </div>

            {error && <p className="mb-4 text-sm text-red-600 text-center font-medium">{error}</p>}
            {success && <p className="mb-4 text-sm text-green-600 text-center font-medium">{success}</p>}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="regFirstName" className="mb-2 block text-sm font-medium text-gray-700">
                            Ime
                        </label>
                        <input
                            type="text"
                            id="regFirstName"
                            value={ime}
                            onChange={(e) => setIme(e.target.value)}
                            className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${
                                validationErrors.ime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'
                            }`}
                            placeholder="Petar"
                            required
                        />
                        {validationErrors.ime && <p className="mt-1 text-xs text-red-600">{validationErrors.ime}</p>}
                    </div>
                    <div>
                        <label htmlFor="regLastName" className="mb-2 block text-sm font-medium text-gray-700">
                            Prezime
                        </label>
                        <input
                            type="text"
                            id="regLastName"
                            value={prezime}
                            onChange={(e) => setPrezime(e.target.value)}
                            className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${
                                validationErrors.prezime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'
                            }`}
                            placeholder="Petrovic"
                            required
                        />
                        {validationErrors.prezime && <p className="mt-1 text-xs text-red-600">{validationErrors.prezime}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="regPhone" className="mb-2 block text-sm font-medium text-gray-700">
                        Broj telefona (opciono)
                    </label>
                    <input
                        type="text"
                        id="regPhone"
                        value={brojTelefona}
                        onChange={(e) => setBrojTelefona(e.target.value)}
                        className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                        placeholder="+381 60 1234567"
                    />
                </div>

                <div>
                    <label htmlFor="regEmail" className="mb-2 block text-sm font-medium text-gray-700">
                        E-pošta
                    </label>
                    <input
                        type="email"
                        id="regEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${
                            validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'
                        }`}
                        placeholder="petar.petrovic@example.com"
                        required
                    />
                    {validationErrors.email && <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>}
                </div>

                <div>
                    <label htmlFor="regPassword" className="mb-2 block text-sm font-medium text-gray-700">
                        Lozinka <span className="text-xs text-gray-500">Min 8 karaktera, 1 veliko slovo, 1 broj</span>
                    </label>
                    <input
                        type="password"
                        id="regPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${
                            validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'
                        }`}
                        placeholder="Unesite lozinku"
                        required
                    />
                    {validationErrors.password && <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>}
                </div>

                <div>
                    <label htmlFor="regConfirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                        Potvrdi lozinku
                    </label>
                    <input
                        type="password"
                        id="regConfirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${
                            validationErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'
                        }`}
                        placeholder="Potvrdite lozinku"
                        required
                    />
                    {validationErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>}
                </div>

                <div>
                    <div className="flex items-start gap-3">
                        <input 
                            type="checkbox" 
                            id="terms" 
                            name="terms" 
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className={`mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer ${
                                validationErrors.terms ? 'border-red-500' : ''
                            }`}
                            required 
                        />
                        <label htmlFor="terms" className="block text-sm text-gray-700">
                            Saglasan/na sam sa{' '}
                            <button 
                                onClick={(e) => {
                                    
                                    handleOpenTerms('terms')
                                }}
                                className="text-black underline hover:no-underline font-medium transition-colors hover:text-gray-700"
                            >
                                Uslovima korišćenja
                            </button>{' '}
                            i{' '}
                            <button 
                                onClick={(e) => {
                                    
                                    handleOpenTerms('privacy')
                                }}
                                className="text-black underline hover:no-underline font-medium transition-colors hover:text-gray-700"
                            >
                                Politikom privatnosti
                            </button>
                        </label>
                    </div>
                    {validationErrors.terms && <p className="mt-1 text-xs text-red-600">{validationErrors.terms}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Učitavanje...' : 'Registruj se'}
                </button>
            </form>

            <div className="text-center">
                <p className="text-sm text-gray-600">
                    Već imaš nalog?{' '}
                    <button onClick={onSwitchToLogin} className="font-medium text-black transition-colors hover:text-gray-700">
                        Uloguj se
                    </button>
                </p>
            </div>
        </>
    )
}

export default RegisterForm
