import React, {useState,useEffect} from 'react'

const DugmeKontakt = () => {

    const openModal = () => {
        localStorage.setItem('kontakModalOpen', 'true');
        window.dispatchEvent(new Event('openKontaktModal'));
    };
   
    return (
        <button  onClick={openModal} className="text-lg  rounded-full font-semibold px-6 py-2 mt-8 text-white  bg-[#550000]  hover:bg-[#c8432d] transition-colors duration-200 ">
            Kontakt
        </button>
    )
}

export default DugmeKontakt