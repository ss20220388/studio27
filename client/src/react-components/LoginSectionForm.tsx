import React, { useEffect, useState } from 'react'

type Props = {
    isOpen?: boolean
    onClose?: () => void
    publicApiUrl: string
}

async function getDeviceId({ API_URL }: { API_URL: string }): Promise<string> {
    const makeId = async () => {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
}

    let id: string

    try {
        id = localStorage.getItem('deviceId') || await makeId()
        localStorage.setItem('deviceId', id)
    } catch {
        id =await makeId()
    }

    const res = await fetch(`${API_URL}/api/cookies/create-cookie-by-local-storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceId: id }),
    })

    if (!res.ok) {
        throw new Error(`Cookie endpoint failed: ${res.status}`)
    }

    return id
}

const LoginSectionForm: React.FC<Props> = ({ isOpen, onClose, publicApiUrl }) => {
    const [loginForm, setLoginForm] = useState(true)
    const [internalOpen, setInternalOpen] = useState(!!isOpen)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [forgotStep, setForgotStep] = useState<'email' | 'otp-reset'>('email')
    const [forgotEmail, setForgotEmail] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [forgotLoading, setForgotLoading] = useState(false)
    const [registerErrors, setRegisterErrors] = useState<{ [key: string]: string }>({})
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [proveraKoda, setProveraKoda] = useState(false)

    useEffect(() => {
        if (typeof isOpen === 'boolean') setInternalOpen(isOpen)
    }, [isOpen])

    useEffect(() => {
        const handler = () => setInternalOpen(true)
        window.addEventListener('open-login', handler)
        return () => window.removeEventListener('open-login', handler)
    }, [])

    useEffect(() => {
        if (internalOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [internalOpen])

    const close = () => {
        setInternalOpen(false)
        setError(null)
        setSuccess(null)
        if (onClose) onClose()
    }

    const doLogin = async (email: string, password: string) => {
        setLoading(true)
        setError(null)

        try {
            const deviceId = await getDeviceId({ API_URL: publicApiUrl })

            const url = `${publicApiUrl}/api/auth/login`
            const payload = { email, password, deviceId }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            })

            const text = await res.text()

            let json: any = null
            try {
                json = JSON.parse(text)
            } catch (err) {
                // ignore
            }

            if (!res.ok) {
                setError(json?.error || `Greška pri prijavi (${res.status})`)
                return
            }

            if (!json) {
                setError('Server je vratio neispravan odgovor')
                return
            }

            if (json.accessToken) {
                // 1. Zapisujemo u localStorage
                localStorage.setItem('accessToken', json.accessToken);

                const meUrl = `${publicApiUrl}/api/auth/me`;
                const me = await fetch(meUrl, {
                    headers: { Authorization: `Bearer ${json.accessToken}` },
                    credentials: 'include',
                });

                if (me.ok) {
                    const meData = await me.json();

                    // 2. Šaljemo token u event detail-u
                    window.dispatchEvent(
                        new CustomEvent('user-logged-in', {
                            detail: { token: json.accessToken }
                        })
                    );
                }

                close();
            }
            window.navigation.reload()




        } catch (e: any) {
            setError(e?.message || 'Greška pri komunikaciji sa serverom')
        } finally {
            setLoading(false)
        }
    }

    const doRegister = async (payload: {
        email: string
        password: string
        ime: string
        prezime: string
        brojTelefona?: string
    }) => {
        setLoading(true)
        setError(null)
        setSuccess(null)
        setProveraKoda(false)
        setOtpCode('')
        try {
            const res = await fetch(`${publicApiUrl}/api/auth/register-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const text = await res.text()
            let json: any
            try { json = JSON.parse(text) } catch { json = null }
            if (!res.ok) {
                setError(json?.error || `Greška pri registraciji (${res.status})`)
                return
            }
            setSuccess('Uspešno ste se registrovali! Sada se ulogujte.')
            setLoginForm(true)
        } catch (e: any) {
            setError(e?.message || 'Greška pri komunikaciji sa serverom')
        } finally {
            setLoading(false)
        }

    }

    const handleSubmit = async () => {
        const emailEl = document.getElementById('loginEmail') as HTMLInputElement | null
        const passwordEl = document.getElementById('loginPassword') as HTMLInputElement | null
        const email = emailEl?.value?.trim() || ''
        const password = passwordEl?.value || ''

        if (!email || !password) {
            setError('Unesite email i lozinku')
            return
        }

        if (loginForm) {
            await doLogin(email, password)
        } else {
            const ime = (document.getElementById('regFirstName') as HTMLInputElement)?.value?.trim() || ''
            const prezime = (document.getElementById('regLastName') as HTMLInputElement)?.value?.trim() || ''
            const brojTelefona = (document.getElementById('regPhone') as HTMLInputElement)?.value?.trim() || undefined
            const confirmPasswordEl = (document.getElementById('confirmPassword') as HTMLInputElement)?.value || ''

            // Validacija
            const errors: { [key: string]: string } = {}

            if (!ime || ime.length < 2) errors.ime = 'Ime mora biti najmanje 2 karaktera'
            if (!prezime || prezime.length < 2) errors.prezime = 'Prezime mora biti najmanje 2 karaktera'

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!email || !emailRegex.test(email)) errors.email = 'Unesite validnu e-poštu'

            if (!password || password.length < 8) errors.password = 'Lozinka mora biti najmanje 8 karaktera'
            else if (!/[A-Z]/.test(password)) errors.password = 'Lozinka mora sadržavati jedno veliko slovo'
            else if (!/[0-9]/.test(password)) errors.password = 'Lozinka mora sadržavati jedan broj'

            if (password !== confirmPasswordEl) errors.confirmPassword = 'Lozinke se ne poklapaju'

            if (!termsAccepted) errors.terms = 'Morate prihvatiti uslove korišćenja'

            if (!proveraKoda) errors.provera = 'Morate proći proveru koda'

            if (Object.keys(errors).length > 0) {
                setRegisterErrors(errors)
                setError(Object.values(errors)[0])
                return
            }

            setRegisterErrors({})
            await doRegister({ email, password, ime, prezime, brojTelefona })
        }
    }

    const handleOpenTerms = () => {
        try {
            const filePath = `/pravila/Analiticka - formule.pdf`
            const url = `${publicApiUrl}/api/media?remoteFilePath=${encodeURIComponent(filePath)}`
            window.open(url, '_blank')
        } catch (err) {
            console.error('Greška pri otvaranju dokumenta:', err)
        }
    }

    async function handleGoogleLogin(e: any) {
        e.preventDefault()
        try {
            await getDeviceId({ API_URL: publicApiUrl })
            window.location.href = `${publicApiUrl}/oauth2/authorization/google`
        } catch (e: any) {
            console.error('Google login error:', e)
            setError(e?.message || 'Greška pri pokretanju Google prijave')
        }
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!forgotEmail || !forgotEmail.includes('@')) {
            setError('Unesite validan email')
            return
        }

        setForgotLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch(`${publicApiUrl}/api/send-code-to-mail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: forgotEmail }),
            })

            setSuccess('Verifikacijski kod je poslat na vašu email adresu!')
            setForgotStep('otp-reset')
            setOtpCode('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (e: any) {
            console.error(e)
            setError('Greška pri komunikaciji sa serverom')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleProveraKoda = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otpCode || otpCode.length !== 6) {
            setError('Kod mora biti 6 znamenki')
            return
        }
        const emailEl = document.getElementById('loginEmail') as HTMLInputElement | null
        const email = emailEl?.value?.trim() || ''
        const res = await fetch(`${publicApiUrl}/api/auth/provera-koda`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kod: otpCode, email: email }),
        })
        const data = await res.json()
        setProveraKoda(data)
    }

    const handleSendOtpReg = async (e: React.FormEvent) => {
        e.preventDefault()
        const emailEl = document.getElementById('loginEmail') as HTMLInputElement | null
        const email = emailEl?.value?.trim() || ''

        if (!email || !email.includes('@')) {
            setError('Unesite validan email')
            return
        }

        setForgotLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch(`${publicApiUrl}/api/send-code-to-mail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: email }),
            })

            setSuccess('Verifikacijski kod je poslat na vašu email adresu!')
            setForgotStep('otp-reset')
            setOtpCode('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (e: any) {
            console.error(e)
            setError('Greška pri komunikaciji sa serverom')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!otpCode || otpCode.length !== 6) {
            setError('Kod mora biti 6 znamenki')
            return
        }
        if (!newPassword || newPassword.length < 6) {
            setError('Lozinka mora biti najmanje 6 karaktera')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Lozinke se ne poklapaju')
            return
        }

        setForgotLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch(`${publicApiUrl}/api/auth/zaboravljena-lozinka`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail,
                    kod: otpCode,
                    password: newPassword
                }),
            })

            setSuccess('Lozinka uspešno resetovana!')
            setTimeout(() => {
                setShowForgotPassword(false)
                setForgotStep('email')
                setForgotEmail('')
                setOtpCode('')
                setNewPassword('')
                setConfirmPassword('')
                setError(null)
                setSuccess(null)
            }, 3000)
        } catch (e: any) {
            setError(e?.message || 'Greška pri komunikaciji sa serverom')
        } finally {
            setForgotLoading(false)
        }
    }

    const isControlled = typeof isOpen === 'boolean'
    const modalActive = internalOpen || (isControlled && isOpen)
    if (!modalActive) return null

    // Forgot Password Modal
    if (showForgotPassword) {
        return (
            <section className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => { setShowForgotPassword(false); setError(null); setForgotStep('email') }}></div>

                <div className="relative rounded-none bg-white p-8 shadow-sm w-full max-w-md mx-4">
                    <button onClick={() => { setShowForgotPassword(false); setError(null); setForgotStep('email') }} className="absolute right-3 top-3 text-gray-500 hover:text-black cursor-pointer" aria-label="Zatvori">
                        ✕
                    </button>

                    {forgotStep === 'email' ? (
                        <>
                            <div className="mb-8 text-center">
                                <div className="mb-4 flex justify-center">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="mb-2 text-2xl font-bold text-black">Resetuj lozinku</h2>
                                <p className="text-sm text-gray-600">Unesite vašu email adresu i poslaćemo vam verifikacijski kod</p>
                            </div>

                            {error && <p className="mb-4 text-sm text-red-600 text-center">{error}</p>}
                            {success && <p className="mb-4 text-sm text-green-600 text-center">{success}</p>}

                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div>
                                    <label htmlFor="forgotEmail" className="mb-2 block text-sm font-medium text-gray-700">E-pošta</label>
                                    <input
                                        type="email"
                                        id="forgotEmail"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                                        placeholder="petar.petrovic@example.com"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {forgotLoading ? 'Slanje...' : 'Pošalji kod'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setShowForgotPassword(false); setError(null); setForgotStep('email') }}
                                    className="w-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                                >
                                    Vrati se na prijavu
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="mb-8 text-center">
                                <div className="mb-4 flex justify-center">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h2 className="mb-2 text-2xl font-bold text-black">Potvrdi kod</h2>
                                <p className="text-sm text-gray-600">Unesite kod koji je poslat na {forgotEmail}</p>
                            </div>

                            {error && <p className="mb-4 text-sm text-red-600 text-center">{error}</p>}
                            {success && <p className="mb-4 text-sm text-green-600 text-center">{success}</p>}

                            <form onSubmit={handleVerifyOtpAndReset} className="space-y-6">
                                <div>
                                    <label htmlFor="otpCode" className="mb-2 block text-sm font-medium text-gray-700">Verifikacijski kod (6 znamenki)</label>
                                    <input
                                        type="text"
                                        id="otpCode"
                                        inputMode="numeric"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        className="w-full border border-gray-300 bg-white px-4 py-3 text-center text-2xl font-bold tracking-widest text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">Nova lozinka</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                                        placeholder="Najmanje 6 karaktera"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">Potvrdi lozinku</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                                        placeholder="Ponovi lozinku"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {forgotLoading ? 'Procesiranje...' : 'Potvrdi i resetuj lozinku'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setForgotStep('email')}
                                    className="w-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                                >
                                    ← Nazad
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>
        )
    }

    return (
        <section className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={close}></div>

            <div className="relative rounded-none bg-white p-8 shadow-sm w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <button onClick={close} className="absolute right-3 top-3 text-gray-500 hover:text-black cursor-pointer" aria-label="Zatvori">
                    ✕
                </button>

                <div className="mb-8 text-center">
                    <div className="mb-4 flex justify-center">
                        {loginForm ? (
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21c-2.676 0-5.216-.584-7.499-1.882z" />
                            </svg>
                        )}
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-black">{loginForm ? 'Zdravo, opet!' : 'Registruj se'}</h2>
                    <p className="text-sm text-gray-600">{loginForm ? 'Ulogujte se da biste nastavili dalje' : 'Napravite novi nalog'}</p>
                </div>

                {error && <p className="mb-4 text-sm text-red-600 text-center">{error}</p>}
                {success && <p className="mb-4 text-sm text-green-600 text-center">{success}</p>}

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
                    {!loginForm && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="regFirstName" className="mb-2 block text-sm font-medium text-gray-700">Ime</label>
                                    <input type="text" id="regFirstName" name="firstName" className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${registerErrors.ime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'}`} placeholder="Petar" required />
                                    {registerErrors.ime && <p className="mt-1 text-xs text-red-600">{registerErrors.ime}</p>}
                                </div>
                                <div>
                                    <label htmlFor="regLastName" className="mb-2 block text-sm font-medium text-gray-700">Prezime</label>
                                    <input type="text" id="regLastName" name="lastName" className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${registerErrors.prezime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'}`} placeholder="Petrovic" required />
                                    {registerErrors.prezime && <p className="mt-1 text-xs text-red-600">{registerErrors.prezime}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="regPhone" className="mb-2 block text-sm font-medium text-gray-700">Broj telefona (opciono)</label>
                                <input type="text" id="regPhone" name="phone" className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none" placeholder="+381 60 1234567" />
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="loginEmail" className="mb-2 block text-sm font-medium text-gray-700">E-pošta</label>
                        <div className="relative">
                            <input
                                type="email"
                                id="loginEmail"
                                name="email"
                                readOnly={!loginForm && proveraKoda}
                                className={`w-full border px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${registerErrors.email && !loginForm ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'} ${!loginForm && proveraKoda ? 'bg-gray-50' : 'bg-white'}`}
                                placeholder="petar.petrovic@example.com"
                                required
                            />
                            {!loginForm && !proveraKoda && (
                                <button
                                    type="button"
                                    onClick={handleSendOtpReg}
                                    disabled={forgotLoading}
                                    className="absolute right-2 top-2 bottom-2 bg-gray-100 px-4 text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {forgotLoading ? 'Slanje...' : 'Pošalji kod'}
                                </button>
                            )}
                        </div>
                        {registerErrors.email && !loginForm && <p className="mt-1 text-xs text-red-600">{registerErrors.email}</p>}

                        {!loginForm && (
                            <div className="mt-3">
                                {!proveraKoda ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="otpCode"
                                            inputMode="numeric"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            maxLength={6}
                                            className="w-full border border-gray-300 bg-white px-4 py-2 text-center text-lg font-bold tracking-widest text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none placeholder-gray-300"
                                            placeholder="------"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleProveraKoda}
                                            disabled={otpCode.length !== 6}
                                            className="shrink-0 bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                                        >
                                            Potvrdi
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        E-pošta je verifikovana
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">Lozinka</label>
                            {loginForm && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setShowForgotPassword(true)
                                        setError(null)
                                        setSuccess(null)
                                        setForgotStep('email')
                                    }}
                                    className="text-sm text-gray-600 transition-colors hover:text-black cursor-pointer"
                                >
                                    Zaboravio si lozinku?
                                </button>
                            )}
                            {!loginForm && (
                                <p className="text-xs text-gray-500">Min 8 karaktera, 1 veliko slovo, 1 broj</p>
                            )}
                        </div>
                        <input type="password" id="loginPassword" name="password" className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${registerErrors.password && !loginForm ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'}`} placeholder="Unesite lozinku" required />
                        {registerErrors.password && !loginForm && <p className="mt-1 text-xs text-red-600">{registerErrors.password}</p>}
                    </div>

                    {!loginForm && (
                        <div>
                            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">Potvrdi lozinku</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" className={`w-full border px-4 py-3 bg-white text-gray-900 focus:border-transparent focus:ring-2 focus:outline-none transition-colors ${registerErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'}`} placeholder="Potvrdite lozinku" required />
                            {registerErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{registerErrors.confirmPassword}</p>}
                        </div>
                    )}

                    {!loginForm && (
                        <div className="flex items-start gap-3">
                            <input type="checkbox" id="terms" name="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className={`mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer ${registerErrors.terms ? 'border-red-500' : ''}`} required />
                            <label htmlFor="terms" className="block text-sm text-gray-700">
                                Saglasan/na sam sa{' '}
                                <button type="button" onClick={(e) => { e.preventDefault(); handleOpenTerms() }} className="text-black underline hover:no-underline font-medium transition-colors hover:text-gray-700 cursor-pointer">
                                    Uslovima korišćenja
                                </button>
                            </label>
                        </div>
                    )}
                    {registerErrors.terms && <p className="text-xs text-red-600">{registerErrors.terms}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? 'Učitavanje...' : (loginForm ? 'Uloguj se' : 'Registruj se')}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 flex-shrink text-sm text-gray-500">Nastavi preko google naloga?</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div className="mb-6">
                    <button onClick={(e) => handleGoogleLogin(e)} type="button" className="flex w-full items-center justify-center border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer">
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                </div>

                <div className="text-center cursor-pointer">
                    <p className="text-sm text-gray-600 cursor-pointer">
                        {loginForm ? 'Još uvek nemaš nalog? ' : 'Već imaš nalog? '}
                        <button onClick={() => { setLoginForm(!loginForm); setError(null); setSuccess(null); setRegisterErrors({}); setTermsAccepted(false) }} className="font-medium text-black transition-colors hover:text-gray-700 cursor-pointer">
                            {loginForm ? 'Registruj se' : 'Uloguj se'}
                        </button>
                    </p>
                </div>
            </div>
        </section>
    )
}

export default LoginSectionForm
