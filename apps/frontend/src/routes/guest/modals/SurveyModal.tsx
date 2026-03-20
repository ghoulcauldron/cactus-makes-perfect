import { useState, useRef, useEffect } from "react";
// Import from the official react-map-gl (which now uses mapbox-gl under the hood)
import Map, { Marker } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZ2hvdWxjYXVsZHJvbiIsImEiOiJjbW14Z2ZubzcxMnN0MnBvcXdxYmppdDJyIn0.OQ4TP1JJkN3Gx0aEf77FmQ";
const CUSTOM_STYLE = "mapbox://styles/ghoulcauldron/cmmxjbezx003t01rx6fvi5z7r";

const UFOMarker = () => (
  <div className="relative flex items-center justify-center">
    {/* The Beam */}
    <div 
      className="absolute bottom-1 w-12 h-32 bg-gradient-to-t from-[#39FF14]/50 to-transparent blur-sm animate-pulse" 
      style={{ 
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
        transformOrigin: 'bottom' 
      }} 
    />
    {/* The Core Point */}
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

  // S&G Target Coordinates
  const [viewState, setViewState] = useState({
    latitude: 35.689511,
    longitude: -105.944936,
    zoom: 12,
    bearing: 0,
    pitch: 0
  });

  // Cinematic Zoom-In Effect
  useEffect(() => {
    if (showMap) {
      const timer = setTimeout(() => {
        setViewState(prev => ({ 
          ...prev, 
          zoom: 15.5,
          transitionDuration: 3000 
        }));
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setViewState(prev => ({ ...prev, zoom: 12, transitionDuration: 0 }));
    }
  }, [showMap]);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setLoadStep(prev => (prev < 8 ? prev + 1 : prev));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLoadStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto overflow-hidden">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-[#0a001a]/85 backdrop-blur-xl transition-opacity duration-700" />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-screen animate-noise-grain" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      {/* --- S&G CUSTOM STUDIO MAP --- */}
      {showMap && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 animate-modal-entry"
          onClick={() => setShowMap(false)}
        >
          <div 
            className="w-full max-w-4xl h-[70vh] border-2 border-[#00ffff] relative overflow-hidden bg-black shadow-[0_0_60px_rgba(0,255,255,0.2)]"
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

            {/* Tactical Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.1] z-10" 
                 style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.2) 2px, rgba(0, 255, 255, 0.2) 4px)' }} />
            
            <div className="absolute top-4 left-4 bg-black/90 border border-[#00ffff] p-2 text-[#00ffff] text-[10px] font-mono tracking-widest uppercase z-20">
              [ SECURE FEED: DOS HERMANAS SECTOR ]
            </div>
            
            <button 
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 bg-black border border-[#00ffff] text-[#00ffff] px-3 py-1 hover:bg-[#00ffff] hover:text-black transition-all text-xs font-mono z-50 shadow-[0_0_10px_rgba(0,255,255,0.5)]"
            >
              TERMINATE_FEED
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN MODAL --- */}
      <div className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.9)] animate-modal-entry">
        <div className="absolute -inset-[2px] bg-gradient-to-b from-[#00ffff] via-[#FF00FF] to-[#39FF14] opacity-50" />
        
        <div className="relative flex flex-col bg-black border border-white/20 overflow-hidden h-full font-mono text-white">
          <div className="bg-[#39FF14]/10 border-b border-[#39FF14]/30 px-6 py-2">
             <p className="text-[#39FF14] text-[10px] tracking-widest text-center animate-pulse">
                TRANSMISSION RECEIVED. THANK YOU FOR YOUR CONFIRMATION.
             </p>
          </div>

          <div className="p-6 border-b border-[#00ffff]/30 bg-gradient-to-b from-[#1a0033] to-black">
            <div onMouseEnter={() => scrambleRefs.current['header']?.triggerHover()}>
              <div className="text-[10px] tracking-[0.4em] mb-1 text-[#00ffff]">
                {loadStep >= 1 && (
                  <PatternScramble 
                    ref={(el) => { if (el) scrambleRefs.current['header'] = el; }}
                    text="/// OPERATION: 20 YEAR DARE ///" 
                    {...CYBERPUNK_THEME}
                    startTrigger={true}
                  />
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tighter italic uppercase">
                Mission <span className="text-[#39FF14]">Briefing</span>
              </h2>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 bg-[radial-gradient(circle_at_center,_#1a0033_0%,_#000000_100%)] text-sm">
            {[
              { date: "THU AUG 27", label: "THE ARRIVAL", details: "Rolling infiltration begins.", hasMap: true, id: 2 },
              { date: "FRI AUG 28", label: "THE PSYCHE-FEASTIA", details: "Midday: Off-World Excursion (Feelin' Psychedelic).\n6PM: Ceremonial Feast", id: 3 },
              { date: "SAT AUG 29", label: "ATMOSPHERIC TRANSIT", details: "6PM: Ride into the sky.", id: 4 },
              { date: "SUN AUG 30", label: "POST-MISSION DEBRIEF", details: "Midday: Brunch.\nEvening: Final Transmission + Soft Entertainment", id: 5 }
            ].map((section) => (
              <div key={section.date} className="group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-[#39FF14] text-black px-1 uppercase">{section.date}</span>
                  <div className="h-[1px] flex-1 bg-[#39FF14]/20" />
                </div>
                <div className="pl-4 py-1 border-l border-white/10 hover:border-[#00ffff]/50 transition-colors cursor-default relative">
                  <div className="font-bold tracking-tight" onMouseEnter={() => scrambleRefs.current[section.date]?.triggerHover()}>
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
                    <button onClick={() => setShowMap(true)} className="mt-3 group/map flex items-center gap-2 text-[10px] text-[#00ffff] hover:text-white transition-colors">
                      <span className="border border-[#00ffff] px-1 group-hover/map:bg-[#00ffff] group-hover/map:text-black font-bold uppercase tracking-widest text-[9px]">GROUND ZERO</span>
                      <span className="opacity-60 font-segment tracking-widest">[ VIEW S&G COORDINATES ]</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #39FF14; box-shadow: 0 0 10px #39FF14; border-radius: 2px; }
        @keyframes noise-grain {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(-1%, 2%); }
        }
        .animate-noise-grain { animation: noise-grain 0.15s steps(2) infinite; background-size: 250px 250px; }
        @keyframes modal-entry {
          0% { opacity: 0; transform: translateY(15px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-entry { animation: modal-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}