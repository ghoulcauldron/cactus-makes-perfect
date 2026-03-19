import { useState, useRef, useEffect } from "react";
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

export default function SurveyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // --- SURVEY STATE (Scaffolded for tomorrow) ---
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false); // Toggle this to 'true' tomorrow to show buttons
  
  const scrambleRefs = useRef<Record<string, PatternScrambleHandle | null>>({});
  const [loadStep, setLoadStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setLoadStep(prev => (prev < 8 ? prev + 1 : prev));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
      {/* BACKDROP: Deep Void Blur */}
      <div className="absolute inset-0 bg-[#0a001a]/70 backdrop-blur-xl transition-opacity duration-700" />
      
      {/* NOISE GRAIN */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-screen animate-noise-grain" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      <div className="relative w-full max-w-[550px] max-h-[90vh] flex flex-col shadow-[0_0_80px_rgba(0,255,255,0.2)] animate-modal-entry">
        
        {/* IRIDESCENT BORDER */}
        <div className="absolute -inset-[2px] bg-gradient-to-b from-[#00ffff] via-[#FF00FF] to-[#39FF14] opacity-40" />
        
        <div className="relative flex flex-col bg-black border border-white/20 overflow-hidden h-full font-mono">
          
          {/* HEADER: MISSION BRIEFING */}
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
                <p className="text-[9px] text-[#39FF14]/60 mt-1 uppercase tracking-widest">Clearance Level: Top Secret // Eyes Only</p>
              </div>
              <div className="h-8 w-8 rounded-full border border-[#00ffff] flex items-center justify-center animate-spin-slow opacity-50">
                 <div className="h-1 w-1 bg-[#00ffff] rounded-full" />
              </div>
            </div>
          </div>

          {/* CONTENT: THE ITINERARY */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 bg-[radial-gradient(circle_at_center,_#1a0033_0%,_#000000_100%)] text-sm">
            
            {/* TARGET COORDINATES */}
            <div className="border-l-2 border-[#00ffff] pl-4">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#00ffff]/60 mb-1">Target Coordinates</h3>
              <p className="text-white font-bold text-lg">SANTA FE, NEW MEXICO</p>
              <p className="text-[10px] text-[#39FF14]/70 italic">Sector 505 // High Desert Plain</p>
            </div>

            {/* ITINERARY BLOCKS */}
            {[
              { date: "THU AUG 27", label: "ARRIVAL HERE", details: "Rolling infiltration begins. Synchronize watches at landing zone." },
              { date: "FRI AUG 28", label: "ARRIVAL HERE", details: "Midday: Off-World Excursion (Meow Wolf). 6PM: Evening Fueling (Main Event)." },
              { date: "SAT AUG 29", label: "ARRIVAL HERE", details: "6PM: Sky Railway Transport. Night Serenade under desert stars." },
              { date: "SUN AUG 30", label: "DEBRIEF", details: "Midday: Post-Mission Brunch. Evening: Final Transmission + Cinema." }
            ].map((section, idx) => (
              <div key={section.date} className="group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-[#39FF14] text-black px-1 uppercase">{section.date}</span>
                  <div className="h-[1px] flex-1 bg-[#39FF14]/20" />
                </div>
                
                {/* Information Display */}
                <div className="pl-4 py-2 border-l border-white/10 hover:border-[#00ffff]/50 transition-colors">
                  <div className="text-white font-bold flex justify-between items-center">
                    <span>
                      {loadStep >= idx + 2 && (
                        <PatternScramble 
                          ref={(el) => { scrambleRefs.current[section.date] = el; }}
                          text={section.label}
                          {...CYBERPUNK_THEME}
                          startTrigger={true}
                        />
                      )}
                    </span>
                    {/* Placeholder for future checkmark/selection icon */}
                    {selections[section.date] && <span className="text-[#00ffff] text-[10px]">[ SELECTED ]</span>}
                  </div>
                  <p className="text-white/60 text-xs mt-1 leading-relaxed">
                    {section.details}
                  </p>
                  
                  {/* SCAFFOLDED BUTTON (Commented out/Hidden for tonight) */}
                  {isEditMode && (
                    <button 
                      className="mt-3 text-[10px] border border-[#00ffff]/50 px-2 py-1 text-[#00ffff] hover:bg-[#00ffff] hover:text-black"
                      onClick={() => setSelections({...selections, [section.date]: true})}
                    >
                      SELECT TRAJECTORY
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* TRANSIT INTELLIGENCE (The InfoModal 'How') */}
            <div className="bg-[#00ffff]/5 p-4 border border-[#00ffff]/20 rounded-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00ffff] mb-2 border-b border-[#00ffff]/20 pb-1">Infiltration Vectors</h3>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Primary Drop Zone: Fly into <strong>ABQ</strong>. <br/>
                Ground Transport: Rental unit or <span className="text-[#00ffff] underline">Railrunner</span> ($9). <br/>
                <span className="italic opacity-60 mt-2 block">** Tactical Advice: Refuel at Duran's Pharmacy in ABQ.</span>
              </p>
            </div>

            {/* WHAT ELSE */}
            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-[10px] uppercase tracking-widest mb-1 text-[#39FF14]/60">Further Intelligence</p>
              <p className="text-xs text-white/50 italic">
                "Additional data packets will be decrypted once headcounts are locked."
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 bg-black border-t border-white/10 flex justify-between items-center">
            <button onClick={onClose} className="text-[10px] uppercase text-white/40 hover:text-white transition-colors">
              [ Dismiss ]
            </button>
            <div className="text-[9px] text-[#39FF14]/40 uppercase tracking-tighter">
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
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-entry { animation: modal-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}