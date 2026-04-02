import React from "react";

export const ImageModal = ({
  open,
  onClose,
  imageUrl,
}: {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
}) => {
  if (!open || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors shadow-lg cursor-pointer"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <img
          src={imageUrl}
          alt="Slika uplatnice"
          className="max-w-full max-h-[85vh] object-contain rounded-xl border border-neutral-700 shadow-2xl"
        />
      </div>
    </div>
  );
};
