import { useState } from "react";

export default function SurveyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#1a0033] border-2 border-[#00ffff] p-8 text-white max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-[#00ffff]">SYSTEM RECOVERY MODE</h2>
        <p className="mb-6 font-mono text-sm">
          If you can see this, the Welcome page is working and the conflict is within the advanced Modal styling/imports.
        </p>
        <button 
          onClick={onClose}
          className="bg-[#00ffff] text-black px-4 py-2 font-bold hover:bg-white transition"
        >
          CLOSE RECOVERY
        </button>
      </div>
    </div>
  );
}