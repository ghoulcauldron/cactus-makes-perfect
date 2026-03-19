import { useState, useRef, useEffect } from "react";
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

export default function SurveyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const scrambleRefs = useRef<Record<string, PatternScrambleHandle | null>>({});
  
  // Controls the staggered "loading" feel
  const [loadStep, setLoadStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setLoadStep(prev => (prev < 6 ? prev + 1 : prev));
      }, 150); // Speed of the cascade
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-[#0a001a]/70 backdrop-blur-xl transition-opacity duration-700" />
      
      {/* NOISE GRAIN overlay on modal */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-screen animate-noise-grain" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      <div className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-[0_0_80px_rgba(0,255,255,0.3)] animate-modal-entry">
        
        {/* IRIDESCENT BORDER */}
        <div className="absolute -inset-[2px] bg-gradient-to-b from-[#00ffff] via-[#FF00FF] to-[#39FF14] opacity-60" />
        
        <div className="relative flex flex-col bg-black border border-white/20 overflow-hidden h-full">
          
          {/* HEADER */}
          <div className="p-6 border-b border-[#00ffff]/30 bg-gradient-to-b from-[#1a0033] to-black">
            <div className="flex justify-between items-start">
              <div onMouseEnter={() => scrambleRefs.current['header']?.triggerHover()}>
                <div className="text-[10px] tracking-[0.4em] mb-1 text-[#00ffff] font-mono">
                  {loadStep >= 1 && (
                    <PatternScramble 
                      ref={(el) => { scrambleRefs.current['header'] = el; }}
                      text="/// AUTHENTICATION REQUIRED ///" 
                      {...CYBERPUNK_THEME}
                      startTrigger={true}
                      speed={0.6}
                    />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tighter italic uppercase">
                  TRAJECTORY <span className="text-[#39FF14]">SYNC</span>
                </h2>
              </div>
            </div>
          </div>

          {/* CONTENT: Staggered list items */}
          <div className="p-6 overflow-y-auto space-y-8 bg-[radial-gradient(circle_at_center,_#1a0033_0%,_#000000_100%)]">
            {[
              { date: "AUG 27", id: 2, items: [{ id: "th_arr", label: "INITIAL INFILTRATION" }] },
              { date: "AUG 28", id: 3, items: [
                { id: "fr_mw", label: "OFF-WORLD: MEOW WOLF" },
                { id: "fr_din", label: "COMMUNAL FUELING (6PM)" }
              ]},
              { date: "AUG 29", id: 4, items: [{ id: "sa_rail", label: "SUNSET SERENADE" }] },
              { date: "AUG 30", id: 5, items: [{ id: "su_br", label: "POST-MISSION BRUNCH" }] }
            ].map((section) => (
              <div key={section.date}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold bg-[#39FF14] text-black px-1 font-mono">{section.date}</span>
                  <div className="h-[1px] flex-1 bg-[#39FF14]/20" />
                </div>
                {section.items.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setSelections(s => ({ ...s, [item.id]: !s[item.id] }))}
                    onMouseEnter={() => scrambleRefs.current[item.id]?.triggerHover()}
                    className={`w-full text-left px-4 py-3 mb-3 font-mono text-sm border-l-4 transition-all duration-300 relative 
                      ${selections[item.id] ? "bg-[#00ffff]/20 border-[#00ffff] text-white" : "bg-black/40 border-[#39FF14]/40 text-[#39FF14] hover:bg-[#00ffff]/5"}`}
                  >
                    <div className="relative z-10 pointer-events-none">
                      {loadStep >= section.id && (
                        <PatternScramble 
                          ref={(el) => { scrambleRefs.current[item.id] = el; }}
                          text={item.label}
                          {...CYBERPUNK_THEME}
                          startTrigger={true}
                          speed={0.4}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div className="p-4 bg-black border-t border-white/10 flex justify-between items-center">
            <button onClick={onClose} className="text-[10px] uppercase text-white/40 font-mono hover:text-white transition-colors">
              [ Abort_Mission ]
            </button>
            <button 
              className="group px-6 py-2 border border-[#00ffff] text-[#00ffff] font-mono hover:bg-[#00ffff] hover:text-black transition-all"
              onMouseEnter={() => scrambleRefs.current['transmit']?.triggerHover()}
            >
              {loadStep >= 6 && (
                <PatternScramble 
                  ref={(el) => { scrambleRefs.current['transmit'] = el; }} 
                  text="TRANSMIT DATA" 
                  startTrigger={true} 
                  colors={["#000", "#0ff"]} 
                />
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes noise-grain {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(-1%, 2%); }
        }
        .animate-noise-grain { animation: noise-grain 0.1s steps(1) infinite; }
        
        @keyframes modal-entry {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-entry { animation: modal-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}