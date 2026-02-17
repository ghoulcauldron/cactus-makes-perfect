import React, { Suspense, useRef, useLayoutEffect, useState, useMemo, useEffect } from "react";
import { Canvas, useLoader, useFrame, ThreeEvent, useThree } from "@react-three/fiber"; 
import { Html, Environment, Float, Stars } from "@react-three/drei"; 
import { EffectComposer, Bloom } from "@react-three/postprocessing"; 
import { useDrag } from "@use-gesture/react"; 
import * as THREE from "three";
import { animated, useSpring } from "@react-spring/three"; 

// --- UTILS ---
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(40);
  }
};

// Fisher-Yates Shuffle with Seed
function shuffleArray(array: any[], seed: number) {
  const shuffled = [...array];
  let m = shuffled.length, t, i;
  while (m) {
    const random = Math.abs(Math.sin(seed + m)); 
    i = Math.floor(random * m--);
    t = shuffled[m];
    shuffled[m] = shuffled[i];
    shuffled[i] = t;
  }
  return shuffled;
}

// --- RESPONSIVE CAMERA RIG ---
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    let targetZ = 6; 
    if (aspect < 1.2) targetZ = 5.5 / aspect; 
    camera.position.z = targetZ;
    camera.updateProjectionMatrix();
  }, [size, camera]);
  return null;
}

// --- CENTER BUTTON COMPONENT ---
function CenterButton({ isReady, onClick }: { isReady: boolean, onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (isReady && meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0, -0.06]} 
      rotation={[0, Math.PI, 0]}
      onClick={(e) => {
        if (isReady) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <circleGeometry args={[0.3, 32]} />
      <meshStandardMaterial 
        color={isReady ? "#00ff88" : "#1a0033"} 
        emissive={isReady ? "#00ff88" : "#000000"}
        emissiveIntensity={isReady ? 3 : 0}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

// =========================================================
// --- PHASE 3: THE CAROUSEL ENGINE ---
// =========================================================

function useIconAssets(ringIndex: number) {
  const base = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/";
  const urls = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const idx = i.toString().padStart(2, '0');
      arr.push(`${base}r${ringIndex}_${idx}.png`);
    }
    return arr;
  }, [ringIndex]);

  const textures = useLoader(THREE.TextureLoader, urls);

  useLayoutEffect(() => {
    textures.forEach(t => {
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
    });
  }, [textures]);

  return textures;
}

