import React, { useState } from 'react'

/**
 * @typedef {Object} LoginFormProps
 * @property {(email: string, password: string) => void} onSubmit
 * @property {boolean} loading
 * @property {string | null} error
 * @property {() => void} onForgotClick
 * @property {() => void} onSwitchToRegister
 * @property {(e: React.MouseEvent) => void} onGoogleLogin
 */

/** @type {React.FC<LoginFormProps>} */
const LoginForm = ({
    onSubmit,
    loading,
    error,
    onForgotClick,
    onSwitchToRegister,
    onGoogleLogin,
}) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        const emailTrimmed = email.trim()
        if (!emailTrimmed || !password) {
            return
        }
        onSubmit(emailTrimmed, password)
    }

    return (
        <>
            <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-black">Zdravo, opet!</h2>
                <p className="text-sm text-gray-600">Ulogujte se da biste nastavili dalje</p>
            </div>

            {error && <p className="mb-4 text-sm text-red-600 text-center">{error}</p>}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="loginEmail" className="mb-2 block text-sm font-medium text-gray-700">
                        E-pošta
                    </label>
                    <input
                        type="email"
                        id="loginEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                        placeholder="petar.petrovic@example.com"
                        required
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">
                            Lozinka
                        </label>
                        <button
                            type="button"
                            onClick={onForgotClick}
                            className="text-sm text-gray-600 transition-colors hover:text-black"
                        >
                            Zaboravio si lozinku?
                        </button>
                    </div>
                    <input
                        type="password"
                        id="loginPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                        placeholder="Unesite lozinku"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                    {loading ? 'Učitavanje...' : 'Uloguj se'}
                </button>
            </form>

            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 flex-shrink text-sm text-gray-500">Nastavi preko google naloga?</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="mb-6">
                <button
                    onClick={onGoogleLogin}
                    type="button"
                    className="flex w-full items-center justify-center border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                >
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
                    Još uvek nemaš nalog?{' '}
                    <button onClick={onSwitchToRegister} className="font-medium text-black transition-colors hover:text-gray-700">
                        Registruj se
                    </button>
                </p>
            </div>
        </>
    )
}

export default LoginForm
