import React, { useEffect, useRef, useState } from 'react'

const backdropStyle: React.CSSProperties = {
  transition: 'opacity 0.35s ease',
}

const panelStyle: React.CSSProperties = {
  transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
}

const inputBase =
  'w-full h-10 text-sm text-gray-800 placeholder-gray-400 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-300 focus:border-red-900 focus:ring-1 focus:ring-red-900/30 outline-none pl-4 transition-all duration-200'

export default function KontaktModal({ }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ ...backdropStyle, opacity: visible ? 1 : 0, backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)' }}
          onClick={handleBackdropClick}
        >
          <div
            ref={panelRef}
            className="bg-neutral-100 w-full max-w-3xl max-h-[95vh] rounded-xl shadow-2xl relative overflow-hidden border border-gray-200/50"
            style={{ ...panelStyle, opacity: visible ? 1 : 0, transform: visible ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(12px)' }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-red-900 text-gray-500 hover:text-white transition-all duration-200 text-lg leading-none"
            >
              &times;
            </button>

            <div className="grid lg:grid-cols-5 grid-cols-1 max-h-[95vh]">
              {/* Left image — 2/5 of the grid */}
              <div className="relative lg:col-span-2 h-44 lg:h-auto overflow-hidden">
                <img
                  src="http://api.studio27.rs/api/uploaded-images/uploads/slikaenterijer.jpg"
                  alt="ContactUs"
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay on image */}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-neutral-100/20" />
              </div>

              {/* Right form — 3/5 */}
              <div className="lg:col-span-3 p-5 lg:p-7 overflow-y-auto max-h-[calc(95vh-11rem)] lg:max-h-[95vh]">
                {/* Header */}
                <div className="mb-5">
                  <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-red-900/70 mb-1">Kontakt</p>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    Pošaljite nam poruku
                  </h2>
                  <div className="w-10 h-0.5 bg-red-900 rounded-full mt-2" />
                </div>

                <form action="https://fabform.io/f/xxxxx" method="post" className="space-y-3.5">
                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Ime</label>
                      <input type="text" name="name" placeholder="Vaše ime" className={inputBase} required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Email</label>
                      <input type="email" name="email" placeholder="email@primer.com" className={inputBase} required />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Telefon</label>
                    <input type="text" name="phone" placeholder="+381..." className={inputBase} />
                  </div>

                  {/* Communication preference */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Način komunikacije</label>
                    <div className="flex gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-lg border border-gray-300 bg-white/60 py-2.5 text-sm text-gray-600 hover:border-red-900/40 has-checked:border-red-900 has-checked:bg-red-900/5 has-checked:text-red-900 transition-all duration-200">
                        <input type="radio" name="contact_method" value="email" className="sr-only" />
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                        <span className="font-medium">Email</span>
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-lg border border-gray-300 bg-white/60 py-2.5 text-sm text-gray-600 hover:border-red-900/40 has-checked:border-red-900 has-checked:bg-red-900/5 has-checked:text-red-900 transition-all duration-200">
                        <input type="radio" name="contact_method" value="phone" className="sr-only" />
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                        <span className="font-medium">Telefon</span>
                      </label>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Poruka</label>
                    <textarea
                      name="message"
                      placeholder="Vaša poruka..."
                      rows={3}
                      className="w-full text-sm text-gray-800 placeholder-gray-400 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-300 focus:border-red-900 focus:ring-1 focus:ring-red-900/30 outline-none p-3 transition-all duration-200 resize-none"
                      required
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full h-11 text-white text-sm font-semibold tracking-wide uppercase rounded-lg bg-red-900 hover:bg-red-800 active:scale-[0.98] shadow-lg shadow-red-900/20 hover:shadow-red-900/30 transition-all duration-200"
                  >
                    Pošalji
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
          Kontakt
        </button>
      
    </>
  )
}