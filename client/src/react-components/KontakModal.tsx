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
    const to = "stojanovicstefana157@gmail.com";
    const pravaPoruka = `${poruka} \n\n Sa pozdravom, ${name}\nEmail: ${email}\nTelefon: ${telefon}\n`;
    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(to)}` +
      `&su=${encodeURIComponent(naslov)}` +
      `&body=${encodeURIComponent(pravaPoruka)}`;

    window.location.href = gmailUrl;

    handleClose();
  }

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

                <form action="https://fabform.io/f/xxxxx" method="post" className="space-y-3.5" onSubmit={handleSumit}>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Ime</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="name" placeholder="Vaše ime" className={inputBase} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Email</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" name="email" placeholder="email@primer.com" className={inputBase} required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Telefon</label>
                      <input value={telefon} onChange={(e) => setTelefon(e.target.value)} type="tel" name="phone" placeholder="Vaš telefon" className={inputBase} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Naslov</label>
                    <input value={naslov} onChange={(e) => setNaslov(e.target.value)} type="text" name="name" placeholder="Naslov poruke" className={inputBase} required />
                  </div>
                  {/* Name + Email row */}



                  {/* Message */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Poruka</label>
                    <textarea
                      value={poruka}
                      onChange={(e) => setPoruka(e.target.value)}
                      name="message"
                      placeholder="Vaša poruka..."
                      rows={5}
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