function CarouselIcon({ texture, index, activeIndex, radius, baseColor }: any) {
  const angle = index * (Math.PI / 6); 
  const x = Math.sin(angle) * radius;
  const y = Math.cos(angle) * radius;
  const isActive = index === activeIndex;
  
  return (
    <mesh position={[x, y, 0.005]} rotation={[0, 0, -angle]} scale={isActive ? [1.15, 1.15, 1] : [1, 1, 1]}>
      <planeGeometry args={[0.22, 0.22]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={isActive ? 1.0 : 0.6} 
        color={isActive ? "#ffffff" : baseColor} 
        toneMapped={false} 
        depthWrite={false}
      />
    </mesh>
  );
}

function CryptexRing({ 
  ringIndex, radiusInner, radiusOuter, iconRadius, zPos, dragRef, onInteract, color, hitInner, hitOuter
}: any) {
  const iconTextures = useIconAssets(ringIndex);
  const shuffledIcons = useMemo(() => shuffleArray(iconTextures, ringIndex * 1234), [iconTextures, ringIndex]);
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 30, tension: 200 } }));
  const rotationRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0); 
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // NEW: Track local focus
  const { size } = useThree();

  const bind = useDrag(({ xy: [x, y], delta: [dx, dy], down, event, first }) => {
    event.stopPropagation();

    if (first) { 
      dragRef.current = true; 
      onInteract(); 
      setHovered(true);
      setIsDragging(true);
      // Capture the pointer so movement stays locked to this ring even "out of bounds"
      (event.target as HTMLElement).setPointerCapture((event as any).pointerId);
    }
    
    if (down) {
      const cx = x - size.width / 2;
      const cy = y - size.height / 2;
      const r2 = cx * cx + cy * cy;
      
      if (r2 > 0) {
        // Rotational logic remains agnostic of pointer distance due to setPointerCapture
        const angleDelta = (cx * dy - cy * dx) / r2;
        const newRotation = rotationRef.current - angleDelta;
        const SLOT = Math.PI / 6;
        
        if (Math.round(rotationRef.current / SLOT) !== Math.round(newRotation / SLOT)) triggerHaptic();
        
        rotationRef.current = newRotation; 
        const idx = ((Math.round(newRotation / SLOT) % 12) + 12) % 12;
        if (idx !== activeIndex) setActiveIndex(idx);
        api.start({ rotationZ: rotationRef.current, immediate: true });
      }
    } else {
      // Release focus
      setHovered(false);
      setIsDragging(false);
      dragRef.current = false;
      const SLOT = Math.PI / 6;
      const snapAngle = Math.round(rotationRef.current / SLOT) * SLOT;
      rotationRef.current = snapAngle;
      setActiveIndex(((Math.round(snapAngle / SLOT) % 12) + 12) % 12);
      api.start({ rotationZ: snapAngle, immediate: false });
    }
  }, { preventScroll: true });

  return (
    // @ts-ignore
    <animated.group 
      rotation-z={spring.rotationZ} 
      position={[0, 0, zPos]} 
      rotation-y={Math.PI} 
      {...(bind() as any)}
      // Only trigger hover highlights if NO ring is currently being dragged
      onPointerOver={(e) => { 
        if (!dragRef.current) {
          e.stopPropagation(); 
          setHovered(true); 
        }
      }}
      onPointerOut={(e) => { 
        if (!isDragging) {
          e.stopPropagation(); 
          setHovered(false); 
        }
      }}
    >
      {/* 1. PHYSICAL METAL RING - Glow Target */}
      <mesh>
        <ringGeometry args={[radiusInner, radiusOuter, 64]} />
        <meshStandardMaterial 
          color="#8e59c3" 
          metalness={0.9} 
          roughness={0.2}
          emissive="#8e59c3"
          // Keep highlighted if either hovered OR actively being rotated
          emissiveIntensity={hovered || isDragging ? 1.8 : 0}
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* 2. INVISIBLE HIT AREA */}
      <mesh position={[0,0,0.01]}>
        <ringGeometry args={[hitInner ?? radiusInner, hitOuter ?? radiusOuter, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* 3. NATIVE STROKE BORDERS */}
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry args={[radiusInner, radiusInner + 0.02, 64]} />
        <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry args={[radiusOuter - 0.02, radiusOuter, 64]} />
        <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* 4. ICONS */}
      <group raycast={() => null}>
        {shuffledIcons.map((tex, i) => (
          <CarouselIcon 
            key={i} 
            texture={tex} 
            index={i} 
            activeIndex={activeIndex} 
            radius={iconRadius} 
            baseColor={color} 
          />
        ))}
      </group>
    </animated.group>
  );
}

