import { useState, useRef, useEffect } from "react";
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

export default function SurveyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const scrambleRefs = useRef<Record<string, PatternScrambleHandle | null>>({});
  const [loadStep, setLoadStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setLoadStep(prev => (prev < 6 ? prev + 1 : prev));
      }, 120);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto overflow-hidden">
      {/* GLASS BACKDROP */}
      <div className="absolute inset-0 bg-[#0a001a]/70 backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-700" />
      
      {/* ANALOG NOISE */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-screen animate-noise-grain" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      <div className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-[0_0_80px_rgba(0,255,255,0.2)] animate-modal-entry">
        
        {/* IRIDESCENT BORDER */}
        <div className="absolute -inset-[2px] bg-gradient-to-b from-[#00ffff] via-[#FF00FF] to-[#39FF14] opacity-50" />
        
        <div className="relative flex flex-col bg-black border border-white/20 overflow-hidden h-full font-mono">
          
          {/* HEADER */}
          <div className="p-6 border-b border-[#00ffff]/30 bg-gradient-to-b from-[#1a0033] to-black">
            <div className="flex justify-between items-start">
              <div onMouseEnter={() => scrambleRefs.current['header']?.triggerHover()}>
                <div className="text-[10px] tracking-[0.4em] mb-1 text-[#00ffff]">
                  {loadStep >= 1 && (
                    <PatternScramble 
                      ref={(el) => { scrambleRefs.current['header'] = el; }}
                      text="/// OPERATION: 20 YEAR DARE ///" 
                      {...CYBERPUNK_THEME}
                      startTrigger={true}
                    />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tighter italic uppercase">
                  Mission <span className="text-[#39FF14]">Briefing</span>
                </h2>
              </div>
              <div className="h-8 w-8 rounded-full border border-[#00ffff]/40 flex items-center justify-center animate-spin-slow">
                 <div className="h-1 w-1 bg-[#00ffff] rounded-full" />
              </div>
            </div>
          </div>

          {/* CONTENT: THEMATIC STREAMLINED ITINERARY */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 bg-[radial-gradient(circle_at_center,_#1a0033_0%,_#000000_100%)] text-sm">
            
            {[
              { 
                date: "THU AUG 27", 
                label: "PRIMARY INFILTRATION", 
                details: "Rolling infiltration begins.",
                id: 2
              },
              { 
                date: "FRI AUG 28", 
                label: "THE PSYCHE-FEASTIA", 
                details: "Midday: Off-World Excursion (Feelin' Psychedelic)\n6PM: Ceremonial Feast",
                id: 3
              },
              { 
                date: "SAT AUG 29", 
                label: "ATMOSPHERIC TRANSIT", 
                details: "6PM: Ride into the sky",
                id: 4
              },
              { 
                date: "SUN AUG 30", 
                label: "POST-MISSION DEBRIEF", 
                details: "Midday: Brunch\nEvening: Final Transmission + Soft Entertainment",
                id: 5
              }
            ].map((section) => (
              <div key={section.date} className="group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-[#39FF14] text-black px-1 uppercase">{section.date}</span>
                  <div className="h-[1px] flex-1 bg-[#39FF14]/20" />
                </div>
                
                <div className="pl-4 py-1 border-l border-white/10 hover:border-[#00ffff]/50 transition-colors cursor-default">
                  <div className="text-white font-bold tracking-tight" onMouseEnter={() => scrambleRefs.current[section.date]?.triggerHover()}>
                    {loadStep >= section.id && (
                      <PatternScramble 
                        ref={(el) => { scrambleRefs.current[section.date] = el; }}
                        text={section.label}
                        {...CYBERPUNK_THEME}
                        startTrigger={true}
                        speed={0.5}
                      />
                    )}
                  </div>
                  <p className="text-white/60 text-xs mt-1 leading-relaxed whitespace-pre-line">
                    {section.details}
                  </p>
                </div>
              </div>
            ))}

            {/* INFILTRATION VECTORS (Tactical Info) */}
            <div className="bg-[#00ffff]/5 p-4 border border-[#00ffff]/20 rounded-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00ffff] mb-2 border-b border-[#00ffff]/20 pb-1">Infiltration Vectors</h3>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Primary Drop Zone: <strong>ALBUQUERQUE (ABQ)</strong>. <br/>
                Ground Transport: Rental unit or Railrunner ($9). <br/>
                <span className="italic opacity-60 mt-2 block text-[10px]">
                  ** TACTICAL ADVICE: Refuel at Duran's Pharmacy before ABQ departure.
                </span>
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 bg-black border-t border-white/10 flex justify-between items-center">
            <button onClick={onClose} className="text-[10px] uppercase text-white/40 hover:text-white transition-colors font-mono tracking-widest">
              [ Dismiss ]
            </button>
            <div className="text-[9px] text-[#39FF14]/40 uppercase tracking-[0.2em]">
              Transmission End // Stand By
            </div>
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
          0% { opacity: 0; transform: translateY(15px) scale(0.98); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }
        .animate-modal-entry { animation: modal-entry 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}