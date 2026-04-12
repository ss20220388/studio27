import React from 'react'

/**
 * @typedef {Object} ForgotPasswordResetProps
 * @property {string} email
 * @property {string} otpCode
 * @property {(code: string) => void} setOtpCode
 * @property {string} newPassword
 * @property {(password: string) => void} setNewPassword
 * @property {string} confirmPassword
 * @property {(password: string) => void} setConfirmPassword
 * @property {boolean} loading
 * @property {string | null} error
 * @property {string | null} success
 * @property {(e: React.FormEvent) => void} onReset
 * @property {() => void} onBackToEmail
 */

/** @type {React.FC<ForgotPasswordResetProps>} */
const ForgotPasswordReset = ({
    email,
    otpCode,
    setOtpCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    success,
    onReset,
    onBackToEmail,
}) => {
    return (
        <>
            <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-black">Potvrdi kod</h2>
                <p className="text-sm text-gray-600">Unesite kod koji je poslat na {email}</p>
            </div>

            {error && <p className="mb-4 text-sm text-red-600 text-center">{error}</p>}
            {success && <p className="mb-4 text-sm text-green-600 text-center">{success}</p>}

            <form onSubmit={onReset} className="space-y-6">
                <div>
                    <label htmlFor="otpCode" className="mb-2 block text-sm font-medium text-gray-700">
                        Verifikacijski kod (6 znamenki)
                    </label>
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
                        required
                    />
                </div>

                <div>
                    <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">
                        Nova lozinka
                    </label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                        placeholder="Najmanje 6 karaktera"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                        Potvrdi lozinku
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                        placeholder="Ponovi lozinku"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                    {loading ? 'Resetovanje...' : 'Resetuj lozinku'}
                </button>

                <button
                    type="button"
                    onClick={onBackToEmail}
                    className="w-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                    ← Nazad
                </button>
            </form>
        </>
    )
}

export default ForgotPasswordReset
