import React, { useEffect, useRef, useState } from 'react'
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://api.studio27.rs'

const backdropStyle: React.CSSProperties = {
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
}

const panelStyle: React.CSSProperties = {
  transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
}

const inputBase =
  'w-full h-11 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none px-4 transition-all duration-300'

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function handleSumit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !telefon.trim() || !poruka.trim()) {
      alert('Molimo popuni sva polja');
      return;
    }

    const ADMIN_WHATSAPP = '381612563121';
    const message = `*Nova poruka sa sajta Studio27*\n\n*Ime:* ${name}\n*Email:* ${email}\n*Telefon:* ${telefon}\n*Naslov:* ${naslov}\n\n*Poruka:*\n${poruka}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`;

    window.open(whatsappLink, '_blank');

    setName('');
    setEmail('');
    setTelefon('');
    setNaslov('');
    setPoruka('');
    handleClose();
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ ...backdropStyle, opacity: visible ? 1 : 0, backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)' }}
          onClick={handleBackdropClick}
        >
          <div
            ref={panelRef}
            className="bg-white w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl shadow-orange-500/10 relative overflow-hidden border border-gray-100"
            style={{ ...panelStyle, opacity: visible ? 1 : 0, transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)' }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-gray-200 hover:bg-orange-50 hover:border-orange-200 text-gray-400 hover:text-orange-500 transition-all duration-300 text-xl leading-none cursor-pointer"
            >
              &times;
            </button>

            <div className="grid lg:grid-cols-5 grid-cols-1 max-h-[95vh]">
              {/* Left image */}
              <div className="relative lg:col-span-2 h-48 lg:h-auto overflow-hidden bg-gray-100">
                <img
                  src={`${API_URL}/api/uploaded-images/towebp/slikaenterijer.webp`}
                  alt="ContactUs"
                  className="w-full h-full object-cover opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white via-white/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-8 hidden sm:block">
                  <h3 className="text-gray-900 text-xl font-bold mb-2">Započnite<br/>svoju karijeru.</h3>
                  <p className="text-gray-500 text-xs">Prijavite se odmah i osigurajte svoje mesto na našim najtraženijim obukama.</p>
                </div>
              </div>

              {/* Right form */}
              <div className="lg:col-span-3 p-6 lg:p-10 overflow-y-auto max-h-[calc(95vh-12rem)] lg:max-h-[95vh]">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-px bg-orange-400" />
                    <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-orange-500">Kontaktirajte nas</p>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                    Pošaljite nam poruku
                  </h2>
                </div>

                <form className="space-y-5" onSubmit={handleSumit} noValidate>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Vaše ime</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="name" placeholder="Npr. Petar Petrović" className={inputBase} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email adresa</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" name="email" placeholder="email@primer.com" className={inputBase} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Broj telefona</label>
                      <input value={telefon} onChange={(e) => setTelefon(e.target.value)} type="tel" name="phone" placeholder="+381 " className={inputBase} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Naslov poruke</label>
                    <input value={naslov} onChange={(e) => setNaslov(e.target.value)} type="text" name="naslov" placeholder="Npr. Upit za kurs" className={inputBase} />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Detalji poruke</label>
                    <textarea
                      value={poruka}
                      onChange={(e) => setPoruka(e.target.value)}
                      name="message"
                      placeholder="Napišite nam šta vas zanima..."
                      rows={4}
                      className="w-full text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none p-4 transition-all duration-300 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 mt-4 text-white text-sm font-bold tracking-widest uppercase rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 active:scale-[0.98] shadow-lg shadow-orange-500/25 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
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
        className="group inline-flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-white transition-all duration-300 "
        onClick={() => setOpen(true)}
      >
        {textButtona || "Kontaktirajte nas"}
        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </>
  )
}