import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import Map, { Marker } from "react-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZ2hvdWxjYXVsZHJvbiIsImEiOiJjbW14Z2ZubzcxMnN0MnBvcXdxYmppdDJyIn0.OQ4TP1JJkN3Gx0aEf77FmQ";
const CUSTOM_STYLE = "mapbox://styles/ghoulcauldron/cmmxjbezx003t01rx6fvi5z7r";

// --- COSMIC BACKGROUND COMPONENT ---
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
    if (meshRef.current.position.y < -20) {
      meshRef.current.position.set((Math.random() - 0.5) * 40, 20, -10);
    }
  });
  return (
    <mesh ref={meshRef} position={data.pos}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  );
}

function CosmicShader() {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const shaderData = useMemo(() => ({
    uniforms: { uTime: { value: 0 }, uColor1: { value: new THREE.Color("#000000") }, uColor2: { value: new THREE.Color("#0a001a") }, uColor3: { value: new THREE.Color("#1a0033") } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor1, uColor2, uColor3; varying vec2 vUv;
      float random (vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
      float noise (vec2 st) { vec2 i = floor(st); vec2 f = fract(st); float a = random(i); float b = random(i + vec2(1.0, 0.0)); float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0)); vec2 u = f * f * (3.0 - 2.0 * f); return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y; }
      float fbm (vec2 st) { float value = 0.0, amp = 0.5; for (int i = 0; i < 5; i++) { value += amp * noise(st); st *= 2.0; amp *= 0.5; } return value; }
      void main() { vec2 uv = vUv * 2.0 + vec2(uTime * 0.03, uTime * 0.01); float n = fbm(uv); vec3 color = mix(uColor1, uColor2, n * 1.5); color = mix(color, uColor3, smoothstep(0.4, 0.8, n)); gl_FragColor = vec4(color * (1.0 - distance(vUv, vec2(0.5)) * 1.0), 1.0); }
    `
  }), []);
  useFrame((state) => { if (shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime; });
  return <mesh position={[0, 0, -5]}><planeGeometry args={[50, 50]} /><shaderMaterial ref={shaderRef} {...shaderData} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>;
}

// --- MAIN MODAL ---
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto overflow-hidden font-mono">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-zoom-out" onClick={() => (showMap ? setShowMap(false) : onClose())} />
      
      {/* --- OVAL MAP (STAYS OVAL) --- */}
      {showMap && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-modal-entry" onClick={() => setShowMap(false)}>
          <div className="relative w-[95vw] max-w-[850px] h-[60vh] group">
            <div className="w-full h-full relative overflow-hidden bg-black border-2 border-[#00ffff]/40 shadow-[0_0_80px_rgba(0,255,255,0.4)]" style={{ clipPath: 'ellipse(48% 40% at 50% 50%)' }} onClick={(e) => e.stopPropagation()}>
              <Map initialViewState={{ latitude: 35.689511, longitude: -105.944936, zoom: 15.5 }} mapboxAccessToken={MAPBOX_TOKEN} mapStyle={CUSTOM_STYLE} style={{ width: '100%', height: '100%' }}>
                <Marker longitude={-105.944936} latitude={35.689511} anchor="bottom">
                   <div className="w-4 h-4 bg-[#39FF14] rounded-full shadow-[0_0_15px_#39FF14] animate-ping" />
                </Marker>
              </Map>
              <button onClick={() => setShowMap(false)} className="absolute bottom-[22%] left-1/2 -translate-x-1/2 bg-black border border-[#00ffff] text-[#00ffff] px-4 py-1.5 text-[10px] uppercase">TERMINATE_FEED</button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECTANGULAR MODAL --- */}
      <div className="relative w-full max-w-[850px] h-[85vh] md:h-[75vh] bg-black border border-[#00ffff]/30 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.1)] overflow-hidden flex flex-col animate-modal-entry" onClick={(e) => e.stopPropagation()}>
        
        {/* Cosmic Backdrop Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <CosmicShader />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            {[...Array(3)].map((_, i) => <ShootingStar key={i} />)}
          </Canvas>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full p-6 md:p-10">
          
          {/* Header & Instructions */}
          <div className="flex flex-col items-center shrink-0 mb-8">
            <div className="text-[10px] tracking-[0.5em] mb-1 text-[#00ffff] text-center uppercase opacity-80">
               <PatternScramble text="/// OPERATION: 20 YEAR DARE ///" {...CYBERPUNK_THEME} startTrigger={true} />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter italic uppercase text-center leading-none mb-6">
               Mission <span className="text-[#39FF14]">Briefing</span>
            </h2>
            
            <div className="flex flex-col items-center border border-[#00ffff]/20 bg-black/40 p-4 rounded-md w-full max-w-xl backdrop-blur-sm">
              <p className="text-[10px] text-[#00ffff] tracking-[0.3em] uppercase font-bold mb-2">Target Window: AUG 27 — AUG 31</p>
              <p className="text-[9px] text-white/60 text-center uppercase leading-relaxed mb-4">
                1. Select Arrival Date // 2. Confirm Event Attendance // 3. Transmit Data
              </p>
              <button onClick={() => setShowMap(true)} className="text-[10px] text-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all border border-[#39FF14]/40 px-6 py-1.5 bg-black/50 tracking-widest uppercase">
                [ AREA MAP ]
              </button>
            </div>
          </div>

          {/* Itinerary Grid */}
          <div className="flex-grow overflow-y-auto hide-scrollbar px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-16">
              
              {/* Thu */}
              <div className="flex flex-col items-center text-center">
                <button onClick={() => setArrival('thursday')} className={`text-[10px] font-bold px-4 py-1.5 uppercase tracking-[0.3em] mb-3 border transition-all ${state.arrival_day === 'thursday' ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-[0_0_15px_#39FF14]' : 'text-white/40 border-white/10'}`}>THU AUG 27</button>
                <div className="text-xl font-bold tracking-tight text-white mb-2 uppercase">The Arrival</div>
                <p className="text-white/20 text-[10px] italic leading-tight uppercase">Infiltration window opens</p>
              </div>

              {/* Fri */}
              <div className="flex flex-col items-center text-center">
                <button onClick={() => setArrival('friday')} className={`text-[10px] font-bold px-4 py-1.5 uppercase tracking-[0.3em] mb-3 border transition-all ${state.arrival_day === 'friday' ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-[0_0_15px_#39FF14]' : 'text-white/40 border-white/10'}`}>FRI AUG 28</button>
                <div className="text-xl font-bold tracking-tight text-white mb-3 uppercase">Psyche-Feastia</div>
                <div className="space-y-2 w-full max-w-[200px]">
                  <button onClick={() => setState(s => ({ ...s, friday_meowwolf: !s.friday_meowwolf, isSaved: false }))} className={`block w-full text-[10px] py-2.5 border transition-all uppercase ${state.friday_meowwolf ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>Midday: Off-World Excursion</button>
                  <button onClick={() => setState(s => ({ ...s, friday_dinner: !s.friday_dinner, isSaved: false }))} className={`block w-full text-[10px] py-2.5 border transition-all uppercase ${state.friday_dinner ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>6PM: Ceremonial Feast</button>
                </div>
              </div>

              {/* Sat */}
              <div className="flex flex-col items-center text-center">
                <button onClick={() => setArrival('saturday')} className={`text-[10px] font-bold px-4 py-1.5 uppercase tracking-[0.3em] mb-3 border transition-all ${state.arrival_day === 'saturday' ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-[0_0_15px_#39FF14]' : 'text-white/40 border-white/10'}`}>SAT AUG 29</button>
                <div className="text-xl font-bold tracking-tight text-white mb-3 uppercase">Atmospheric Transit</div>
                <button onClick={() => setState(s => ({ ...s, saturday_railway: !s.saturday_railway, isSaved: false }))} className={`block w-full max-w-[200px] text-[10px] py-2.5 border transition-all uppercase ${state.saturday_railway ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>6PM: Ride into the sky</button>
              </div>

              {/* Sun */}
              <div className="flex flex-col items-center text-center">
                <button onClick={() => setArrival('sunday')} className={`text-[10px] font-bold px-4 py-1.5 uppercase tracking-[0.3em] mb-3 border transition-all ${state.arrival_day === 'sunday' ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-[0_0_15px_#39FF14]' : 'text-white/40 border-white/10'}`}>SUN AUG 30</button>
                <div className="text-xl font-bold tracking-tight text-white mb-3 uppercase">Post-Mission Debrief</div>
                <div className="space-y-2 w-full max-w-[200px]">
                  <button onClick={() => setState(s => ({ ...s, sunday_brunch: !s.sunday_brunch, isSaved: false }))} className={`block w-full text-[10px] py-2.5 border transition-all uppercase ${state.sunday_brunch ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>Midday: Brunch.</button>
                  <button onClick={() => setState(s => ({ ...s, sunday_movie: !s.sunday_movie, isSaved: false }))} className={`block w-full text-[10px] py-2.5 border transition-all uppercase ${state.sunday_movie ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-white/40 border-white/10'}`}>Evening: Final Transmission</button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center shrink-0">
            <button 
              onClick={handleSave} 
              disabled={state.isSaving || !state.isHydrated}
              className={`text-xs uppercase font-bold tracking-[0.5em] px-12 py-3 border-2 transition-all ${
                state.isSaved ? 'bg-[#39FF14] text-black border-[#39FF14]' : 
                state.isSaving ? 'bg-white/10 text-white/50 border-white/20' : 
                'bg-transparent text-[#39FF14] border-[#39FF14]/40 hover:bg-[#39FF14] hover:text-black'
              }`}
            >
              {state.isSaving ? "/// TRANSMITTING ///" : state.isSaved ? "DATA UPLOADED ✓" : state.hasExistingRecord ? "[ RE-TRANSMIT DATA ]" : "[ TRANSMIT DATA ]"}
            </button>
            <button onClick={onClose} className="mt-4 text-[9px] uppercase text-white/30 hover:text-white transition-colors tracking-[0.4em] bg-transparent">
              [ Close Terminal ]
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes modal-entry { 0% { opacity: 0; transform: scale(1.02); } 100% { opacity: 1; transform: scale(1); } }
        .animate-modal-entry { animation: modal-entry 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}