import { useState, useRef } from "react";
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

export default function SurveyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  
  // Using an object for refs to avoid array mapping issues
  const scrambleRefs = useRef<Record<string, PatternScrambleHandle | null>>({});

  const toggle = (key: string) => {
    if ("vibrate" in navigator) navigator.vibrate(10);
    setSelections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isOpen) return null;

  return (
    // FIX: Removed 'relative' from the root fixed container
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-hidden">
      
      {/* --- BACKDROP LAYERS --- */}
      {/* 1. The Blur & Tint Layer */}
      <div className="absolute inset-0 bg-[#0a001a]/60 backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-500" />
      
      {/* 2. The Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay animate-noise-grain" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      {/* --- MODAL CONTENT --- */}
      <div className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.9)]">
        
        {/* IRIDESCENT BORDER SHELL */}
        <div className="absolute -inset-[2px] bg-gradient-to-b from-artifact-cyan via-artifact-purple to-cactus-green rounded-sm opacity-50" />
        
        <div className="relative flex flex-col bg-black border border-white/10 overflow-hidden h-full">
          
          {/* HEADER */}
          <div className="p-6 border-b border-artifact-cyan/30 bg-gradient-to-b from-artifact-void to-black">
            <div className="flex justify-between items-start">
              <div 
                onMouseEnter={() => scrambleRefs.current['header_top']?.triggerHover()}
                className="cursor-crosshair"
              >
                <div className="text-[10px] tracking-[0.4em] mb-1 text-artifact-cyan animate-pulse font-segment">
                   <PatternScramble 
                    ref={(el) => { if (el) scrambleRefs.current['header_top'] = el; }}
                    text="/// AUTHENTICATION REQUIRED ///" 
                    {...CYBERPUNK_THEME}
                    speed={0.8}
                  />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tighter italic font-display uppercase">
                  TRAJECTORY <span className="text-cactus-green">SYNC</span>
                </h2>
              </div>
              <div className="h-8 w-8 rounded-full border border-artifact-cyan flex items-center justify-center animate-spin-slow">
                 <div className="h-1 w-1 bg-artifact-cyan rounded-full shadow-[0_0_8px_#00ffff]" />
              </div>
            </div>
          </div>

          {/* CONTENT: SCROLLABLE SURVEY */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 bg-[radial-gradient(circle_at_center,_#1a0033_0%,_#000000_100%)]">
            {[
              { date: "AUG 27", items: [{ id: "thursday_arrival", label: "INITIAL INFILTRATION" }] },
              { date: "AUG 28", items: [
                { id: "friday_meowwolf", label: "OFF-WORLD: FEELIN' PSYCHEDELIA" },
                { id: "friday_dinner", label: "COMMUNAL FUELING (6PM)" }
              ]},
              { date: "AUG 29", items: [{ id: "saturday_railway", label: "SUNSET SERENADE" }] },
              { date: "AUG 30", items: [
                { id: "sunday_brunch", label: "POST-MISSION BRUNCH" },
                { id: "sunday_movie", label: "FINAL TRANSMISSION + CINEMA" }
              ]}
            ].map((section) => (
              <div key={section.date}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold bg-cactus-green text-black px-1 font-segment">{section.date}</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-cactus-green/50 to-transparent" />
                </div>
                {section.items.map(item => {
                  const active = selections[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      onMouseEnter={() => scrambleRefs.current[item.id]?.triggerHover()}
                      className={`
                        w-full text-left px-4 py-3 mb-3 font-segment text-sm tracking-wide
                        transition-all duration-300 relative overflow-hidden border-l-4
                        ${active 
                          ? "bg-artifact-cyan/20 border-artifact-cyan text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]" 
                          : "bg-black/40 border-cactus-green/40 text-cactus-green hover:border-artifact-cyan/60 hover:bg-artifact-cyan/5"}
                      `}
                    >
                      {active && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />}
                      
                      <div className="relative z-10 block pointer-events-none">
                        <PatternScramble 
                          ref={(el) => { if (el) scrambleRefs.current[item.id] = el; }}
                          text={item.label}
                          {...CYBERPUNK_THEME}
                          speed={0.6}
                          waveWidth={10}
                          startTrigger={false}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-4 bg-black border-t border-white/10 flex justify-between items-center">
            <button 
              onClick={onClose} 
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white font-segment transition-colors"
            >
              [ Abort_Mission ]
            </button>

            <button 
              className="group relative px-6 py-2 overflow-hidden" 
              onClick={() => console.log("TRANSMIT", selections)}
              onMouseEnter={() => scrambleRefs.current['transmit']?.triggerHover()}
            >
              <div className="absolute inset-0 bg-artifact-cyan translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative border border-artifact-cyan px-4 py-1 text-artifact-cyan group-hover:text-black font-bold text-sm transition-colors font-segment">
                <PatternScramble 
                  ref={(el) => { if (el) scrambleRefs.current['transmit'] = el; }}
                  text="TRANSMIT DATA" 
                  colors={["#000000", "#00FFFF"]}
                  startTrigger={false}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes noise-grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -2%); }
          20% { transform: translate(2%, 2%); }
          30% { transform: translate(-3%, 0); }
          40% { transform: translate(3%, 3%); }
          50% { transform: translate(-2%, 2%); }
          60% { transform: translate(2%, -3%); }
          70% { transform: translate(-3%, 3%); }
          80% { transform: translate(3%, -2%); }
          90% { transform: translate(-2%, -3%); }
        }
        .animate-noise-grain {
          animation: noise-grain 0.15s steps(2) infinite;
          background-size: 250px 250px;
        }
      `}</style>
    </div>
  );
}