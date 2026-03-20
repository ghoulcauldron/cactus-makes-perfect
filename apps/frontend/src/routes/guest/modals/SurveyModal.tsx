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

  // --- HYDRATION ---
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

  // --- ACTIONS ---
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

  // REFINED GEOMETRY: Explicit taller height for mobile
  const MODAL_SIZE = "w-[95vw] max-w-[850px] h-[88vh] md:h-[65vh]";
  const OVAL_CLIP = "ellipse(48% 40% at 50% 50%)";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 pointer-events-auto overflow-hidden font-mono">
      <div 
        className="absolute inset-0 bg-[#0a001a]/90 backdrop-blur-xl transition-opacity duration-700 cursor-zoom-out" 
        onClick={() => (showMap ? setShowMap(false) : onClose())} 
      />
      
      {/* --- UNIFIED OVAL MAP --- */}
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

      {/* --- MAIN OVAL MODAL --- */}
      <div className={`relative ${MODAL_SIZE} flex flex-col items-center justify-center animate-modal-entry`}>
        <div className="absolute -inset-10 bg-[#39FF14]/15 blur-[80px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute -inset-20 bg-[#00ffff]/10 blur-[100px] rounded-full pointer-events-none" />

        <div 
          className="relative w-full h-full flex flex-col items-center justify-center"
          style={{ clipPath: OVAL_CLIP }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
            <ellipse cx="50%" cy="50%" rx="48%" ry="40%" fill="none" stroke="#39FF14" strokeWidth="1" className="opacity-40" />
          </svg>
          
          <div className="relative flex flex-col bg-black border border-white/10 w-full h-full overflow-hidden text-white pt-24 pb-24 px-6 md:px-20 md:pt-12 md:pb-12">
            
            <div className="border-b border-[#00ffff]/20 flex flex-col items-center py-4 mb-2 shrink-0">
              <div className="text-[10px] tracking-[0.5em] mb-1 text-[#00ffff] text-center uppercase opacity-80">/// OPERATION: 20 YEAR DARE ///</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter italic uppercase text-center leading-none">Mission <span className="text-[#39FF14]">Briefing</span></h2>
            </div>

            <div className="flex-grow overflow-y-auto hide-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 md:gap-y-8 p-4">
                {[
                  { date: "THU AUG 27", label: "THE ARRIVAL", details: "Rolling infiltration begins.", hasMap: true, key: 'arrival_day' },
                  { date: "FRI AUG 28", label: "THE PSYCHE-FEASTIA", details: "Midday: Off-World Excursion\n6PM: Ceremonial Feast", keys: ['friday_meowwolf', 'friday_dinner'] },
                  { date: "SAT AUG 29", label: "ATMOSPHERIC TRANSIT", details: "6PM: Ride into the sky.", keys: ['saturday_railway'] },
                  { date: "SUN AUG 30", label: "POST-MISSION DEBRIEF", details: "Midday: Brunch.\nEvening: Final Transmission", keys: ['sunday_brunch', 'sunday_movie'] }
                ].map((section) => (
                  <div key={section.date} className="group flex flex-col items-center text-center">
                    {/* Arrival Selection Logic */}
                    {section.key === 'arrival_day' ? (
                        <button 
                          onClick={() => setState(s => ({ ...s, arrival_day: s.arrival_day === 'thursday' ? null : 'thursday', isSaved: false }))}
                          className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-[0.3em] mb-1 border transition-all ${state.arrival_day === 'thursday' ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'text-white/40 border-white/10'}`}
                        >
                          {section.date}
                        </button>
                    ) : (
                        <span className="text-[9px] font-bold text-[#39FF14] px-1 uppercase tracking-[0.3em] mb-1 opacity-60">{section.date}</span>
                    )}

                    <div className="text-lg font-bold tracking-tight text-white mb-1">{section.label}</div>
                    <p className="text-white/40 text-[11px] leading-tight max-w-[200px] whitespace-pre-line">{section.details}</p>
                    
                    {/* Event Toggles */}
                    {section.keys && section.keys.map(k => (
                        <button 
                          key={k}
                          onClick={() => setState(s => ({ ...s, [k]: !s[k as keyof typeof s], isSaved: false }))}
                          className={`mt-2 block w-full text-[10px] px-2 py-1 border transition-all ${state[k as keyof typeof state] ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}
                        >
                          {k.includes('meowwolf') ? "Midday: Off-World Excursion" : k.includes('dinner') ? "6PM: Ceremonial Feast" : k.includes('railway') ? "6PM: Ride into the sky" : k.includes('brunch') ? "Midday: Brunch" : "Evening: Final Transmission"}
                        </button>
                    ))}

                    {section.hasMap && (
                      <button onClick={() => setShowMap(true)} className="mt-3 text-[9px] text-[#00ffff] hover:text-[#39FF14] border-b border-[#00ffff]/20">[ S&G COORDS ]</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* REFINED FOOTER: No background, strictly flex-positioned */}
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
              <button onClick={onClose} className="mt-4 text-[9px] uppercase text-white/20 hover:text-white transition-colors tracking-[0.4em] bg-transparent border-none">
                [ Close Terminal ]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}