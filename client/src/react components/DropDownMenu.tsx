import React, { useEffect, useState } from 'react'

type User = {
    ime?: string
    prezime?: string
    email?: string
    role?: string
}

const DropDownMenu: React.FC = () => {
    const [open, setOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const handler = (e: CustomEvent) => setUser(e.detail)
        window.addEventListener('user-logged-in', handler as EventListener)
        return () => window.removeEventListener('user-logged-in', handler as EventListener)
    }, [])

    // try to load user on mount from stored token
    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) return
        fetch('http://localhost:8080/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(u => { if (u) setUser(u) })
            .catch(() => {})
    }, [])

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:8080/api/auth/logout', { method: 'POST', credentials: 'include' })
        } catch { /* ignore */ }
        localStorage.removeItem('accessToken')
        setUser(null)
        setOpen(false)
        window.location.reload()
    }

    if (!user) return null

    const fullName = `${user.ime || ''} ${user.prezime || ''}`.trim() || 'Korisnik'
    const initials = `${(user.ime || '')[0] || ''}${(user.prezime || '')[0] || ''}`.toUpperCase() || 'K'

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
            >
                <span className="text-sm font-medium">{fullName}</span>
                <svg width="12" height="12" className={`h-3 w-3 fill-current transition-transform ${open ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
                    <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
                </svg>
            </button>

            {open && (
                <>
                    {/* overlay za zatvaranje */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                    <div className="absolute right-0 mt-3 z-50 w-72 rounded-lg bg-white shadow-lg border border-gray-200 divide-y divide-gray-100">
                        {/* Ime, prezime, email */}
                        <div className="flex items-center space-x-3 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white text-sm font-bold">
                                {initials}
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-sm font-semibold text-gray-900 truncate">{fullName}</span>
                                {user.email && <span className="text-xs text-gray-500 truncate">{user.email}</span>}
                            </div>
                        </div>

                        {/* Linkovi */}
                        <nav className="py-1">
                            <a href="/home" className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
                                </svg>
                                <span>Web aplikacija</span>
                            </a>
                            <a href="/admin" className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Admin aplikacija</span>
                            </a>
                        </nav>

                        {/* Odjavi se */}
                        <div className="py-1">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                <span>Odjavi se</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default DropDownMenu