// =========================================================
// --- OVERLAYS ---
// =========================================================
function ConstellationImages({ visible, layout }: any) {
  const [texStars, texHand, texConstellation, texBurst] = useLoader(THREE.TextureLoader, [
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/handstars.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/hand.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/constellation.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/burst.png",
  ]);

  const refHand = useRef<any>(null);
  const refConstellation = useRef<any>(null);
  const refBurst = useRef<any>(null);

  useFrame((state) => {
    if (!visible) return; 
    const t = state.clock.elapsedTime % 9.0; 
    let opHand = 0, opBurst = 0;
    if (t > 1.0 && t < 3.0) opHand = (t - 1.0) / 2.0;
    else if (t >= 3.0 && t < 6.0) { opHand = 1.0; opBurst = (1 - Math.cos((t - 3.0) * Math.PI * 2)) / 2; }
    else if (t >= 6.0 && t < 8.0) opHand = 1.0 - (t - 6.0) / 2.0;

    const maxOp = layout.isMobile ? 0.3 : 0.7;
    if (refHand.current) refHand.current.opacity = opHand * maxOp;
    if (refConstellation.current) refConstellation.current.opacity = opHand * maxOp; 
    if (refBurst.current) refBurst.current.opacity = opBurst * maxOp; 
  });

  return (
    <group position={layout.pos} rotation={layout.rot} scale={layout.scale} visible={visible}>
      <mesh position={[0,0,0]}><planeGeometry args={[3, 3]} /><meshBasicMaterial map={texStars} transparent opacity={layout.isMobile ? 0.3 : 0.6} toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0,0,0.01]}><planeGeometry args={[3, 3]} /><meshBasicMaterial ref={refHand} map={texHand} transparent opacity={0} toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0,0,0.02]}><planeGeometry args={[3, 3]} /><meshBasicMaterial ref={refConstellation} map={texConstellation} transparent opacity={0} toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0,0,0.03]}><planeGeometry args={[3, 3]} /><meshBasicMaterial ref={refBurst} map={texBurst} transparent opacity={0} toneMapped={false} depthWrite={false} /></mesh>
    </group>
  );
}

function ConstellationManager({ hasInteracted }: { hasInteracted: boolean }) {
  const { viewport } = useThree();
  const layout = useMemo(() => {
    const isMobile = viewport.width < viewport.height;
    if (isMobile) return { isMobile: true, pos: [viewport.width / 2.1, (viewport.height / 2.1) + (viewport.height * 0.1), -2], rot: [0, 0, Math.PI * 0.25], scale: [0.735, 0.735, 0.735] };
    return { isMobile: false, pos: [Math.max((viewport.width / 2) - 1.5, 2.5), viewport.height * -0.10, 0], rot: [0, 0.26, -0.35], scale: [0.875, 0.875, 0.875] };
  }, [viewport]);
  return <ConstellationImages visible={!hasInteracted} layout={layout} />;
}

// --- COSMIC BACKGROUND & STARS ---
function ShootingStar() {
  const ref = useRef<THREE.Mesh>(null);
  const [speed] = useState(() => 10 + Math.random() * 30);
  const [offset] = useState(() => Math.random() * 1000); 
  useFrame((state) => {
    if (ref.current) {
      const t = (state.clock.elapsedTime * speed + offset) % 250;
      if (t < 3) { ref.current.position.x = 15 - (t / 3) * 40; ref.current.position.y = 15 - (t / 3) * 40; ref.current.visible = true; }
      else ref.current.visible = false;
    }
  });
  return <mesh ref={ref} rotation={[0, 0, Math.PI / 4]} position={[0, 0, -15]}><planeGeometry args={[0.05, 4]} /><meshBasicMaterial color="#00ffff" transparent opacity={0.7} side={THREE.DoubleSide} /></mesh>;
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
      <mesh position={[0, 0, -20]}><planeGeometry args={[60, 60]} /><shaderMaterial ref={shaderRef} uniforms={shaderData.uniforms} vertexShader={shaderData.vertexShader} fragmentShader={shaderData.fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    </group>
  );
}

// --- ARTIFACT COMPONENTS ---
function LiquidLayer() {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/coin_displacement.png");
  useLayoutEffect(() => { texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true; }, [texture]);
  return (
    <mesh position={[0, 0, 0.03]}>
      <planeGeometry args={[3, 3, 512, 512]} />
      <meshPhysicalMaterial 
        color="#e0e0ff" 
        metalness={1.0} 
        roughness={0.6} 
        clearcoat={0.0}
        envMapIntensity={1.0}
        iridescence={1.0}
        iridescenceIOR={1.3}
        iridescenceThicknessRange={[0, 600]}
        map={texture} 
        transparent 
        alphaTest={0.3} 
        side={THREE.DoubleSide} 
        displacementMap={texture} 
        displacementScale={-0.3} 
        displacementBias={0.15} 
        bumpMap={texture}
        bumpScale={0.05}
      />
    </mesh>
  );
}

