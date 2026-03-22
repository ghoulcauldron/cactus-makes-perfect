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
      {/* Deep Void Backdrop with a hint of Bioluminescence */}
      <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={onCancel} />
      
      {/* Organic "Living Chrome" Container */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-white/10 to-transparent border border-white/20 rounded-[40px] shadow-[0_0_100px_rgba(0,255,255,0.1)] p-10 overflow-hidden backdrop-blur-xl">
        
        {/* Floating Ethereal Orbs (The Abyss style) */}
        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-[#00ffff]/10 blur-[80px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-[#39FF14]/10 blur-[80px] rounded-full animate-pulse" />

        <div className="relative z-10">
          <h3 className="text-[#00ffff] text-[10px] tracking-[0.8em] uppercase mb-10 text-center opacity-80">
            <PatternScramble 
              text="SYNAPTIC_VERIFICATION" 
              {...CYBERPUNK_THEME} 
              startTrigger={isOpen} 
            />
          </h3>

          <div className="space-y-8 mb-12">
            <div className="text-center">
              <p className="text-[9px] text-[#39FF14]/40 uppercase tracking-[0.3em] mb-2">Arrival Vector</p>
              <p className="text-white text-lg uppercase tracking-[0.2em] font-light italic">
                {data.arrival_day ? `${data.arrival_day} Aug 2026` : "Pending..."}
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-md">
              <p className="text-[9px] text-[#00ffff]/40 uppercase tracking-[0.3em] mb-4 text-center">Neural Imprints</p>
              <div className="space-y-3">
                {data.events.length > 0 ? (
                  data.events.map((e, i) => (
                    <div key={i} className="text-white/90 text-[10px] uppercase tracking-widest flex items-center justify-center">
                      <span className="w-1 h-1 bg-[#00ffff] rounded-full mr-3 shadow-[0_0_8px_#00ffff]" />
                      <PatternScramble 
                        text={e} 
                        {...CYBERPUNK_THEME} 
                        startTrigger={isOpen} 
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-white/20 text-[10px] italic text-center uppercase tracking-widest">No Signal Detected</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={onConfirm}
              className="w-full bg-white/90 text-black py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-[#00ffff] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all duration-700"
            >
              [ COMMENCE_LINK ]
            </button>
            <button 
              onClick={onCancel}
              className="w-full text-white/30 py-2 text-[8px] uppercase tracking-[0.4em] hover:text-white transition-all"
            >
              DISCONNECT_FEED
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}