import { useState, useRef, useEffect, useCallback } from "react";
import Map, { Marker } from "react-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZ2hvdWxjYXVsZHJvbiIsImEiOiJjbW14Z2ZubzcxMnN0MnBvcXdxYmppdDJyIn0.OQ4TP1JJkN3Gx0aEf77FmQ";
const CUSTOM_STYLE = "mapbox://styles/ghoulcauldron/cmmxjbezx003t01rx6fvi5z7r";

const UFOMarker = () => (
  <div className="relative flex items-center justify-center">
    <div 
      className="absolute bottom-1 w-12 h-32 bg-gradient-to-t from-[#39FF14]/50 to-transparent blur-sm animate-pulse" 
      style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)', transformOrigin: 'bottom' }} 
    />
    <div className="w-4 h-4 bg-[#39FF14] rounded-full shadow-[0_0_15px_#39FF14] animate-ping" />
    <div className="absolute w-2 h-2 bg-white rounded-full" />
    <div className="absolute -bottom-8 whitespace-nowrap text-[#39FF14] text-[9px] font-mono tracking-tighter bg-black/80 px-2 border border-[#39FF14]/30 uppercase z-50">
      Signal_Origin: DOS HERMANAS COMPOUND
    </div>
  </div>
);

export default function SurveyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loadStep, setLoadStep] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const scrambleRefs = useRef<Record<string, PatternScrambleHandle | null>>({});

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (showMap) setShowMap(false);
      else onClose();
    }
  }, [showMap, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  const [viewState, setViewState] = useState({
    latitude: 35.689511,
    longitude: -105.944936,
    zoom: 12,
    bearing: 0,
    pitch: 0
  });

  useEffect(() => {
    if (showMap) {
      const timer = setTimeout(() => {
        setViewState(prev => ({ ...prev, zoom: 15.5, transitionDuration: 3000 }));
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setViewState(prev => ({ ...prev, zoom: 12, transitionDuration: 0 }));
    }
  }, [showMap]);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => setLoadStep(prev => (prev < 8 ? prev + 1 : prev)), 100);
      return () => clearInterval(interval);
    } else {
      setLoadStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Unified Geometry for Mobile & Desktop
  const OVAL_CLIP = "ellipse(48% 40% at 50% 50%)";
  const MODAL_SIZE = "w-[95vw] max-w-[850px] h-[70vh] md:h-[65vh]";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 pointer-events-auto overflow-hidden font-mono">
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-[#0a001a]/85 backdrop-blur-xl transition-opacity duration-700 cursor-zoom-out" 
        onClick={() => (showMap ? setShowMap(false) : onClose())} 
      />
      
      {/* --- UNIFIED OVAL MAP OVERLAY --- */}
      {showMap && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-2 animate-modal-entry"
          onClick={() => setShowMap(false)}
        >
          <div className={`relative ${MODAL_SIZE} group`}>
            {/* EXTERNAL GLOWS */}
            <div className="absolute -inset-10 bg-[#39FF14]/15 blur-[80px] rounded-full animate-pulse pointer-events-none" />
            <div className="absolute -inset-20 bg-[#00ffff]/10 blur-[100px] rounded-full pointer-events-none" />

            <div 
              className="w-full h-full relative overflow-hidden bg-black shadow-[0_0_80px_rgba(0,255,255,0.4)]"
              style={{ clipPath: OVAL_CLIP }}
              onClick={(e) => e.stopPropagation()}
            >
              <Map
                {...viewState}
                onMove={(evt: { viewState: any }) => setViewState(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle={CUSTOM_STYLE}
                style={{ width: '100%', height: '100%' }}
                antialias={true}
              >
                <Marker longitude={-105.944936} latitude={35.689511} anchor="bottom">
                  <UFOMarker />
                </Marker>
              </Map>

              {/* Glowing Infected Border (SVG Overlay) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
                <ellipse cx="50%" cy="50%" rx="48%" ry="40%" fill="none" stroke="#39FF14" strokeWidth="1" className="opacity-40" />
              </svg>

              <button 
                onClick={() => setShowMap(false)}
                className="absolute bottom-[22%] left-1/2 -translate-x-1/2 bg-black border border-[#00ffff] text-[#00ffff] px-4 py-1.5 hover:bg-[#00ffff] hover:text-black transition-all text-[10px] z-[70] uppercase tracking-tighter"
              >
                TERMINATE_FEED
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN WIDE OVAL MODAL --- */}
      <div className={`relative ${MODAL_SIZE} flex flex-col items-center justify-center animate-modal-entry`}>
        
        {/* EXTERNAL GLOWS (S&G Green + Cyan Aura) */}
        <div className="absolute -inset-10 bg-[#39FF14]/15 blur-[80px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute -inset-20 bg-[#00ffff]/10 blur-[100px] rounded-full pointer-events-none" />

        <div 
          className="relative w-full h-full flex flex-col items-center justify-center"
          style={{ clipPath: OVAL_CLIP }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing Infected Border (SVG Overlay) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
            <ellipse cx="50%" cy="50%" rx="48%" ry="40%" fill="none" stroke="#39FF14" strokeWidth="1" className="opacity-40" />
          </svg>
          
          <div className="relative flex flex-col bg-black border border-white/10 w-full h-full overflow-hidden text-white pt-10 pb-10 px-6 md:px-20">
            
            {/* Header Area */}
            <div className="border-b border-[#00ffff]/20 bg-gradient-to-b from-[#1a0033]/30 to-black flex flex-col items-center py-4 mb-2">
              <div onMouseEnter={() => scrambleRefs.current['header']?.triggerHover()}>
                <div className="text-[10px] tracking-[0.5em] mb-1 text-[#00ffff] text-center uppercase opacity-80">
                  {loadStep >= 1 && (
                    <PatternScramble 
                      ref={(el) => { if (el) scrambleRefs.current['header'] = el; }}
                      text="/// OPERATION: 20 YEAR DARE ///" 
                      {...CYBERPUNK_THEME}
                      startTrigger={true}
                    />
                  )}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter italic uppercase text-center leading-none">
                  Mission <span className="text-[#39FF14]">Briefing</span>
                </h2>
              </div>
            </div>

            {/* Scrollable Itinerary */}
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-[radial-gradient(circle_at_center,_#1a0033_10%,_#000000_90%)]">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 md:gap-y-8 p-4">
                {[
                  { date: "THU AUG 27", label: "THE ARRIVAL", details: "Rolling infiltration begins.", hasMap: true, id: 2 },
                  { date: "FRI AUG 28", label: "THE PSYCHE-FEASTIA", details: "Midday: Off-World Excursion\n\n6PM: Ceremonial Feast", id: 3 },
                  { date: "SAT AUG 29", label: "ATMOSPHERIC TRANSIT", details: "6PM: Ride into the sky.", id: 4 },
                  { date: "SUN AUG 30", label: "POST-MISSION DEBRIEF", details: "Midday: Brunch.\n\nEvening: Final Transmission", id: 5 }
                ].map((section) => (
                  <div key={section.date} className="group flex flex-col items-center text-center">
                    <span className="text-[9px] font-bold text-[#39FF14] px-1 uppercase tracking-[0.3em] mb-1">{section.date}</span>
                    <div className="text-lg font-bold tracking-tight text-white mb-1" onMouseEnter={() => scrambleRefs.current[section.date]?.triggerHover()}>
                      {loadStep >= section.id && (
                        <PatternScramble 
                          ref={(el) => { if (el) scrambleRefs.current[section.date] = el; }}
                          text={section.label}
                          {...CYBERPUNK_THEME}
                          startTrigger={true}
                          speed={0.5}
                        />
                      )}
                    </div>
                    <p className="text-white/40 text-[11px] leading-tight max-w-[200px] whitespace-pre-line">{section.details}</p>
                    {section.hasMap && (
                      <button onClick={() => setShowMap(true)} className="mt-2 text-[9px] text-[#00ffff] hover:text-[#39FF14] transition-colors border-b border-[#00ffff]/20">
                        [ S&G COORDS ]
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Area */}
            <div className="mt-4 flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity">
              <button onClick={onClose} className="text-[10px] uppercase text-white hover:text-[#FF00FF] transition-colors tracking-[0.5em]">
                [ Dismiss ]
              </button>
              <div className="text-[7px] text-[#39FF14] uppercase tracking-[0.4em] mt-1">
                Transmission End
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes modal-entry { 0% { opacity: 0; transform: scale(1.1); filter: blur(20px); } 100% { opacity: 1; transform: scale(1); filter: blur(0px); } }
        .animate-modal-entry { animation: modal-entry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}