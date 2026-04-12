import React, { useState, useEffect } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordEmail from './ForgotPasswordEmail'
import ForgotPasswordReset from './ForgotPasswordReset'
import { getDeviceId, parseJsonResponse } from './loginUtils'

/**
 * @typedef {Object} LoginModalProps
 * @property {boolean} [isOpen]
 * @property {() => void} [onClose]
 * @property {string} publicApiUrl
 */

/** @type {React.FC<LoginModalProps>} */
const LoginSectionForm = ({ isOpen, onClose, publicApiUrl }) => {
    const [loginForm, setLoginForm] = useState(true)
    const [internalOpen, setInternalOpen] = useState(!!isOpen)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [forgotStep, setForgotStep] = useState('email')
    const [forgotEmail, setForgotEmail] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [forgotLoading, setForgotLoading] = useState(false)

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
        return () => {
            document.body.style.overflow = ''
        }
    }, [internalOpen])

    const close = () => {
        setInternalOpen(false)
        setError(null)
        setSuccess(null)
        if (onClose) onClose()
    }

    const doLogin = async (email, password) => {
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
            const json = parseJsonResponse(text)

            if (!res.ok) {
                setError(json?.error || `Greška pri prijavi (${res.status})`)
                return
            }

            if (!json) {
                setError('Server je vratio neispravan odgovor')
                return
            }

            if (json.accessToken) {
                const meUrl = `${publicApiUrl}/api/auth/me`

                const me = await fetch(meUrl, {
                    headers: { 'Authorization': `Bearer ${json.accessToken}` },
                    credentials: 'include',
                })

                const meText = await me.text()
                const meJson = parseJsonResponse(meText)

                if (me.ok && meJson) {
                    window.dispatchEvent(
                        new CustomEvent('user-logged-in', { detail: meJson })
                    )
                }

                close()
            }
        } catch (e) {
            setError(e?.message || 'Greška pri komunikaciji sa serverom')
        } finally {
            setLoading(false)
        }
    }

    const doRegister = async (payload) => {
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const res = await fetch(`${publicApiUrl}/api/auth/register-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const text = await res.text()
            const json = parseJsonResponse(text)

            if (!res.ok) {
                setError(json?.error || `Greška pri registraciji (${res.status})`)
                return
            }
            setSuccess('Uspešno ste se registrovali! Sada se ulogujte.')
            setLoginForm(true)
        } catch (e) {
            setError(e?.message || 'Greška pri komunikaciji sa serverom')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async (e) => {
        e.preventDefault()
        try {
            await getDeviceId({ API_URL: publicApiUrl })
            window.location.href = `${publicApiUrl}/oauth2/authorization/google`
        } catch (e) {
            console.error('Google login error:', e)
            setError(e?.message || 'Greška pri pokretanju Google prijave')
        }
    }

    const handleSendOtp = async (e) => {
        e.preventDefault()

        if (!forgotEmail || !forgotEmail.includes('@')) {
            setError('Unesite validan email')
            return
        }

        setForgotLoading(true)
        setError(null)
        setSuccess(null)

        try {
            // @see /api/send-code-to-mail
            const res = await fetch(`${publicApiUrl}/api/send-code-to-mail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: forgotEmail,
                    subject: 'Studio 27 - Vaš kod za resetovanje lozinke',
                    subText: 'Molimo koristite ovaj kod za resetovanje lozinke:',
                    body: '',
                }),
            })

            const data = parseJsonResponse(await res.text())

            if (!res.ok) {
                setError(data?.message || 'Greška pri slanju koda')
                return
            }

            setSuccess('Verifikacijski kod je poslat na vašu email adresu!')
            setForgotStep('otp-reset')
            setOtpCode('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (e) {
            setError(e?.message || 'Greška pri komunikaciji sa serverom')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleVerifyOtpAndReset = async (e) => {
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
            // @see /api/auth/zaboravljena-lozinka
            const res = await fetch(`${publicApiUrl}/api/auth/zaboravljena-lozinka`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail,
                    kod: otpCode,
                    password: newPassword,
                }),
            })

            const data = parseJsonResponse(await res.text())

            if (!res.ok) {
                setError(data?.error || data?.message || 'Greška pri resetovanju lozinke')
                return
            }

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
        } catch (e) {
            setError(e?.message || 'Greška pri komunikaciji sa serverom')
        } finally {
            setForgotLoading(false)
        }
    }

    const isControlled = typeof isOpen === 'boolean'
    const modalActive = internalOpen || (isControlled && isOpen)
    if (!modalActive) return null

    if (showForgotPassword) {
        return (
            <section className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-black/60"
                    onClick={() => {
                        setShowForgotPassword(false)
                        setError(null)
                        setForgotStep('email')
                    }}
                ></div>

                <div className="relative rounded-none bg-white p-8 shadow-sm w-full max-w-md mx-4">
                    <button
                        onClick={() => {
                            setShowForgotPassword(false)
                            setError(null)
                            setForgotStep('email')
                        }}
                        className="absolute right-3 top-3 text-gray-500 hover:text-black"
                        aria-label="Zatvori"
                    >
                        ✕
                    </button>

                    {forgotStep === 'email' ? (
                        <ForgotPasswordEmail
                            email={forgotEmail}
                            setEmail={setForgotEmail}
                            loading={forgotLoading}
                            error={error}
                            success={success}
                            onSendCode={handleSendOtp}
                            onBack={() => {
                                setShowForgotPassword(false)
                                setError(null)
                                setForgotStep('email')
                            }}
                        />
                    ) : (
                        <ForgotPasswordReset
                            email={forgotEmail}
                            otpCode={otpCode}
                            setOtpCode={setOtpCode}
                            newPassword={newPassword}
                            setNewPassword={setNewPassword}
                            confirmPassword={confirmPassword}
                            setConfirmPassword={setConfirmPassword}
                            loading={forgotLoading}
                            error={error}
                            success={success}
                            onReset={handleVerifyOtpAndReset}
                            onBackToEmail={() => setForgotStep('email')}
                        />
                    )}
                </div>
            </section>
        )
    }

    return (
        <section className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={close}></div>

            <div className="relative rounded-none bg-white p-8 shadow-sm w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <button onClick={close} className="absolute right-3 top-3 text-gray-500 hover:text-black" aria-label="Zatvori">
                    ✕
                </button>

                {loginForm ? (
                    <LoginForm
                        onSubmit={doLogin}
                        loading={loading}
                        error={error}
                        onForgotClick={() => {
                            setShowForgotPassword(true)
                            setError(null)
                        }}
                        onSwitchToRegister={() => {
                            setLoginForm(false)
                            setError(null)
                            setSuccess(null)
                        }}
                        onGoogleLogin={handleGoogleLogin}
                    />
                ) : (
                    <RegisterForm
                        onSubmit={doRegister}
                        loading={loading}
                        error={error}
                        success={success}
                        onSwitchToLogin={() => {
                            setLoginForm(true)
                            setError(null)
                            setSuccess(null)
                        }}
                    />
                )}
            </div>
        </section>
    )
}

export default LoginSectionForm
