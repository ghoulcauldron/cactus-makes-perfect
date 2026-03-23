import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import Map, { Marker } from "react-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";
import ConfirmationModal from "./ConfirmationModal";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZ2hvdWxjYXVsZHJvbiIsImEiOiJjbW14Z2ZubzcxMnN0MnBvcXdxYmppdDJyIn0.OQ4TP1JJkN3Gx0aEf77FmQ";
const CUSTOM_STYLE = "mapbox://styles/ghoulcauldron/cmmxjbezx003t01rx6fvi5z7r";

{/* --- TARGETED PATCH: BIOLUMINESCENT MARKER --- */}
const UFOMarker = ({ onClick }: { onClick: () => void }) => (
  <div className="relative flex items-center justify-center cursor-pointer group" onClick={onClick}>
    {/* Bioluminescent Beam */}
    <div 
      className="absolute bottom-1 w-12 h-32 bg-gradient-to-t from-[#00ffff]/40 to-transparent blur-md animate-pulse" 
      style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)', transformOrigin: 'bottom' }} 
    />
    {/* Pulse Core */}
    <div className="w-4 h-4 bg-[#00ffff] rounded-full shadow-[0_0_25px_#00ffff] animate-ping" />
    <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
    
    {/* Label with Liquid Styling */}
    <div className="absolute -bottom-14 whitespace-nowrap font-mono bg-white/10 backdrop-blur-md border border-[#00ffff]/40 text-[#00ffff] px-3 py-2 rounded-full text-[9px] uppercase tracking-[0.2em] hover:bg-[#00ffff] hover:text-black transition-all duration-700 shadow-[0_0_20px_rgba(0,255,255,0.2)] z-[70]">
      DOS HERMANAS COMPOUND
    </div>
  </div>
);

// --- COSMIC NEBULA SHADER ---
function ShootingStar() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [data] = useState(() => ({
    pos: new THREE.Vector3((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, -10),
    speed: 0.2 + Math.random() * 0.3
  }));
  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.x += data.speed;
    meshRef.current.position.y -= data.speed;
    if (meshRef.current.position.y < -20) meshRef.current.position.set((Math.random() - 0.5) * 40, 20, -10);
  });
  return (
    <mesh ref={meshRef} position={data.pos}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  );
}

