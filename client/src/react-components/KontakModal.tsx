import React, { useEffect, useRef, useState } from 'react'
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://api.studio27.rs'

const backdropStyle: React.CSSProperties = {
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
}

const panelStyle: React.CSSProperties = {
  transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
}


const inputBase =
  'w-full h-11 text-sm text-gray-200 placeholder-neutral-500 bg-neutral-900 border border-neutral-700/50 rounded-lg focus:border-red-800 focus:bg-neutral-800/80 outline-none px-4 transition-all duration-300 shadow-inner'

export default function KontaktModal({textButtona}: {textButtona?: string}) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [naslov, setNaslov] = useState('');
  const [poruka, setPoruka] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [telefon, setTelefon] = useState('');
  useEffect(() => {
    const value = localStorage.getItem('kontakModalOpen');
    if (value === 'true') setOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('kontakModalOpen', open.toString().toLowerCase());
  }, [open]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('openKontaktModal', handleOpen);
    return () => window.removeEventListener('openKontaktModal', handleOpen);
  }, []);

  // Animate in after mount
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 350);
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function handleSumit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validacija
    if (!name.trim() || !email.trim() || !telefon.trim() || !poruka.trim()) {
      alert('Molimo popuni sve polјe');
      return;
    }

    const ADMIN_WHATSAPP = '381612563121';
    
    // Konstruiši poruku za WhatsApp
    const message = `*Nova poruka sa sajta Studio27*

*Ime:* ${name}
*Email:* ${email}
*Telefon:* ${telefon}
*Naslov:* ${naslov}

*Poruka:*
${poruka}`;

    // Kodiraj poruku za URL
    const encodedMessage = encodeURIComponent(message);

    // Kreiraj WhatsApp link
    const whatsappLink = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`;

    // Otvori WhatsApp u novoj tab
    window.open(whatsappLink, '_blank');

    // Resetuj formu
    setName('');
    setEmail('');
    setTelefon('');
    setNaslov('');
    setPoruka('');

    // Zatvori modal
    handleClose();
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ ...backdropStyle, opacity: visible ? 1 : 0, backgroundColor: visible ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)' }}
          onClick={handleBackdropClick}
        >
          <div
            ref={panelRef}
            className="bg-black w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl shadow-red-900/10 relative overflow-hidden border border-neutral-800/60"
            style={{ ...panelStyle, opacity: visible ? 1 : 0, transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)' }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-red-900 hover:border-red-800 text-gray-300 hover:text-white transition-all duration-300 text-xl leading-none"
            >
              &times;
            </button>

            <div className="grid lg:grid-cols-5 grid-cols-1 max-h-[95vh]">
              {/* Left image — 2/5 of the grid */}
              <div className="relative lg:col-span-2 h-48 lg:h-auto overflow-hidden bg-neutral-900">
                <img
                  src={`${API_URL}/api/media?remoteFilePath=/uploads/slikaenterijer.jpg`}
                  alt="ContactUs"
                  className="w-full h-full object-cover opacity-80"
                />
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t lg:bg-linear-to-r from-black via-black/60 to-transparent" />
                
                {/* Overlay Text for aesthetic */}
                <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-8 hidden sm:block">
                   <h3 className="text-white text-xl font-bold mb-2 font-manrope">Započnite<br/>svoju karijeru.</h3>
                   <p className="text-gray-400 text-xs">Prijavite se odmah i osigurajte svoje mesto na našim najtraženijim obukama.</p>
                </div>
              </div>

              {/* Right form — 3/5 */}
              <div className="lg:col-span-3 p-6 lg:p-10 overflow-y-auto max-h-[calc(95vh-12rem)] lg:max-h-[95vh] custom-scroll">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-px bg-red-800" />
                    <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-red-700">Kontaktirajte nas</p>
                  </div>
                  <h2 className="text-3xl font-bold text-white leading-tight font-manrope">
                    Pošaljite nam poruku
                  </h2>
                </div>

                <form className="space-y-5" onSubmit={handleSumit} noValidate>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Vaše ime</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="name" placeholder="Npr. Petar Petrović" className={inputBase} />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email adresa</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" name="email" placeholder="email@primer.com" className={inputBase} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Broj telefona</label>
                        <input value={telefon} onChange={(e) => setTelefon(e.target.value)} type="tel" name="phone" placeholder="+381 " className={inputBase} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Naslov poruke</label>
                      <input value={naslov} onChange={(e) => setNaslov(e.target.value)} type="text" name="naslov" placeholder="Npr. Upit za kurs šminkanja" className={inputBase} />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Detalji poruke</label>
                      <textarea
                        value={poruka}
                        onChange={(e) => setPoruka(e.target.value)}
                        name="message"
                        placeholder="Napišite nam šta vas zanima..."
                        rows={5}
                        className="w-full text-sm text-gray-200 placeholder-neutral-500 bg-neutral-900 border border-neutral-700/50 rounded-lg focus:border-red-800 focus:bg-neutral-800/80 outline-none p-4 transition-all duration-300 resize-none shadow-inner custom-scroll"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full h-12 mt-4 text-white text-sm font-bold tracking-widest uppercase rounded-lg bg-linear-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 active:scale-[0.98] shadow-[0_8px_20px_-8px_rgba(153,27,27,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <span>Pošalji poruku</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}


      <button
        className="inline-block no-underline font-bold text-white text-l py-2 px-4 cursor-pointer hover:text-red-400 transition-colors duration-200"
        onClick={() => setOpen(true)}
      >
        {textButtona || ""}
      </button>

    </>
  )
}