import React, { useState, useEffect } from 'react'

const ErrorToastNotifier = ({ losGmailCookie }) => {
    const [message, setMessage] = useState(null)

    useEffect(() => {
        if (!losGmailCookie) return

        let msg = ''

        switch (losGmailCookie?.value) {
            case 'missing_device_id':
                msg = 'Greška: Device ID nije pronađen'
                break
            case 'device_mismatch':
                msg = 'Nije uspešno logovanje! Email je prijavljen na drugom računaru'
                break
            case 'device_already_used':
                msg = 'Ovaj uređaj je već prijavljen drugim nalogom'
                break
            case 'server_error':
                msg = 'Serverska greška pri logovanja'
                break
            case 'oauth2_failed':
                msg = 'OAuth2 prijava je neuspešna'
                break
            default:
                msg = 'Greška pri logovanja: ' + losGmailCookie?.value
        }

        setMessage(msg)
        setTimeout(() => {
            setMessage(null)
        }, 2000)
    }, [losGmailCookie])

    if (!message) return null

    return (
        <div className="fixed top-[120px] right-5 max-w-md z-50 animate-slide-in-right">
            <div className="bg-black border border-red-500/30 rounded-lg shadow-2xl overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-shrink-0">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-500"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white opacity-80 text-sm font-semibold leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
                <div className="h-1 bg-linear-to-r from-red-500 to-red-600"></div>
            </div>
        </div>
    )
}

export default ErrorToastNotifier