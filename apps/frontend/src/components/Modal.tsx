// File: apps/frontend/src/components/Modal.tsx
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      // Overlay: Darker black with heavy blur for immersion
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
      tabIndex={-1}
    >
      {/* Container: 
        - Black background
        - Neon Green Border
        - Sharp corners (terminal style)
        - Outer Glow 
      */}
      <div
        className="relative bg-black border border-[#45CC2D] shadow-[0_0_40px_rgba(69,204,45,0.15)] max-w-lg w-[90%] transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Corner Accents (Tech/HUD look) */}
        <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#45CC2D]" />
        <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-[#45CC2D]" />
        <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-[#45CC2D]" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#45CC2D]" />

        {/* Content Wrapper */}
        <div className="p-6 relative">
            
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6 border-b border-[#45CC2D]/30 pb-3">
            {title ? (
              <h2 id="modal-title" className="text-lg font-mono font-bold text-[#45CC2D] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(69,204,45,0.5)]">
                {title} <span className="animate-pulse">_</span>
              </h2>
            ) : <div />}
            
            {/* Terminal Close Button [X] */}
            <button
              onClick={onClose}
              className="group flex items-center justify-center w-6 h-6 border border-transparent hover:border-[#45CC2D] text-[#45CC2D] hover:bg-[#45CC2D] hover:text-black transition-all"
              aria-label="Close"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>

          {/* Main Body Content */}
          <div className="font-mono text-[#45CC2D]">
            {children}
          </div>

          {/* Footer Text (Decorative status line) */}
          <div className="mt-6 pt-2 border-t border-[#45CC2D]/20 flex justify-between items-center opacity-50 text-[10px] font-mono uppercase tracking-widest">
            <span>SECURE CONNECTION</span>
            <span>ENCRYPTED // V.2.0.26</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Modal;