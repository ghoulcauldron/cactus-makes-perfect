import React from "react";

export default function AddGuestSuccessModal({
  count,
  invitesSent,
  onClose,
}: {
  count: number;
  invitesSent: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg bg-black border border-[#45CC2D]/30 shadow-2xl text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold uppercase tracking-tight">
            Guests Added
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 text-sm">
          <p>
            <span className="font-bold">{count}</span>{" "}
            {count === 1 ? "guest has" : "guests have"} been successfully added.
          </p>

          {invitesSent && (
            <p className="text-[#45CC2D]">
              Invitations were sent automatically.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800 flex justify-end">
          <button
            className="px-4 py-2 text-sm font-bold uppercase bg-[#45CC2D] text-black hover:scale-105 active:scale-95 transition-all"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}