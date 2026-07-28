import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type User = {
    ime?: string
    prezime?: string
    email?: string
    role?: string
}

type DropDownMenuProps = {
    publicAppUrl: string
    publicAdminUrl: string
    publicApiUrl: string
}

const DropDownMenu: React.FC<DropDownMenuProps> = ({ publicAppUrl, publicAdminUrl, publicApiUrl }) => {
    const [open, setOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setOpen(false)
          }
        }
        if (open) {
          document.addEventListener('mousedown', handleClickOutside)
        } else {
          document.removeEventListener('mousedown', handleClickOutside)
        }
        return () => {
          document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    useEffect(() => {
        fetch(`${publicApiUrl}/api/auth/me`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(u => { if (u && !u.error) setUser(u); else setUser(null); })
        .catch(() => setUser(null));
        const handler = (e: CustomEvent) => setUser(e.detail)
        window.addEventListener('user-logged-in', handler as EventListener)
        return () => window.removeEventListener('user-logged-in', handler as EventListener)
    }, [publicApiUrl])


    const handleLogout = async () => {
        try {
            await fetch(`${publicApiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' })
        } catch (error) { /* ignore */ }
        
        localStorage.removeItem('accessToken')
        
        setUser(null)
        setOpen(false)
        window.dispatchEvent(new CustomEvent('user-logged-out'))
        if (window.navigation) {
            window.navigation.reload()
        } else {
            window.location.reload()
        }
    }

    if (!user) {
        return (
            <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
                className="inline-block no-underline hover:text-gray-400 cursor-pointer p-1"
                aria-label="Uloguj se"
            >
                <svg className="fill-current text-white hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <circle fill="none" cx="12" cy="7" r="3" />
                    <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5S14.757 2 12 2zM12 10c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3S13.654 10 12 10zM21 21v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h2v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1H21z" />
                </svg>
            </button>
        )
    }

    const fullName = `${user.ime || ''} ${user.prezime || ''}`.trim() || 'Korisnik'
    const firstTwoWords = fullName.split(' ').slice(0, 2).join(' ')
    const displayName = firstTwoWords.length > 20 ? firstTwoWords.substring(0, 18) + '...' : firstTwoWords
    const initials = `${(user.ime || '')[0] || ''}${(user.prezime || '')[0] || ''}`.toUpperCase() || 'K'

    return (
        <div className="relative z-[9999]" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-white/5"
            >
                <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">{displayName}</span>
                <svg width="12" height="12" className={`h-3 w-3 fill-current transition-transform ${open ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
                    <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
                </svg>
            </button>

            <AnimatePresence>
            {open && (
                <>
                    {/* Popravljen z-index overlay-a sa ispravnim Tailwind formatom */}
                    <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />

                    <motion.div 
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 z-[9999] w-72 rounded-xl bg-neutral-900 border border-neutral-700/80 shadow-2xl overflow-hidden backdrop-blur-xl"
                    >
                        {/* Ime, prezime, email */}
                        <div className="flex items-center space-x-3 p-4 border-b border-neutral-800">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 text-white text-xs font-bold shadow-inner border border-neutral-600/50">
                                {initials}
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-sm font-semibold text-gray-100 truncate">{fullName}</span>
                                {user.email && <span className="text-xs text-neutral-400 truncate">{user.email}</span>}
                            </div>
                        </div>

                        <nav className="py-2 px-2 flex flex-col gap-1">
                            <a href={publicAppUrl} className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-all duration-150">
                                <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
                                </svg>
                                <span>Web aplikacija</span>
                            </a>
                            {user.role === "ADMIN" && (
                                <a href={publicAdminUrl} className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-all duration-150">
                                    <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Admin aplikacija</span>
                                </a>
                            )}
                        </nav>

                        <div className="h-px w-full bg-neutral-800 my-1"></div>

                        <div className="py-2 px-2">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-all duration-150 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                <span>Odjavi se</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
            </AnimatePresence>
        </div>
    )
}

export default DropDownMenu