import { PatternScramble } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  data: {
    arrival_day: string | null;
    events: string[];
  };
}

export default function ConfirmationModal({ isOpen, onConfirm, onCancel, data }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 font-mono">
      {/* Heavy backdrop to isolate the final decision */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onCancel} />
      
      <div className="relative w-full max-w-md bg-black border-2 border-[#39FF14] shadow-[0_0_50px_rgba(57,255,20,0.2)] p-8 overflow-hidden">
        {/* Animated Scanning Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#39FF14] opacity-50 animate-scan-fast z-0" />
        
        <div className="relative z-10">
          <h3 className="text-[#39FF14] text-xs tracking-[0.6em] uppercase mb-8 border-b border-[#39FF14]/30 pb-2">
            <PatternScramble 
              text="Final Verification" 
              {...CYBERPUNK_THEME} 
              startTrigger={isOpen} 
            />
          </h3>

          <div className="space-y-6 mb-10">
            <div>
              <p className="text-[10px] text-white/40 uppercase mb-1">Arrival Window:</p>
              <p className="text-[#00ffff] text-sm uppercase tracking-widest font-bold">
                {data.arrival_day ? `${data.arrival_day} Aug 2026` : "Not Selected"}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-white/40 uppercase mb-2">Confirmed Operations:</p>
              <div className="space-y-1">
                {data.events.length > 0 ? (
                  data.events.map((e, i) => (
                    <div key={i} className="text-white text-[10px] uppercase tracking-tighter flex items-center">
                      <span className="text-[#39FF14] mr-2">▶</span> 
                      <PatternScramble 
                        text={e} 
                        {...CYBERPUNK_THEME} 
                        startTrigger={isOpen} 
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-white/20 text-[10px] italic">No operations confirmed.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className="w-full bg-[#39FF14] text-black py-4 text-xs font-bold uppercase tracking-[0.4em] hover:bg-white transition-colors"
            >
              [ Finalize Transmission ]
            </button>
            <button 
              onClick={onCancel}
              className="w-full border border-white/20 text-white/50 py-3 text-[9px] uppercase tracking-widest hover:text-white hover:border-white/40 transition-all"
            >
              Abort & Modify
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-fast {
          0% { transform: translateY(0); }
          100% { transform: translateY(400px); }
        }
        .animate-scan-fast {
          animation: scan-fast 2s linear infinite;
        }
      `}</style>
    </div>
  );
}