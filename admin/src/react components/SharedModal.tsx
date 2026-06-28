import React from "react";
import { createPortal } from "react-dom";

export const SharedModal = ({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) => {
  if (!open) return null;
  
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} style={{paddingInline:"20px", paddingBlock:"10px"}}>
      <div
        className={`bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl ${wide ? "w-full max-w-2xl" : "w-full max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="w-7 cursor-pointer h-7 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors">×</button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  // Use createPortal to render the modal directly into the body
  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
};
