// src/TheArtifact.tsx
import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { PhaseController } from "./components/World/PhaseController"; // New component

// Modular Imports
import { InteractiveArtifact, CosmicBackground, ConstellationManager } from "./components/Cryptex";
import { ResponsiveCamera } from "./components/UI/ResponsiveCamera";
import { MothershipHUD } from "./components/UI/MothershipHUD";

export default function TheArtifact() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hudVisible, setHudVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ width: "100vw", height: "400vh", background: "#000", overflow: "hidden", touchAction: "none" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }} style={{ position: 'fixed', top: 0 }}>
        <ResponsiveCamera />
        <Environment preset="warehouse" blur={0.8} />
        
        {/* Lights */}
        <rectAreaLight width={5} height={5} color="white" intensity={2} position={[3, 3, 3]} />
        <rectAreaLight width={5} height={10} color="#aa00ff" intensity={5} position={[-4, 0, 2]} />
        <pointLight position={[0, -2, -3]} intensity={5} color="#00ffff" distance={10} />

        <Suspense fallback={<Html center><div style={{color:'#aa00ff'}}>DECRYPTING...</div></Html>}>
          <CosmicBackground />
          <ConstellationManager hasInteracted={hasInteracted} />
          
          {/* Pass setHudVisible to the PhaseController. 
              The controller will wait 3 seconds after unlock, then call it.
          */}
          <PhaseController 
            isUnlocked={isUnlocked} 
            onUnlock={() => setIsUnlocked(true)}
            onNavReady={() => setHudVisible(true)} 
          >
             <InteractiveArtifact setHasInteracted={setHasInteracted} />
          </PhaseController>

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.6} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* The HUD now only renders once the UFO has finished its 
          3-second flight to the top third of the screen.
      */}
      {hudVisible && (
        <MothershipHUD 
          progress={scrollProgress} 
          onNavigate={(s) => console.log(s)} 
        />
      )}
    </div>
  );
}