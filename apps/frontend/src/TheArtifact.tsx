import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { PhaseController } from "./components/World/PhaseController";
import { InteractiveArtifact, CosmicBackground, ConstellationManager } from "./components/Cryptex";
import { ResponsiveCamera } from "./components/UI/ResponsiveCamera";
import { MothershipHUD } from "./components/UI/MothershipHUD";
import { PatternScramble } from "./components/UI/PatternScramble"; // Adjust path to match your structure
import { CYBERPUNK_THEME } from "./constants/themes";

// ─── No-access soft block ────────────────────────────────────────────────────

export function ArtifactNoAccess() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRelink = async () => {
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      // API call logic remains untouched
      await fetch('/api/v1/auth/artifact-relink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch { /* swallow — always show sent */ }
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 font-mono">
      {/* Deep Void Backdrop */}
      <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" />
      
      {/* Organic "Living Chrome" Container */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-white/10 to-transparent border border-white/20 rounded-[40px] shadow-[0_0_100px_rgba(170,0,255,0.15)] p-10 overflow-hidden backdrop-blur-xl">
        
        {/* Floating Ethereal Orbs - Adjusted to Magenta/Cyan for "Locked" aesthetic */}
        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-[#aa00ff]/15 blur-[80px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-[#00ffff]/10 blur-[80px] rounded-full animate-pulse" />

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Telemetry Header */}
          <h3 className="text-[#aa00ff] text-[10px] tracking-[0.8em] uppercase mb-10 text-center opacity-80">
            <PatternScramble 
              text="PHASE_II_LOCKED" 
              {...CYBERPUNK_THEME} 
              startTrigger={true} 
            />
          </h3>

          <div className="w-full space-y-8 mb-8">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-md text-center">
              {sent ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-[#39FF14] uppercase tracking-[0.3em] animate-biopulse-green">
                    <PatternScramble text="TRANSMISSION_DISPATCHED" {...CYBERPUNK_THEME} startTrigger={sent} />
                  </p>
                  <p className="text-white/50 text-[9px] uppercase tracking-widest leading-relaxed">
                    If coordinates are on file, check your archive.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#aa00ff]/80 uppercase tracking-[0.3em]">
                      <PatternScramble text="AUTHENTICATION_REQUIRED" {...CYBERPUNK_THEME} startTrigger={true} />
                    </p>
                    <p className="text-white/50 text-[9px] uppercase tracking-widest leading-relaxed">
                      Portal access requires your unique link. <br/>
                      Check your transmission archive.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[8px] text-[#00ffff]/40 uppercase tracking-[0.4em]">
                      // Input Relink Coordinates
                    </p>
                    
                    {/* Restyled Input Field */}
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRelink()}
                      placeholder="ENTER_EMAIL_VECTOR"
                      className="w-full bg-black/40 border border-[#aa00ff]/30 text-[#00ffff] px-4 py-3 rounded-lg text-[10px] tracking-widest placeholder:text-white/20 focus:outline-none focus:border-[#00ffff]/60 focus:bg-white/5 transition-all duration-300 text-center"
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          {!sent && (
            <button 
              onClick={handleRelink} 
              disabled={submitting}
              className={`w-full py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.5em] transition-all duration-700 
                ${submitting 
                  ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                  : 'bg-white/90 text-black hover:bg-[#aa00ff] hover:text-white hover:shadow-[0_0_30px_rgba(170,0,255,0.6)]'
                }`}
            >
              {submitting ? '[ DISPATCHING... ]' : '[ REQUEST_NEW_LINK ]'}
            </button>
          )}
          
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function TheArtifact() {
  const [token, setToken]           = useState<string | null>(null);
  const [hasToken, setHasToken]     = useState<boolean | null>(null); // null = still resolving
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // ── Token resolution: URL param → localStorage → nothing
  useEffect(() => {
    const url      = new URL(window.location.href);
    const urlToken = url.searchParams.get('token');

    if (urlToken) {
      localStorage.setItem('artifact_token', urlToken);
      // Clean token out of the URL bar without a reload
      window.history.replaceState({}, '', '/artifact');
      setToken(urlToken);
      setHasToken(true);
    } else {
      const stored = localStorage.getItem('artifact_token');
      if (stored) {
        setToken(stored);
        setHasToken(true);
      } else {
        setHasToken(false);
      }
    }
  }, []);

  // ── Scroll progress for HUD
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop  = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVerified = (data: { token: string; guest_id: string }) => {
    setIsUnlocked(true);
  };

  // Still resolving token — render nothing to avoid flash
  if (hasToken === null) {
    return <div style={{ background: '#000', height: '100vh', width: '100vw' }} />;
  }

  // No token anywhere — soft block
  if (hasToken === false) {
    return <ArtifactNoAccess />;
  }

  // Token present — render the full artifact
  return (
    <div style={{
      width: '100vw',
      height: '400vh',
      background: '#000',
      overflow: 'hidden',
      touchAction: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 40 }}
        style={{ position: 'fixed', top: 0 }}
      >
        <ResponsiveCamera />
        <Environment preset="warehouse" blur={0.8} />

        <rectAreaLight width={5} height={5}  color="white"   intensity={2} position={[3, 3, 3]} />
        <rectAreaLight width={5} height={10} color="#aa00ff" intensity={5} position={[-4, 0, 2]} />
        <pointLight position={[0, -2, -3]} intensity={5} color="#00ffff" distance={10} />

        <Suspense fallback={<Html center><div style={{ color: '#aa00ff' }}>DECRYPTING...</div></Html>}>
          <CosmicBackground />
          <ConstellationManager hasInteracted={hasInteracted} />

          <PhaseController
            isUnlocked={isUnlocked}
            onUnlock={() => setIsUnlocked(true)}
            onNavReady={() => setHudVisible(true)}
          >
            <InteractiveArtifact
              setHasInteracted={setHasInteracted}
              token={token}
              onVerified={handleVerified}
            />
          </PhaseController>

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.6} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {hudVisible && (
        <MothershipHUD
          progress={scrollProgress}
          onNavigate={(s: string) => console.log(s)}
        />
      )}
    </div>
  );
}