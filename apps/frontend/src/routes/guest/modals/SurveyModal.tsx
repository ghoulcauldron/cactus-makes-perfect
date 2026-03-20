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
  const [state, setState] = useState({
    arrival_day: null as 'thursday' | 'friday' | 'saturday' | null,
    friday_meowwolf: false,
    friday_dinner: false,
    saturday_railway: false,
    sunday_brunch: false,
    sunday_movie: false,
    isHydrated: false,
    isSaving: false,
    isSaved: false
  });

  const [showMap, setShowMap] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
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

  useEffect(() => {
    const hydrate = async () => {
      if (!isOpen) return;
      const guestId = localStorage.getItem("guest_user_id");
      if (!guestId) {
        setState(s => ({ ...s, isHydrated: true }));
        return;
      }
      try {
        const res = await fetch(`/api/v1/event-responses/me/${guestId}`);
        if (res.ok) {
          const data = await res.json();
          const r = data.response;
          if (r) {
            setState(prev => ({
              ...prev,
              arrival_day: r.arrival_day ?? null,
              friday_meowwolf: !!r.friday_meowwolf,
              friday_dinner: !!r.friday_dinner,
              saturday_railway: !!r.saturday_railway,
              sunday_brunch: !!r.sunday_brunch,
              sunday_movie: !!r.sunday_movie,
              isHydrated: true
            }));
          }
        }
      } catch (err) {
        console.error("Hydration failed", err);
      } finally {
        setState(s => ({ ...s, isHydrated: true }));
      }
    };
    hydrate();
  }, [isOpen]);

  const handleSave = async () => {
    const guestId = localStorage.getItem("guest_user_id");
    setState(prev => ({ ...prev, isSaving: true, isSaved: false }));
    try {
      const res = await fetch("/api/v1/event-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: guestId,
          arrival_day: state.arrival_day,
          friday_meowwolf: state.friday_meowwolf,
          friday_dinner: state.friday_dinner,
          saturday_railway: state.saturday_railway,
          sunday_brunch: state.sunday_brunch,
          sunday_movie: state.sunday_movie
        }),
      });
      if (!res.ok) throw new Error();
      setState(prev => ({ ...prev, isSaving: false, isSaved: true }));
      setTimeout(() => setState(prev => ({ ...prev, isSaved: false })), 3000);
    } catch (err) {
      setState(prev => ({ ...prev, isSaving: false }));
      alert("Transmission failed.");
    }
  };

  if (!isOpen) return null;

  const MODAL_SIZE = "w-[95vw] max-w-[850px] h-[88vh] md:h-[70vh]";
  const OVAL_CLIP = "ellipse(48% 40% at 50% 50%)";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 pointer-events-auto overflow-hidden font-mono">
      <div 
        className="absolute inset-0 bg-[#0a001a]/90 backdrop-blur-xl transition-opacity duration-700 cursor-zoom-out" 
        onClick={() => (showMap ? setShowMap(false) : onClose())} 
      />
      
      {showMap && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 animate-modal-entry" onClick={() => setShowMap(false)}>
          <div className={`relative ${MODAL_SIZE} group`}>
            <div className="absolute -inset-10 bg-[#39FF14]/15 blur-[80px] rounded-full animate-pulse pointer-events-none" />
            <div className="w-full h-full relative overflow-hidden bg-black shadow-[0_0_80px_rgba(0,255,255,0.4)]" style={{ clipPath: OVAL_CLIP }} onClick={(e) => e.stopPropagation()}>
              <Map
                initialViewState={{ latitude: 35.689511, longitude: -105.944936, zoom: 15.5 }}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle={CUSTOM_STYLE}
                style={{ width: '100%', height: '100%' }}
              >
                <Marker longitude={-105.944936} latitude={35.689511} anchor="bottom"><UFOMarker /></Marker>
              </Map>
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
                <ellipse cx="50%" cy="50%" rx="48%" ry="40%" fill="none" stroke="#39FF14" strokeWidth="1" className="opacity-40" />
              </svg>
              <button onClick={() => setShowMap(false)} className="absolute bottom-[22%] left-1/2 -translate-x-1/2 bg-black border border-[#00ffff] text-[#00ffff] px-4 py-1.5 hover:bg-[#00ffff] hover:text-black transition-all text-[10px] z-[70] uppercase">TERMINATE_FEED</button>
            </div>
          </div>
        </div>
      )}

      <div className={`relative ${MODAL_SIZE} flex flex-col items-center justify-center animate-modal-entry`}>
        <div className="absolute -inset-10 bg-[#39FF14]/15 blur-[80px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute -inset-20 bg-[#00ffff]/10 blur-[100px] rounded-full pointer-events-none" />

        <div 
          className="relative w-full h-full flex flex-col items-center"
          style={{ clipPath: OVAL_CLIP }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
            <ellipse cx="50%" cy="50%" rx="48%" ry="40%" fill="none" stroke="#39FF14" strokeWidth="1" className="opacity-40" />
          </svg>
          
          <div className="relative flex flex-col bg-black border border-white/10 w-full h-full overflow-hidden text-white pt-16 pb-16 px-6 md:px-20">
            
            {/* 1. ANCHORED MISSION BRIEFING & S&G DATES */}
            <div className="flex flex-col items-center shrink-0 mb-4 pt-4">
              <div className="text-[10px] tracking-[0.5em] mb-1 text-[#00ffff] text-center uppercase opacity-80">/// OPERATION: 20 YEAR DARE ///</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter italic uppercase text-center leading-none">Mission <span className="text-[#39FF14]">Briefing</span></h2>
              
              <div className="mt-4 flex flex-col items-center border border-[#00ffff]/20 bg-[#00ffff]/5 p-3 rounded-sm w-full max-w-sm">
                <p className="text-[9px] text-[#00ffff] tracking-[0.2em] uppercase font-bold mb-1">Target Window: AUG 27 — AUG 31</p>
                <p className="text-[8px] text-white/60 text-center uppercase leading-relaxed mb-2">
                  1. Select Arrival Date // 2. Confirm Event Attendance // 3. Transmit Data
                </p>
                <button onClick={() => setShowMap(true)} className="text-[9px] text-[#39FF14] hover:text-white transition-colors border border-[#39FF14]/30 px-2 py-1 bg-black/50">
                  [ S&G COORDS ]
                </button>
              </div>
            </div>

            {/* 2. SCROLLABLE INFILTRATION DATA */}
            <div className="flex-grow overflow-y-auto hide-scrollbar px-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 p-2">
                
                {/* THURSDAY */}
                <div className="group flex flex-col items-center text-center">
                  <button 
                    onClick={() => setState(s => ({ ...s, arrival_day: s.arrival_day === 'thursday' ? null : 'thursday', isSaved: false }))}
                    className={`text-[9px] font-bold px-3 py-1 uppercase tracking-[0.3em] mb-1 border transition-all ${state.arrival_day === 'thursday' ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'text-white/40 border-white/10 hover:border-[#39FF14]/50'}`}
                  >
                    THU AUG 27
                  </button>
                  <div className="text-lg font-bold tracking-tight text-white mb-2 uppercase">The Arrival</div>
                  <p className="text-white/30 text-[10px] italic leading-tight uppercase">Infiltration window opens</p>
                </div>

                {/* FRIDAY */}
                <div className="group flex flex-col items-center text-center">
                  <button 
                    onClick={() => setState(s => ({ ...s, arrival_day: s.arrival_day === 'friday' ? null : 'friday', isSaved: false }))}
                    className={`text-[9px] font-bold px-3 py-1 uppercase tracking-[0.3em] mb-1 border transition-all ${state.arrival_day === 'friday' ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'text-white/40 border-white/10 hover:border-[#39FF14]/50'}`}
                  >
                    FRI AUG 28
                  </button>
                  <div className="text-lg font-bold tracking-tight text-white mb-2 uppercase">Psyche-Feastia</div>
                  <div className="space-y-2 w-full max-w-[180px]">
                    <button onClick={() => setState(s => ({ ...s, friday_meowwolf: !s.friday_meowwolf, isSaved: false }))} className={`block w-full text-[10px] py-2 border transition-all uppercase ${state.friday_meowwolf ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>
                      Midday: Off-World Excursion
                    </button>
                    <button onClick={() => setState(s => ({ ...s, friday_dinner: !s.friday_dinner, isSaved: false }))} className={`block w-full text-[10px] py-2 border transition-all uppercase ${state.friday_dinner ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>
                      6PM: Ceremonial Feast
                    </button>
                  </div>
                </div>

                {/* SATURDAY */}
                <div className="group flex flex-col items-center text-center">
                  <button 
                    onClick={() => setState(s => ({ ...s, arrival_day: s.arrival_day === 'saturday' ? null : 'saturday', isSaved: false }))}
                    className={`text-[9px] font-bold px-3 py-1 uppercase tracking-[0.3em] mb-1 border transition-all ${state.arrival_day === 'saturday' ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'text-white/40 border-white/10 hover:border-[#39FF14]/50'}`}
                  >
                    SAT AUG 29
                  </button>
                  <div className="text-lg font-bold tracking-tight text-white mb-2 uppercase">Atmospheric Transit</div>
                  <button onClick={() => setState(s => ({ ...s, saturday_railway: !s.saturday_railway, isSaved: false }))} className={`block w-full max-w-[180px] text-[10px] py-2 border transition-all uppercase ${state.saturday_railway ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>
                    6PM: Ride into the sky
                  </button>
                </div>

                {/* SUNDAY */}
                <div className="group flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-white/20 px-3 py-1 uppercase tracking-[0.3em] mb-1">SUN AUG 30</span>
                  <div className="text-lg font-bold tracking-tight text-white mb-2 uppercase">Post-Mission Debrief</div>
                  <div className="space-y-2 w-full max-w-[180px]">
                    <button onClick={() => setState(s => ({ ...s, sunday_brunch: !s.sunday_brunch, isSaved: false }))} className={`block w-full text-[10px] py-2 border transition-all uppercase ${state.sunday_brunch ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>
                      Midday: Brunch.
                    </button>
                    <button onClick={() => setState(s => ({ ...s, sunday_movie: !s.sunday_movie, isSaved: false }))} className={`block w-full text-[10px] py-2 border transition-all uppercase ${state.sunday_movie ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>
                      Evening: Final Transmission
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TRANSMISSION CONTROLS */}
            <div className="mt-4 pt-4 flex flex-col items-center shrink-0">
              <button 
                onClick={handleSave} 
                disabled={state.isSaving}
                className={`text-[12px] uppercase font-bold tracking-[0.4em] px-8 py-2 border-2 transition-all ${
                  state.isSaved ? 'bg-[#39FF14] text-black border-[#39FF14]' : 
                  state.isSaving ? 'bg-white/10 text-white/50 border-white/20' : 
                  'bg-transparent text-white border-white/40 hover:bg-[#39FF14] hover:text-black hover:border-[#39FF14]'
                }`}
              >
                {state.isSaving ? "/// TRANSMITTING ///" : state.isSaved ? "DATA UPLOADED ✓" : "[ TRANSMIT DATA ]"}
              </button>
              <button onClick={onClose} className="mt-4 text-[9px] uppercase text-white/20 hover:text-white transition-colors tracking-[0.4em] bg-transparent">
                [ Close Terminal ]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}