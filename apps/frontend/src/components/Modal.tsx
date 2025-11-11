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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-[90%] transform transition-all scale-100 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="modal-title" className="text-2xl font-semibold text-gray-900 mb-4">
            {title}
          </h2>
        )}
        <div>{children}</div>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-3 bg-cactus-green text-white rounded-lg hover:bg-cactus-green-dark transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;