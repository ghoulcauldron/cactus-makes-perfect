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

  // Keyboard Close Logic
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto overflow-hidden font-mono">
      {/* BACKDROP - Click to Close */}
      <div className="absolute inset-0 bg-[#0a001a]/85 backdrop-blur-xl transition-opacity duration-700 cursor-zoom-out" onClick={onClose} />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-screen animate-noise-grain" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      {/* --- OVAL MAP OVERLAY --- */}
      {showMap && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 animate-modal-entry"
          onClick={() => setShowMap(false)}
        >
          <div 
            className="w-full max-w-4xl h-[75vh] border-2 border-[#00ffff]/30 relative overflow-hidden bg-black shadow-[0_0_80px_rgba(0,255,255,0.2)]"
            style={{ clipPath: 'ellipse(48% 48% at 50% 50%)' }}
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
            <div className="absolute inset-0 pointer-events-none opacity-[0.1]" 
                 style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.2) 2px, rgba(0, 255, 255, 0.2) 4px)' }} />
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 bg-black/80 border border-[#00ffff] p-2 text-[#00ffff] text-[10px] tracking-widest uppercase z-20">
              [ SECURE FEED: DOS HERMANAS SECTOR ]
            </div>
            <button 
              onClick={() => setShowMap(false)}
              className="absolute bottom-[15%] left-1/2 -translate-x-1/2 bg-black border border-[#00ffff] text-[#00ffff] px-4 py-2 hover:bg-[#00ffff] hover:text-black transition-all text-xs z-50 shadow-[0_0_15px_rgba(0,255,255,0.4)]"
            >
              TERMINATE_FEED
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN OVAL MODAL --- */}
      <div 
        className="relative w-full max-w-[600px] h-[75vh] flex flex-col items-center justify-center animate-modal-entry"
        style={{ clipPath: 'ellipse(48% 48% at 50% 50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -inset-1 bg-gradient-to-b from-[#00ffff] via-[#FF00FF] to-[#39FF14] opacity-30" />
        
        <div className="relative flex flex-col bg-black border border-white/20 w-full h-full overflow-hidden text-white">
          <div className="bg-[#39FF14]/10 border-b border-[#39FF14]/30 px-6 pt-20 pb-2">
             <p className="text-[#39FF14] text-[10px] tracking-widest text-center animate-pulse">
                TRANSMISSION RECEIVED. THANK YOU FOR YOUR CONFIRMATION.
             </p>
          </div>

          <div className="p-6 border-b border-[#00ffff]/30 bg-gradient-to-b from-[#1a0033] to-black flex flex-col items-center">
            <div onMouseEnter={() => scrambleRefs.current['header']?.triggerHover()}>
              <div className="text-[10px] tracking-[0.4em] mb-1 text-[#00ffff] text-center">
                {loadStep >= 1 && (
                  <PatternScramble 
                    ref={(el) => { if (el) scrambleRefs.current['header'] = el; }}
                    text="/// OPERATION: 20 YEAR DARE ///" 
                    {...CYBERPUNK_THEME}
                    startTrigger={true}
                  />
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tighter italic uppercase text-center">
                Mission <span className="text-[#39FF14]">Briefing</span>
              </h2>
            </div>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 bg-[radial-gradient(circle_at_center,_#1a0033_0%,_#000000_100%)] text-sm pb-24">
            {[
              { date: "THU AUG 27", label: "THE ARRIVAL", details: "Rolling infiltration begins.", hasMap: true, id: 2 },
              { date: "FRI AUG 28", label: "THE PSYCHE-FEASTIA", details: "Midday: Off-World Excursion (Feelin' Psychedelic).\n6PM: Ceremonial Feast", id: 3 },
              { date: "SAT AUG 29", label: "ATMOSPHERIC TRANSIT", details: "6PM: Ride into the sky.", id: 4 },
              { date: "SUN AUG 30", label: "POST-MISSION DEBRIEF", details: "Midday: Brunch.\nEvening: Final Transmission + Soft Entertainment", id: 5 }
            ].map((section) => (
              <div key={section.date} className="group flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-2 w-full max-w-xs">
                  <div className="h-[1px] flex-1 bg-[#39FF14]/20" />
                  <span className="text-[10px] font-bold bg-[#39FF14] text-black px-1 uppercase">{section.date}</span>
                  <div className="h-[1px] flex-1 bg-[#39FF14]/20" />
                </div>
                <div className="px-4 py-1 relative">
                  <div className="font-bold tracking-tight text-white" onMouseEnter={() => scrambleRefs.current[section.date]?.triggerHover()}>
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
                  <p className="text-white/60 text-xs mt-1 leading-relaxed whitespace-pre-line">{section.details}</p>
                  {section.hasMap && (
                    <button onClick={() => setShowMap(true)} className="mt-3 group/map flex items-center justify-center gap-2 text-[10px] text-[#00ffff] hover:text-white transition-colors w-full">
                      <span className="border border-[#00ffff] px-1 group-hover/map:bg-[#00ffff] group-hover/map:text-black font-bold uppercase tracking-widest text-[9px]">GROUND ZERO</span>
                      <span className="opacity-60 font-segment tracking-widest">[ VIEW S&G COORDINATES ]</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-[#00ffff]/5 p-4 border border-[#00ffff]/20 mx-auto max-w-xs text-center">
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

          <div className="absolute bottom-10 left-0 right-0 p-4 bg-black/80 border-t border-white/10 flex flex-col items-center">
            <button onClick={onClose} className="text-[10px] uppercase text-white/40 hover:text-white transition-colors font-mono tracking-widest mb-1">
              [ Dismiss ]
            </button>
            <div className="text-[9px] text-[#39FF14]/40 uppercase tracking-[0.2em]">
              Transmission End // Stand By
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        @keyframes noise-grain { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-1%, 2%); } }
        .animate-noise-grain { animation: noise-grain 0.15s steps(2) infinite; }
        @keyframes modal-entry { 0% { opacity: 0; transform: scale(0.95); filter: blur(5px); } 100% { opacity: 1; transform: scale(1); filter: blur(0px); } }
        .animate-modal-entry { animation: modal-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}