function CosmicBackground() {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const shaderData = useMemo(() => ({
    uniforms: { uTime: { value: 0 }, uColor1: { value: new THREE.Color("#000000") }, uColor2: { value: new THREE.Color("#10002b") }, uColor3: { value: new THREE.Color("#5a189a") } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor1, uColor2, uColor3; varying vec2 vUv;
      float random (in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
      float noise (in vec2 st) { vec2 i = floor(st); vec2 f = fract(st); float a = random(i); float b = random(i + vec2(1.0, 0.0)); float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0)); vec2 u = f * f * (3.0 - 2.0 * f); return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y; }
      float fbm (in vec2 st) { float value = 0.0, amp = 0.5; for (int i = 0; i < 5; i++) { value += amp * noise(st); st *= 2.0; amp *= 0.5; } return value; }
      void main() { vec2 uv = vUv * 2.0 + vec2(uTime * 0.05, uTime * 0.02); float n = fbm(uv); vec3 color = mix(uColor1, uColor2, n * 1.5); color = mix(color, uColor3, smoothstep(0.4, 0.8, n)); gl_FragColor = vec4(color * (1.2 - distance(vUv, vec2(0.5)) * 1.2), 1.0); }
    `
  }), []);
  useFrame((state) => { if (shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime; });
  return (
    <group>
      <Stars radius={100} depth={50} count={7000} factor={6} saturation={0} fade speed={1} />
      {[...Array(5)].map((_, i) => <ShootingStar key={i} />)}
      <mesh position={[0, 0, -20]}>
        <planeGeometry args={[60, 60]} />
        <shaderMaterial ref={shaderRef} {...shaderData} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// --- MAIN SURVEY MODAL ---
export default function SurveyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [state, setState] = useState({
    arrival_day: null as 'thursday' | 'friday' | 'saturday' | 'sunday' | null,
    friday_meowwolf: false,
    friday_dinner: false,
    saturday_railway: false,
    sunday_brunch: false,
    sunday_movie: false,
    isHydrated: false,
    isSaving: false,
    isSaved: false,
    hasExistingRecord: false
  });

  const [showMap, setShowMap] = useState(false);
  const [showUFOMarker, setShowUFOMarker] = useState(false);
  const mapRef = useRef<any>(null);
  const hasFlownRef = useRef(false);
  const scrambleRefs = useRef<Record<string, PatternScrambleHandle | null>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMarkerTooltip, setShowMarkerTooltip] = useState(false);

  const confirmedEvents = useMemo(() => {
    const events: { title: string; time: string; date: string }[] = [];
    if (state.friday_meowwolf) events.push({ date: "FRI AUG 28", time: "MIDDAY", title: "OFF-WORLD EXCURSION" });
    if (state.friday_dinner) events.push({ date: "FRI AUG 28", time: "6PM", title: "CEREMONIAL FEAST" });
    if (state.saturday_railway) events.push({ date: "SAT AUG 29", time: "6PM", title: "RIDE INTO THE SKY" });
    if (state.sunday_brunch) events.push({ date: "SUN AUG 30", time: "MIDDAY", title: "BRUNCH." });
    if (state.sunday_movie) events.push({ date: "SUN AUG 30", time: "EVENING", title: "FINAL TRANSMISSION" });
    return events;
  }, [state]);

  {/* --- TARGETED PATCH: INITIAL VIEWSTATE --- */}
  const [viewState, setViewState] = useState({
    latitude: 35.689511,
    longitude: -105.944936,
    zoom: 12,
    bearing: -60, // Matches your example
    pitch: 60,    // Matches your example (degrees 0-85)
  });

  {/* --- TARGETED PATCH: RESET VIEW LOGIC --- */}
  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [-105.944936, 35.689511],
        zoom: 15.5,
        pitch: 0,
        bearing: 0,
        duration: 2000,
        essential: true
      });
    }
  };

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
      if (!guestId) { setState(s => ({ ...s, isHydrated: true })); return; }
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
              isHydrated: true,
              hasExistingRecord: true
            }));
          }
        }
      } catch (err) { console.error("Hydration failed", err); }
      finally { setState(s => ({ ...s, isHydrated: true })); }
    };
    hydrate();
  }, [isOpen]);

  {/* --- TARGETED PATCH: PERSISTENT STATE & 5S FLY-OVER --- */}
    useEffect(() => {
      if (showMap) {
        // If we've already flown once, don't trigger the animation again
        if (hasFlownRef.current) {
          setShowUFOMarker(true);
          return;
        }

        let checkCount = 0;
        setShowUFOMarker(false);
        
        const triggerFlyOver = () => {
          const mapInstance = mapRef.current?.getMap();
          
          if (mapInstance && mapInstance.isStyleLoaded()) {
            // 1. Initial State: Dead on (0 pitch), higher altitude
            mapInstance.jumpTo({
              center: [-105.944936, 35.689511],
              zoom: 10,
              pitch: 0,
              bearing: 0
            });

            // 2. 5-Second Fly-Over
            mapInstance.flyTo({
              center: [-105.944936, 35.689511],
              zoom: 15.5,
              pitch: 0,   // Keep it dead on
              bearing: 0, // Keep it dead on
              duration: 5000, // Reduced to 5 seconds
              essential: true
            });

            // Logic Gate: UFO appears at 90% (4.5s)
            setTimeout(() => {
              setShowUFOMarker(true);
              hasFlownRef.current = true; // Lock the animation so it never plays again
            }, 4500);

          } else if (checkCount < 50) {
            checkCount++;
            setTimeout(triggerFlyOver, 100);
          }
        };

        triggerFlyOver();
      }
    }, [showMap]);

// This function now just opens the confirmation check
  const triggerSaveSequence = () => {
    if (!state.arrival_day) {
      alert("ERROR: Arrival sequence not initialized.");
      return;
    }
    setShowConfirm(true);
  };

  // This function is called ONLY after you click confirm in the new modal
  const executeFinalSave = async () => {
    setShowConfirm(false);
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
      setState(prev => ({ ...prev, isSaving: false, isSaved: true, hasExistingRecord: true }));
      setTimeout(() => setState(prev => ({ ...prev, isSaved: false })), 3000);
    } catch (err) {
      setState(prev => ({ ...prev, isSaving: false }));
      alert("Transmission failed.");
    }
  };

  const setArrival = (day: 'thursday' | 'friday' | 'saturday' | 'sunday') => {
    setState(prev => ({ ...prev, arrival_day: prev.arrival_day === day ? null : day, isSaved: false }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 pointer-events-auto overflow-hidden font-mono">
      <div className="absolute inset-0 bg-[#0a001a]/90 backdrop-blur-xl transition-opacity duration-700" onClick={() => (showMap ? setShowMap(false) : onClose())} />
      
    {/* --- TARGETED PATCH: SONAR OVAL & TEAL MARKER --- */}
    {showMap && (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-map-pop" onClick={() => setShowMap(false)}>
        <div className="relative w-[98vw] max-w-[1000px] h-[80vh] group">
          
          {/* 1. Bioluminescent Outer Glow */}
          <div className="absolute -inset-10 bg-[#00ffff]/10 blur-[80px] rounded-full animate-pulse pointer-events-none" />

          {/* 2. SONAR WAVES */}
          <div className="absolute inset-0 border-2 border-[#00ffff]/20 rounded-[100px] animate-sonar pointer-events-none" style={{ clipPath: 'ellipse(48% 42% at 50% 50%)' }} />
          <div className="absolute inset-0 border-2 border-[#00ffff]/10 rounded-[100px] animate-sonar pointer-events-none [animation-delay:2s]" style={{ clipPath: 'ellipse(48% 42% at 50% 50%)' }} />

          {/* 3. The Clipped Oval Container */}
          <div 
            className="w-full h-full relative overflow-hidden bg-[#020617] border border-white/20 shadow-[0_0_100px_rgba(0,255,255,0.2)] rounded-[100px]" 
            style={{ clipPath: 'ellipse(48% 42% at 50% 50%)' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <Map 
              ref={mapRef}
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              mapboxAccessToken={MAPBOX_TOKEN} 
              mapStyle={CUSTOM_STYLE} 
              style={{ width: '100%', height: '100%' }}
              antialias={true}
              maxPitch={85}
              terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
              onClick={() => {
                // Clicking the map itself (outside the marker) closes the tooltip
                if (showMarkerTooltip) setShowMarkerTooltip(false);
              }}
            > 
              {showUFOMarker && (
                <Marker longitude={-105.944936} latitude={35.689511} anchor="bottom">
                  <UFOMarker onClick={() => setShowMarkerTooltip(!showMarkerTooltip)} />
                </Marker>
              )}
            </Map>

              {/* 4. TOOLTIP: Anchored to the center of the viewport/oval on mobile */}
            {showMarkerTooltip && (
              <div 
                className={`
                  absolute z-[100]
                  /* MOBILE: Force absolute center of the oval container */
                  top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2
                  
                  /* DESKTOP: Re-align to float above the marker (center-ish of map) */
                  md:top-auto md:bottom-[60%] md:left-1/2 md:-translate-y-0
                  
                  bg-[#020617]/95 backdrop-blur-3xl border border-[#00ffff]/40 
                  p-6 rounded-[30px] w-[88vw] max-w-[280px] 
                  shadow-[0_0_60px_rgba(0,255,255,0.4)] 
                  animate-modal-entry pointer-events-auto
                `}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 mb-4 border-b border-[#00ffff]/20 pb-2">
                  <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full animate-ping" />
                  <p className="text-[#00ffff] text-[9px] tracking-[0.4em] uppercase font-bold">Coordinates_Locked</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white/90 text-[11px] leading-relaxed uppercase tracking-wider font-bold">
                    Dos Hermanas Compound
                  </p>
                  <p className="text-white/70 text-[10px] leading-relaxed uppercase tracking-wide italic">
                    443 W San Francisco St<br/>
                    Santa Fe, NM 87501
                  </p>
                  <div className="pt-2 flex flex-col gap-1 text-[#39FF14] text-[8px] tracking-[0.2em]">
                    <p>ELEVATION: 7,200FT</p>
                    <p>STATUS: ARRIVAL_READY</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowMarkerTooltip(false)} 
                  className="mt-6 w-full py-2 bg-[#00ffff]/10 border border-[#00ffff]/30 rounded-full text-[#00ffff] text-[8px] tracking-[0.3em] uppercase hover:bg-[#00ffff] hover:text-black transition-all"
                >
                  [ DISMISS_DATA ]
                </button>
              </div>
            )}

            {/* Liquid Edge Highlight */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
              <ellipse cx="50%" cy="50%" rx="48%" ry="42%" fill="none" stroke="white" strokeWidth="0.5" className="opacity-20" />
            </svg>

            {/* Terminate Feed */}
            <button 
              onClick={() => setShowMap(false)} 
              className="absolute bottom-[18%] left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-[#00ffff]/40 text-[#00ffff] px-10 py-3 rounded-full text-[10px] uppercase tracking-[0.5em] hover:bg-[#00ffff] hover:text-black transition-all duration-700 shadow-[0_0_30px_rgba(0,255,255,0.3)] z-[70]"
            >
              TERMINATE_FEED
            </button>
          </div>
        </div>
      </div>
    )}

      {/* --- RECTANGULAR SURVEY MODAL --- */}
      <div 
        className={`relative w-full max-w-[850px] h-[85vh] md:h-[75vh] bg-[#020617]/40 border border-white/20 rounded-[60px] shadow-[0_0_100px_rgba(0,255,255,0.15)] overflow-hidden flex flex-col transition-all duration-700 backdrop-blur-2xl ${showMap ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Nebula Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <CosmicBackground />
          </Canvas>
        </div>

{/* --- TARGETED PATCH: UNIFIED SCROLLABLE HUD --- */}
        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          
          {/* Main Scrollable Unit */}
          <div className="flex-grow overflow-y-auto hide-scrollbar p-6 md:p-10">
            
            {/* Header Area */}
            <div className="flex flex-col items-center mb-8 shrink-0">
              {/* --- TARGETED PATCH: ETHEREAL HEADER --- */}
              <div className="text-[10px] tracking-[0.8em] mb-2 text-[#00ffff]/60 text-center uppercase" onMouseEnter={() => scrambleRefs.current['operation']?.triggerHover()}>
                <PatternScramble ref={(el) => { if (el) scrambleRefs.current['operation'] = el; }} text="/// SYNAPTIC_LINK_ESTABLISHED: 20 YEAR DARE ///" {...CYBERPUNK_THEME} startTrigger={true} />
              </div>
              <h2 className="text-4xl md:text-5xl font-light tracking-[0.2em] italic uppercase text-center leading-none mb-8 text-white">
                Mission <span className="text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.4)]">Briefing</span>
              </h2>

              <div className="flex flex-col items-center w-full max-w-2xl">
                <p className="text-[10px] text-[#39FF14]/50 tracking-[0.5em] uppercase font-light mb-4">Target Window: AUG 27 — AUG 31</p>
                <button onClick={() => setShowMap(true)} className="text-[10px] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all border border-[#00ffff]/30 px-12 py-3 bg-white/5 rounded-full tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(0,255,255,0.1)] mb-10">
                  [ VIEW_VECTOR_MAP ]
                </button>

                <div className="w-full flex flex-col items-center mb-6">
                  <p className="text-[11px] text-[#00ffff] tracking-[0.2em] uppercase mb-4 italic font-bold">1. Select Arrival Date</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {['thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <button 
                        key={day}
                        onClick={() => setArrival(day as any)} 
                        className={`text-[10px] font-bold px-6 py-2 rounded-full uppercase tracking-[0.2em] border transition-all duration-500 ${
                          state.arrival_day === day 
                            ? '!bg-white !text-black border-white shadow-[0_0_20px_white]' 
                            : 'text-white/30 border-white/10 hover:border-[#00ffff]/40 hover:text-white bg-white/5'
                        }`}
                      >
                        {day.slice(0, 3)} AUG {day === 'thursday' ? '27' : day === 'friday' ? '28' : day === 'saturday' ? '29' : '30'}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-[#00ffff] tracking-[0.2em] uppercase mt-12 mb-2 italic font-bold">2. Confirm Event Attendance</p>
              </div>
            </div>

            {/* --- TARGETED PATCH: DUAL-COLUMN LEFT-ALIGNED LAYOUT --- */}
            <div className="flex flex-col space-y-12 max-w-4xl mx-auto pb-10 pl-6">
              {[
                { date: "THU AUG 27", key: 'thursday', title: "The Arrival", desc: "Infiltration window opens" },
                { date: "FRI AUG 28", key: 'friday', title: "Psyche-Feastia", keys: ['friday_meowwolf', 'friday_dinner'] },
                { date: "SAT AUG 29", key: 'saturday', title: "Atmospheric Transit", keys: ['saturday_railway'] },
                { date: "SUN AUG 30", key: 'sunday', title: "Post-Mission Debrief", keys: ['sunday_brunch', 'sunday_movie'] }
              ].map((section, idx, arr) => (
                <div key={section.date} className="flex flex-col md:flex-row items-start text-left pb-10 relative">
                  
                  {/* Glowing Separator Line */}
                  {idx < arr.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-[1px]" />
                  )}

                  {/* COLUMN 1: Static Information */}
                  <div className="flex flex-col items-start min-w-[280px] mb-6 md:mb-0">
                    <span className="text-[10px] font-mono text-[#39FF14]/60 tracking-[0.4em] mb-1 uppercase font-bold">
                      {section.date}
                    </span>
                    <div className="text-2xl font-bold tracking-tight text-white/90 uppercase opacity-90" onMouseEnter={() => scrambleRefs.current[section.key]?.triggerHover()}>
                      <PatternScramble ref={(el) => { if (el) scrambleRefs.current[section.key] = el; }} text={section.title} {...CYBERPUNK_THEME} startTrigger={true} />
                    </div>
                  </div>

                  {/* COLUMN 2: Buttons (Locked to Left Alignment) */}
                  <div className="flex-grow flex flex-col items-start justify-start md:pl-16">
                    {section.desc && (
                      <p className="text-white/80 text-[11px] italic leading-tight uppercase tracking-wider pt-2 mb-2">
                        {section.desc}
                      </p>
                    )}

                    {section.keys && (
                      <div className="flex flex-col items-start gap-3 w-full">
                        {section.keys.map(k => (
                          <button 
                            key={k} 
                            onClick={() => setState(s => ({ ...s, [k]: !s[k as keyof typeof s], isSaved: false }))} 
                            className={`w-full max-w-[320px] text-[9px] py-3 px-8 text-left rounded-full border transition-all duration-700 uppercase tracking-[0.3em] ${
                              state[k as keyof typeof state] 
                                ? '!bg-[#00ffff] !text-black border-[#00ffff] shadow-[0_0_25px_rgba(0,255,255,0.5)]' 
                                : 'text-white/40 border-white/5 bg-white/5 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {k.includes('meowwolf') ? "Midday: Off-World Excursion" : 
                            k.includes('dinner') ? "6PM: Ceremonial Feast" : 
                            k.includes('railway') ? "6PM: Ride into the sky" : 
                            k.includes('brunch') ? "Midday: Brunch." : 
                            "Evening: Soft Entertainment"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Area - Anchored and Non-Scrollable */}
          <div className="mt-auto pt-6 pb-6 border-t border-white/10 flex flex-col items-center shrink-0 bg-black/80 backdrop-blur-sm relative z-20">
            <button 
              onClick={triggerSaveSequence}
              disabled={state.isSaving || !state.isHydrated} 
              className={`group relative overflow-hidden text-xs uppercase font-bold tracking-[0.5em] px-16 py-4 rounded-full border transition-all duration-1000 ${
                state.isSaved 
                  ? 'bg-white text-black border-white shadow-[0_0_30px_white]' 
                  : state.isSaving 
                    ? 'bg-white/10 text-white/50 border-white/20' 
                    : 'bg-white/5 text-white border-white/20 hover:border-[#00ffff] hover:text-[#00ffff] hover:shadow-[0_0_40px_rgba(0,255,255,0.3)]'
              }`}
            >
              {/* The Liquid Shimmer Layer */}
              {!state.isSaving && !state.isSaved && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 animate-mercury pointer-events-none" />
              )}
              
              <span className="relative z-10">
                {state.isSaving ? "/// TRANSMITTING ///" : state.isSaved ? "DATA_LINK_ESTABLISHED" : state.hasExistingRecord ? "[ RE-TRANSMIT_DATA ]" : "[ COMMENCE_LINK ]"}
              </span>
            </button>
            <button onClick={onClose} className="mt-4 text-[9px] uppercase text-white/30 hover:text-white transition-colors tracking-[0.4em] bg-transparent">[ Close Terminal ]</button>
          </div>
          <ConfirmationModal 
          isOpen={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={executeFinalSave}
          data={{
            arrival_day: state.arrival_day,
            events: confirmedEvents
          }}
        />
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* NEW: Liquid Metal Shimmer Logic */
        @keyframes mercury-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-mercury {
          background: linear-gradient(
            90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.8) 50%, 
            rgba(255,255,255,0) 100%
          );
          background-size: 200% 100%;
          animation: mercury-shimmer 3s infinite linear;
        }

        @keyframes map-pop { 0% { opacity: 0; transform: scale(0.85) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-map-pop { animation: map-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes modal-entry { 0% { opacity: 0; transform: scale(1.02); } 100% { opacity: 1; transform: scale(1); } }
        .animate-modal-entry { animation: modal-entry 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes sonar-wave {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .animate-sonar {
          animation: sonar-wave 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}