function PurpleDisc() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.6, 1.6, 0.05, 64]} /><meshPhysicalMaterial color="#330066" metalness={1.0} roughness={0.15} clearcoat={1.0} envMapIntensity={2.5} /></mesh>
  );
}

// --- INTERACTIVE ARTIFACT ---
function InteractiveArtifact({ setHasInteracted }: { setHasInteracted: (val: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const childIsDraggingRef = useRef(false);
  const tiltRef = useRef({ x: 0, y: 0 });

  const [ringStates, setRingStates] = useState([false, false, false]);
  const allRingsTouched = ringStates.every(Boolean);

  const handleRingInteract = (index: number) => {
    setRingStates(prev => {
      const next = [...prev];
      next[index - 1] = true;
      return next;
    });
  };

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.08);
      const tX = tiltRef.current.x !== 0 ? tiltRef.current.x : (state.pointer.y * 0.5);
      const tZ = tiltRef.current.y !== 0 ? -tiltRef.current.y : (-state.pointer.x * 0.5);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tX * 0.2, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tZ * 0.2, 0.1);
    }
  });

  const handleMainClick = (e: ThreeEvent<MouseEvent>) => {
    if (childIsDraggingRef.current) { childIsDraggingRef.current = false; e.stopPropagation(); return; }
    
    // RESTORED: Trigger constellation fade immediately on flip
    setHasInteracted(true);
    setTargetRotation(targetRotation + Math.PI);
  };

  return (
    <group ref={groupRef} onClick={handleMainClick} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
      <LiquidLayer />
      <PurpleDisc />
      
      {/* Locked/Pulsing Center Button on Cryptex Side */}
      <CenterButton isReady={allRingsTouched} onClick={() => { triggerHaptic(); }} />
      
      {/* Rings kept Cyan (#00ffff) */}
      <CryptexRing ringIndex={1} radiusInner={1.18} radiusOuter={1.55} iconRadius={1.37} zPos={-0.07} dragRef={childIsDraggingRef} onInteract={() => handleRingInteract(1)} color="#00ffff" hitInner={1.15} hitOuter={1.55} />
      <CryptexRing ringIndex={2} radiusInner={0.80} radiusOuter={1.20} iconRadius={0.99} zPos={-0.05} dragRef={childIsDraggingRef} onInteract={() => handleRingInteract(2)} color="#00ffff" hitInner={0.78} hitOuter={1.17} />
      <CryptexRing ringIndex={3} radiusInner={0.40} radiusOuter={0.82} iconRadius={0.60} zPos={-0.03} dragRef={childIsDraggingRef} onInteract={() => handleRingInteract(3)} color="#00ffff" hitInner={0.40} hitOuter={0.805} />
    </group>
  );
}

export default function TheArtifact() {
  const [hasInteracted, setHasInteracted] = useState(false);
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", overflow: "hidden", touchAction: "none" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
        <ResponsiveCamera />
        <Environment preset="warehouse" blur={0.8} />
        <rectAreaLight width={5} height={5} color="white" intensity={2} position={[3, 3, 3]} />
        <rectAreaLight width={5} height={10} color="#aa00ff" intensity={5} position={[-4, 0, 2]} />
        <pointLight position={[0, -2, -3]} intensity={5} color="#00ffff" distance={10} />
        <Suspense fallback={<Html center><div style={{color:'#aa00ff'}}>DECRYPTING...</div></Html>}>
          <CosmicBackground />
          <ConstellationManager hasInteracted={hasInteracted} />
          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
            <InteractiveArtifact setHasInteracted={setHasInteracted} />
          </Float>
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.6} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}