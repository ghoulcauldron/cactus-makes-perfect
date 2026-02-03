import React from "react";

export default function AddGuestSuccessModal({
  created,
  existing,
  invitesAttempted,
  onClose,
}: {
  created: number;
  existing: number;
  invitesAttempted: boolean;
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
            <span className="font-bold">{created}</span>{" "}
            {created === 1 ? "guest was" : "guests were"} created.
          </p>

          {existing > 0 && (
            <p className="text-gray-400">
              <span className="font-bold">{existing}</span>{" "}
              {existing === 1
                ? "guest already existed"
                : "guests already existed"}{" "}
              and were left unchanged.
            </p>
          )}

          {invitesAttempted && (
            <p className="text-[#45CC2D] text-xs uppercase font-bold tracking-wide pt-2">
              ✓ Invites sent
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