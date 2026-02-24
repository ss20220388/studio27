import React, { useEffect, useState } from 'react'

type Props = {
    isOpen?: boolean
    onClose?: () => void
}

function getDeviceId(): string {
    try {
        const existing = localStorage.getItem('deviceId')
        if (existing) return existing
        const id =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        localStorage.setItem('deviceId', id)
        return id
    } catch {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    }
}

const LoginSectionForm: React.FC<Props> = ({ isOpen, onClose }) => {
    
    const [loginForm, setLoginForm] = useState(true)
    const [internalOpen, setInternalOpen] = useState(!!isOpen)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    
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

    useEffect(() => { tryRestoreSession() }, [])

    
    const close = () => {
        setInternalOpen(false)
        setError(null)
        setSuccess(null)
        if (onClose) onClose()
    }

    const tryRestoreSession = async () => {
        try {
            const r = await fetch('/api/auth/getAccessToken', { method: 'POST', credentials: 'include' })
            if (!r.ok) return
            const data = await r.json()
            if (data.accessToken) {
                const me = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${data.accessToken}` },
                })
                if (me.ok) {
                    const user = await me.json()
                    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: user }))
                }
            }
        } catch {
            // ignore — no session
        }
    }

    const doLogin = async (email: string, password: string) => {
        setLoading(true)
        setError(null)
        const deviceId = getDeviceId()
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password, deviceId }),
            })
            const text = await res.text()
            let json: any
            try { json = JSON.parse(text) } catch { json = null }
            if (!res.ok) {
                setError(json?.error || `Greška pri prijavi (${res.status})`)
                return
            }
            if (!json) { setError('Server je vratio neispravan odgovor'); return }
            if (json.accessToken) {
                localStorage.setItem('accessToken', json.accessToken)
                const me = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${json.accessToken}` },
                })
                if (me.ok) {
                    const user = await me.json()
                    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: user }))
                }
                close()
            }

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
        try {
            const res = await fetch('/api/auth/register-user', {
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

            if (!ime || !prezime) {
                setError('Unesite ime i prezime')
                return
            }
            await doRegister({ email, password, ime, prezime, brojTelefona })
        }
    }

    /* -------- early‑return AFTER all hooks -------- */
    const isControlled = typeof isOpen === 'boolean'
    const modalActive = internalOpen || (isControlled && isOpen)
    if (!modalActive) return null

    /* -------- JSX -------- */
    return (
        <section  className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={close}></div>

            <div className="relative rounded-none bg-white p-8 shadow-sm w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <button onClick={close} className="absolute right-3 top-3 text-gray-500 hover:text-black" aria-label="Zatvori">
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
                                    <input type="text" id="regFirstName" name="firstName" className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none" placeholder="Petar" required />
                                </div>
                                <div>
                                    <label htmlFor="regLastName" className="mb-2 block text-sm font-medium text-gray-700">Prezime</label>
                                    <input type="text" id="regLastName" name="lastName" className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none" placeholder="Petrovic" required />
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
                        <input type="email" id="loginEmail" name="email" className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none" placeholder="petar.petrovic@example.com" required />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">Lozinka</label>
                            {loginForm
                                ? <a href="#" className="text-sm text-gray-600 transition-colors hover:text-black">Zaboravio si lozinku?</a>
                                : <p className="text-xs text-gray-500">Barem 8 karaktera</p>
                            }
                        </div>
                        <input type="password" id="loginPassword" name="password" className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none" placeholder="Unesite lozinku" required />
                    </div>

                    {!loginForm && (
                        <div>
                            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">Potvrdi lozinku</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none" placeholder="Potvrdite lozinku" required />
                        </div>
                    )}

                    {!loginForm && (
                        <div className="flex items-start">
                            <input type="checkbox" id="terms" name="terms" className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black" required />
                            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                                Saglasan/na sam sa <a href="#" className="text-black underline hover:no-underline">Uslovima korišćenja</a> i <a href="#" className="text-black underline hover:no-underline">Politikom privatnosti</a>
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
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
                    <button type="button" className="flex w-full items-center justify-center border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50">
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        {loginForm ? 'Još uvek nemaš nalog? ' : 'Već imaš nalog? '}
                        <button onClick={() => { setLoginForm(!loginForm); setError(null); setSuccess(null) }} className="font-medium text-black transition-colors hover:text-gray-700">
                            {loginForm ? 'Registruj se' : 'Uloguj se'}
                        </button>
                    </p>
                </div>
            </div>
        </section>
    )
}

export default LoginSectionForm