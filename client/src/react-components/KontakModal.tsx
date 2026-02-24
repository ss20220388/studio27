import React, { useEffect, useState } from 'react'

interface KontaktModalProps {
  triggerId?: string; // ID elementa koji otvara modal
}

export default function KontaktModal({ triggerId }: KontaktModalProps) {
  const [open, setOpen] = useState(false);

  // Poveži klik na header link sa otvaranjem modala
  useEffect(() => {
    if (!triggerId) return;
    const el = document.getElementById(triggerId);
    if (!el) return;
    const handleClick = () => setOpen(true);
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [triggerId]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 w-full max-w-4xl mx-4 lg:mx-0 rounded-2xl shadow-lg relative overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-700 hover:text-red-700 text-2xl font-bold"
            >
              &times;
            </button>

            <div className="grid lg:grid-cols-2 grid-cols-1">
              {/* Left side image */}
              <div className="relative h-full">
                <img
                  src="http://api.studio27.rs/api/media?remoteFilePath=/uploads/slikaenterijer.jpg"
                  alt="ContactUs"
                  className="w-full h-full lg:rounded-l-2xl rounded-t-2xl object-cover"
                />
              </div>

              {/* Right side form */}
              <div className="p-5 lg:p-11">
                <h2 className="text-red-900 font-manrope text-4xl font-semibold leading-10 mb-11">
                  Send Us A Message
                </h2>
                <form action="https://fabform.io/f/xxxxx" method="post" className="space-y-6">

                  <div className="border-2 border-gray-300 rounded-full p-1">
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      className="w-full h-12 text-gray-600 placeholder-gray-400 shadow-sm bg-transparent text-lg font-normal leading-7 rounded-full border-none focus:outline-none pl-4"
                      required
                    />
                  </div>

                  <div className="border-2 border-gray-300 rounded-full p-1">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      className="w-full h-12 text-gray-600 placeholder-gray-400 shadow-sm bg-transparent text-lg font-normal leading-7 rounded-full border-none focus:outline-none pl-4"
                      required
                    />
                  </div>

                  <div className="border-2 border-gray-300 rounded-full p-1">
                    <input
                      type="text"
                      name="phone"
                      placeholder="Phone"
                      className="w-full h-12 text-gray-600 placeholder-gray-400 shadow-sm bg-transparent text-lg font-normal leading-7 rounded-full border-none focus:outline-none pl-4"
                    />
                  </div>

                  {/* Radio buttons uokvireni */}
                  <div className="border-2 border-gray-300 rounded-lg p-4">
                    <h4 className="text-gray-500 text-lg font-normal leading-7 mb-4">
                      Preferred method of communication
                    </h4>
                    <div className="flex space-x-8">
                      <label className="flex items-center space-x-2 text-gray-500 text-base font-semibold leading-6 border-2 border-gray-300 rounded-lg p-2 cursor-pointer">
                        <input
                          type="radio"
                          name="contact_method"
                          value="email"
                          className="form-radio h-4 w-4 text-indigo-600"
                        />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center space-x-2 text-gray-500 text-base font-semibold leading-6 border-2 border-gray-300 rounded-lg p-2 cursor-pointer">
                        <input
                          type="radio"
                          name="contact_method"
                          value="phone"
                          className="form-radio h-4 w-4 text-indigo-600"
                        />
                        <span>Phone</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-2 border-gray-300 rounded-lg p-2">
                    <textarea
                      name="message"
                      placeholder="Message"
                      className="w-full h-32 text-gray-600 placeholder-gray-400 bg-transparent text-lg shadow-sm font-normal leading-7 rounded-lg border-none focus:outline-none p-4"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 text-white text-base font-semibold leading-6 rounded-full transition-all duration-700 hover:bg-red-800 bg-red-900 shadow-sm"
                  >
                    Send
                  </button>

                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}