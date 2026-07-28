// BuyButton.jsx
import React, { useState } from "react";

export default function BuyButton({ kurs }) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    if (!kurs) return;

    if (typeof window !== "undefined") {
      // Dohvati trenutnu korpu
      let currentCart = [];
      try {
        const saved = localStorage.getItem("cart_items");
        if (saved) currentCart = JSON.parse(saved);
      } catch (e) {
        currentCart = [];
      }

      // Proveri da li kurs već postoji u korpi
      const existingIndex = currentCart.findIndex((item) => item.id === kurs.id);

      if (existingIndex > -1) {
        currentCart[existingIndex].quantity += 1;
      } else {
        currentCart.push({
          id: kurs.id,
          title: kurs.naziv || "Kurs",
          subtitle: kurs.opis || "",
          price: kurs.cena || 0,
          quantity: 1,
          image: kurs.slikaUrl || "",
        });
      }

      // Sačuvaj u localStorage
      localStorage.setItem("cart_items", JSON.stringify(currentCart));

      // Emituj event za osvežavanje korpe ako imate listener
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: currentCart }));

      // Vizuelna povratna informacija
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      className="w-full sm:w-auto px-8 py-4 bg-[#f05a24] hover:bg-[#d94e1f] text-white font-bold text-base rounded-full shadow-lg transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
    >
      {isAdded ? "Dodato u korpu! ✓" : "Kupi kurs"}
    </button>
  );
}