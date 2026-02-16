import React, { useState, useMemo } from "react";

type GroupCreateModalProps = {
  onClose: () => void;
  onConfirm: (groupLabel: string) => void;
};

function canonicalizeGroupLabelInput(input: string) {
  const trimmed = (input || "").trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function GroupCreateModal({ onClose, onConfirm }: GroupCreateModalProps) {
  const [input, setInput] = useState("");
  
  const canonical = useMemo(() => canonicalizeGroupLabelInput(input), [input]);
  const isValid = !!canonical && canonical.length > 2;

  function handleSubmit() {
    if (isValid && canonical) {
      onConfirm(canonical);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-[400px] rounded-lg bg-black shadow-2xl border border-[#45CC2D] text-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#45CC2D]/30 bg-neutral-900/50">
          <h2 className="text-lg font-bold uppercase tracking-wider text-[#45CC2D]">Create New Group</h2>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Group Label</label>
            <input
              autoFocus
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none transition-all placeholder-gray-800"
              placeholder="e.g. The Smith Family"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValid) handleSubmit();
                if (e.key === 'Escape') onClose();
              }}
            />
            {input && (
              <div className="mt-2 text-[10px] text-gray-500 font-mono">
                System ID: <span className="text-[#45CC2D]">{canonical || "..."}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400 bg-neutral-900/50 p-2 rounded border border-gray-800">
            <span className="font-bold text-white">Note:</span> This will assign the selected guests to this new group ID.
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-800 bg-neutral-900/30 flex justify-between items-center">
          <button onClick={onClose} className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors">
            Cancel
          </button>
          <button
            disabled={!isValid}
            onClick={handleSubmit}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all
              ${isValid ? "bg-[#45CC2D] text-black hover:brightness-110" : "bg-gray-800 text-gray-600 cursor-not-allowed"}
            `}
          >
            Create & Assign
          </button>
        </div>
      </div>
    </div>
  );
}