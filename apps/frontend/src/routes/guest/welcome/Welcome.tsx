import { useState, useRef } from "react";
// Ensure these paths match your directory structure
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

export default function SurveyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  
  // Create a ref map to trigger scrambles on individual items
  const scrambleRefs = useRef<Record<string, PatternScrambleHandle | null>>({});

  const toggle = (key: string) => {
    if ("vibrate" in navigator) navigator.vibrate(10);
    setSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#0a001a]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col">
        {/* IRIDESCENT BORDER */}
        <div className="absolute -inset-[2px] bg-gradient-to-b from-[#00ffff] via-[#8e59c3] to-[#2E7D32] rounded-sm opacity-50" />
        
        <div className="relative flex flex-col bg-black border border-white/10 overflow-hidden">
          {/* HEADER */}
          <div className="p-6 border-b border-artifact-cyan/30 bg-gradient-to-b from-artifact-void to-black">
            <div className="flex justify-between items-start">
              <div 
                onMouseEnter={() => scrambleRefs.current['header']?.triggerHover()}
                className="cursor-crosshair"
              >
                <p className="text-[10px] tracking-[0.4em] mb-1 text-artifact-cyan animate-pulse font-segment">
                  <PatternScramble 
                    ref={(el) => (scrambleRefs.current['header_top'] = el)}
                    text="/// AUTHENTICATION REQUIRED ///" 
                    {...CYBERPUNK_THEME}
                    speed={0.8}
                  />
                </p>
                <h2 className="text-2xl font-bold text-white tracking-tighter italic font-display uppercase">
                  TRAJECTORY <span className="text-cactus-green">SYNC</span>
                </h2>
              </div>
              <div className="h-8 w-8 rounded-full border border-artifact-cyan flex items-center justify-center animate-spin-slow">
                 <div className="h-1 w-1 bg-artifact-cyan rounded-full" />
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6 overflow-y-auto space-y-8 bg-[radial-gradient(circle_at_center,_#1a0033_0%,_#000000_100%)]">
            {[
              { date: "AUG 27", items: [{ id: "thursday_arrival", label: "INITIAL INFILTRATION" }] },
              { date: "AUG 28", items: [
                { id: "friday_meowwolf", label: "OFF-WORLD: MEOW WOLF" },
                { id: "friday_dinner", label: "COMMUNAL FUELING (6PM)" }
              ]},
              { date: "AUG 29", items: [{ id: "saturday_railway", label: "SKY RAILWAY TRANSPORT" }] },
              { date: "AUG 30", items: [
                { id: "sunday_brunch", label: "POST-MISSION BRUNCH" },
                { id: "sunday_movie", label: "FINAL TRANSMISSION" }
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
                      <span className="relative z-10 block">
                        <PatternScramble 
                          ref={(el) => (scrambleRefs.current[item.id] = el)}
                          text={item.label}
                          {...CYBERPUNK_THEME}
                          speed={0.6}
                          waveWidth={10}
                          startTrigger={false} // Only animate on hover
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div className="p-4 bg-black border-t border-white/10 flex justify-between items-center">
            <button onClick={onClose} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white font-segment">
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
                    ref={(el) => (scrambleRefs.current['transmit'] = el)}
                    text="TRANSMIT DATA" 
                    colors={["#000000", "#00FFFF"]} // Match the button colors
                    startTrigger={false}
                 />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}