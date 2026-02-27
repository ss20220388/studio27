import React, {useState,useEffect} from 'react'

const DugmeKontakt = () => {

    const openModal = () => {
        localStorage.setItem('kontakModalOpen', 'true');
        window.dispatchEvent(new Event('openKontaktModal'));
    };
   
    return (
        <button  onClick={openModal} className="text-lg font-semibold px-6 py-2 mt-8 text-gray-300 border border-white rounded-full hover:bg-white hover:text-black">
            Contact
        </button>
    )
}

export default DugmeKontakt