import React, {useState,useEffect} from 'react'

const DugmeKontakt = () => {

    const openModal = () => {
        localStorage.setItem('kontakModalOpen', 'true');
        window.dispatchEvent(new Event('openKontaktModal'));
    };
   
    return (
        <button  onClick={openModal} className="text-lg font-semibold px-6 py-2 mt-8 text-white border bg-[#e0533c] border-white rounded-full hover:bg-[#c8432d] transition-colors duration-200 shadow-md">
            Contact
        </button>
    )
}

export default DugmeKontakt