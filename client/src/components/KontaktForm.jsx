import { useState } from 'react';

export default function KontaktForm() {
  const [formData, setFormData] = useState({
    ime: '',
    email: '',
    telefon: '',
    komunikacija: 'email',
    poruka: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const ADMIN_WHATSAPP = '381612563121';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.ime.trim()) {
      alert('Molimo unesi ime');
      return false;
    }
    if (!formData.email.trim()) {
      alert('Molimo unesi email');
      return false;
    }
    if (!formData.telefon.trim()) {
      alert('Molimo unesi telefon');
      return false;
    }
    if (!formData.poruka.trim()) {
      alert('Molimo unesi poruku');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    // Konstruiši poruku za WhatsApp
    const message = `*Nova poruka sa sajta Studio27*

*Ime:* ${formData.ime}
*Email:* ${formData.email}
*Telefon:* ${formData.telefon}
*Preferovana komunikacija:* ${formData.komunikacija}

*Poruka:*
${formData.poruka}`;

    // Kodiraj poruku za URL
    const encodedMessage = encodeURIComponent(message);

    // Kreiraj WhatsApp link
    const whatsappLink = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`;

    // Otvori WhatsApp u novoj tab
    window.open(whatsappLink, '_blank');

    // Resetuj formu
    setFormData({
      ime: '',
      email: '',
      telefon: '',
      komunikacija: 'email',
      poruka: ''
    });

    // Prikaži potvrdu
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <h2 className="text-red-900 font-manrope text-4xl font-semibold leading-10 mb-11">
        Send Us A Message
      </h2>

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-center">
          ✓ WhatsApp je otvoren! Poruka je pripremljena.
        </div>
      )}

      <input
        type="text"
        name="ime"
        value={formData.ime}
        onChange={handleChange}
        className="w-full h-12 text-gray-600 placeholder-gray-400 shadow-sm bg-transparent text-lg font-normal leading-7 rounded-full border border-gray-200 focus:outline-none focus:border-red-500 pl-4 mb-10"
        placeholder="Name"
      />

      <input
        type="text"
        name="email"
        value={formData.email}
        onChange={handleChange}
        className="w-full h-12 text-gray-600 placeholder-gray-400 shadow-sm bg-transparent text-lg font-normal leading-7 rounded-full border border-gray-200 focus:outline-none focus:border-red-500 pl-4 mb-10"
        placeholder="Email"
      />

      <input
        type="tel"
        name="telefon"
        value={formData.telefon}
        onChange={handleChange}
        className="w-full h-12 text-gray-600 placeholder-gray-400 shadow-sm bg-transparent text-lg font-normal leading-7 rounded-full border border-gray-200 focus:outline-none focus:border-red-500 pl-4 mb-10"
        placeholder="Phone"
      />

      <div className="mb-10">
        <h4 className="text-gray-500 text-lg font-normal leading-7 mb-4">
          Preferred method of communication
        </h4>
        <div className="flex">
          <div className="flex items-center mr-11">
            <input
              id="radio-email"
              type="radio"
              name="komunikacija"
              value="email"
              checked={formData.komunikacija === 'email'}
              onChange={handleChange}
              className="hidden"
            />
            <label
              htmlFor="radio-email"
              className="flex items-center cursor-pointer text-gray-500 text-base font-normal leading-6"
            >
              <span
                className={`border rounded-full mr-2 w-4 h-4 ml-2 ${
                  formData.komunikacija === 'email'
                    ? 'border-red-900 bg-red-900'
                    : 'border-gray-300'
                }`}
              ></span>
              Email
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="radio-phone"
              type="radio"
              name="komunikacija"
              value="phone"
              checked={formData.komunikacija === 'phone'}
              onChange={handleChange}
              className="hidden"
            />
            <label
              htmlFor="radio-phone"
              className="flex items-center cursor-pointer text-gray-500 text-base font-normal leading-6"
            >
              <span
                className={`border rounded-full mr-2 w-4 h-4 ml-2 ${
                  formData.komunikacija === 'phone'
                    ? 'border-red-900 bg-red-900'
                    : 'border-gray-300'
                }`}
              ></span>
              Phone
            </label>
          </div>
        </div>
      </div>

      <textarea
        name="poruka"
        value={formData.poruka}
        onChange={handleChange}
        className="w-full h-32 text-gray-600 placeholder-gray-400 bg-transparent text-lg shadow-sm font-normal leading-7 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 p-4 mb-10 resize-none"
        placeholder="Message"
      ></textarea>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 text-white text-base font-semibold leading-6 rounded-full transition-all duration-700 hover:bg-red-800 bg-red-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Slanje...' : 'Send'}
      </button>
    </form>
  );
}
