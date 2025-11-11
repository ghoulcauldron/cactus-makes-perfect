import React from "react";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          aria-label="Close schedule modal"
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-center">Event Schedule</h2>
        <div className="space-y-3 text-gray-700">
          <p><strong>5:00 PM</strong> — Welcome Drinks</p>
          <p><strong>6:00 PM</strong> — Dinner Service</p>
          <p><strong>7:30 PM</strong> — Speeches & Toasts</p>
          <p><strong>9:00 PM</strong> — Dancing & Desserts</p>
          <p><strong>11:00 PM</strong> — Farewell</p>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-cactus-green text-white hover:bg-cactus-green/80 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;