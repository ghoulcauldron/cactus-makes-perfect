import { useState, useRef } from "react";
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

export default function SurveyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const scrambleRefs = useRef<Record<string, PatternScrambleHandle | null>>({});

  const toggle = (key: string) => {
    if ("vibrate" in navigator) navigator.vibrate(10);
    setSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden pointer-events-auto">
      
      {/* BACKDROP BLUR */}
      <div className="absolute inset-0 bg-[#0a001a]/70 backdrop-blur-xl transition-opacity duration-500" />
      
      {/* NOISE GRAIN */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none animate-noise-grain" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      {/* MODAL BOX */}
      <div className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.9)] animate-modal-entry">
        
        {/* IRIDESCENT BORDER */}
        <div className="absolute -inset-[1px] bg-gradient-to-b from-[#00ffff] via-[#8e59c3] to-[#2E7D32] opacity-50" />
        
        <div className="relative flex flex-col bg-black border border-white/10 overflow-hidden h-full">
          
          {/* HEADER */}
          <div className="p-6 border-b border-[#00ffff]/30 bg-gradient-to-b from-[#1a0033] to-black">
            <div className="flex justify-between items-start">
              <div onMouseEnter={() => scrambleRefs.current['header']?.triggerHover()}>
                <div className="text-[10px] tracking-[0.4em] mb-1 text-[#00ffff] font-mono">
                   <PatternScramble 
                    ref={(el) => { scrambleRefs.current['header'] = el; }}
                    text="/// AUTHENTICATION REQUIRED ///" 
                    {...CYBERPUNK_THEME}
                    speed={0.8}
                  />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tighter italic uppercase">
                  TRAJECTORY <span className="text-[#2E7D32]">SYNC</span>
                </h2>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6 overflow-y-auto space-y-8 bg-[radial-gradient(circle_at_center,_#1a0033_0%,_#000000_100%)]">
            {[
              { date: "AUG 27", items: [{ id: "thursday_arrival", label: "INITIAL INFILTRATION" }] },
              { date: "AUG 28", items: [
                { id: "friday_meowwolf", label: "OFF-WORLD: FEELIN' PSYCHEDELIA" },
                { id: "friday_dinner", label: "COMMUNAL FUELING (6PM)" }
              ]},
              { date: "AUG 29", items: [{ id: "saturday_railway", label: "SUNSET SERENADE" }] },
              { date: "AUG 30", items: [
                { id: "sunday_brunch", label: "POST-MISSION BRUNCH" },
                { id: "sunday_movie", label: "FINAL TRANSMISSION" }
              ]}
            ].map((section) => (
              <div key={section.date}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold bg-[#2E7D32] text-black px-1 font-mono">{section.date}</span>
                  <div className="h-[1px] flex-1 bg-[#2E7D32]/30" />
                </div>
                {section.items.map(item => {
                  const active = selections[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      onMouseEnter={() => scrambleRefs.current[item.id]?.triggerHover()}
                      className={`w-full text-left px-4 py-3 mb-3 font-mono text-sm border-l-4 transition-all duration-300 relative overflow-hidden
                        ${active ? "bg-[#00ffff]/20 border-[#00ffff] text-white" : "bg-black/40 border-[#2E7D32]/40 text-[#2E7D32] hover:bg-[#00ffff]/5"}`}
                    >
                      <div className="relative z-10 pointer-events-none">
                        <PatternScramble 
                          ref={(el) => { scrambleRefs.current[item.id] = el; }}
                          text={item.label}
                          {...CYBERPUNK_THEME}
                          speed={0.6}
                          startTrigger={false}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div className="p-4 bg-black border-t border-white/10 flex justify-between items-center">
            <button onClick={onClose} className="text-[10px] uppercase text-white/40 hover:text-white font-mono transition-colors">
              [ Abort_Mission ]
            </button>
            <button 
              className="group relative px-6 py-2 overflow-hidden border border-[#00ffff] text-[#00ffff]"
              onClick={() => console.log("TRANSMIT", selections)}
              onMouseEnter={() => scrambleRefs.current['transmit']?.triggerHover()}
            >
              <div className="relative z-10 font-bold text-sm font-mono">
                <PatternScramble ref={(el) => { scrambleRefs.current['transmit'] = el; }} text="TRANSMIT DATA" colors={["#000", "#0ff"]} startTrigger={false} />
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes noise-grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -1%); }
          30% { transform: translate(1%, 2%); }
          50% { transform: translate(-1%, 1%); }
          70% { transform: translate(2%, 1%); }
          90% { transform: translate(-1%, -2%); }
        }
        .animate-noise-grain { animation: noise-grain 0.2s steps(2) infinite; background-size: 200px 200px; }
        
        @keyframes modal-entry {
          0% { opacity: 0; transform: scale(0.9); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        .animate-modal-entry { animation: modal-entry 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}