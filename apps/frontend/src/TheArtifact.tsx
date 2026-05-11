import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { PhaseController } from "./components/World/PhaseController";
import { InteractiveArtifact, CosmicBackground, ConstellationManager } from "./components/Cryptex";
import { ResponsiveCamera } from "./components/UI/ResponsiveCamera";
import { MothershipHUD } from "./components/UI/MothershipHUD";

// ─── No-access soft block ────────────────────────────────────────────────────

function ArtifactNoAccess() {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRelink = async () => {
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/v1/auth/artifact-relink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch { /* swallow — always show sent */ }
    setSent(true);
    setSubmitting(false);
  };

  const container: React.CSSProperties = {
    background: '#000',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Courier New', Courier, monospace",
    color: '#aa00ff',
  };

  const card: React.CSSProperties = {
    border: '2px solid #aa00ff',
    padding: '40px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
  };

  const label: React.CSSProperties = {
    fontSize: '10px',
    letterSpacing: '4px',
    marginBottom: '24px',
    opacity: 0.5,
    textTransform: 'uppercase',
  };

  const body: React.CSSProperties = {
    fontSize: '12px',
    letterSpacing: '1px',
    lineHeight: 1.7,
    marginBottom: '24px',
  };

  const input: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #aa00ff',
    color: '#aa00ff',
    padding: '10px 12px',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: '12px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const button: React.CSSProperties = {
    background: '#aa00ff',
    color: '#000',
    border: 'none',
    padding: '10px 20px',
    fontFamily: 'inherit',
    fontWeight: 'bold',
    fontSize: '11px',
    letterSpacing: '2px',
    cursor: submitting ? 'not-allowed' : 'pointer',
    width: '100%',
    textTransform: 'uppercase',
    opacity: submitting ? 0.6 : 1,
  };

  return (
    <div style={container}>
      <div style={card}>
        <div style={label}>/// Phase II ///</div>
        {sent ? (
          <p style={body}>
            IF YOUR COORDINATES ARE ON FILE,<br />
            A TRANSMISSION HAS BEEN DISPATCHED.
          </p>
        ) : (
          <>
            <p style={body}>
              PORTAL ACCESS REQUIRES YOUR UNIQUE LINK.<br />
              CHECK YOUR TRANSMISSION ARCHIVE.
            </p>
            <p style={{ ...body, fontSize: '10px', opacity: 0.5, marginBottom: '16px' }}>
              OR ENTER YOUR EMAIL TO RECEIVE IT AGAIN:
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRelink()}
              placeholder="YOUR EMAIL"
              style={input}
            />
            <button onClick={handleRelink} disabled={submitting} style={button}>
              {submitting ? 'DISPATCHING...' : 'SEND MY PORTAL LINK'}
            </button>
          </>
        )}
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