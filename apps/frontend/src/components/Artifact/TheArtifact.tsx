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

// =========================================================
// --- PHASE 3: THE CAROUSEL ENGINE (Dynamic Rings) ---
// =========================================================

// 1. ASSET LOADER HOOK
// dynamically fetches 1 base ring + 12 icons
function useRingAssets(ringIndex: number) {
  const base = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/";
  
  const urls = useMemo(() => {
    // 1. Base Ring Texture
    const arr = [`${base}cryptex_ring${ringIndex}.png`];
    // 2. Icon Textures (00-11)
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

  return {
    baseTexture: textures[0],
    iconTextures: textures.slice(1)
  };
}

// 2. SINGLE ICON COMPONENT
function CarouselIcon({ texture, index, activeIndex, radius }: { texture: THREE.Texture, index: number, activeIndex: number, radius: number }) {
  // 30 degrees (PI/6) per slot
  const angle = index * (Math.PI / 6); 
  
  // Trig to place them in a circle
  // Note: We rotate -angle to keep the icon upright relative to the ring center if needed, 
  // or we can just place them. Let's place them radially.
  const x = Math.sin(angle) * radius;
  const y = Math.cos(angle) * radius;

  // Active State Logic
  const isActive = index === activeIndex;
  
  // Visual Feedback
  const targetOpacity = isActive ? 1.0 : 0.5;
  const targetScale = isActive ? 1.15 : 1.0;
  const targetColor = isActive ? "#ffffff" : "#00ffff"; // White for active, Cyan for inactive

  return (
    <mesh position={[x, y, 0.002]} rotation={[0, 0, -angle]} scale={[targetScale, targetScale, 1]}>
      <planeGeometry args={[0.22, 0.22]} /> {/* Icon Size */}
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={targetOpacity} 
        color={targetColor} 
        toneMapped={false} 
        depthWrite={false}
      />
    </mesh>
  );
}

// 3. THE SMART RING COMPONENT
// Replaces the old static rings with a dynamic container
function CryptexRing({ 
  ringIndex, 
  radiusInner, 
  radiusOuter, 
  iconRadius, 
  zPos, 
  dragRef, 
  onInteract 
}: { 
  ringIndex: number, 
  radiusInner: number, 
  radiusOuter: number, 
  iconRadius: number,
  zPos: number,
  dragRef: React.MutableRefObject<boolean>, 
  onInteract: () => void 
}) {
  const { baseTexture, iconTextures } = useRingAssets(ringIndex);
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 30, tension: 200 } }));
  const rotationRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0); // Tracks which icon is at 12 o'clock
  const { size } = useThree();

  // Optimizations
  const ringArgs = useMemo(() => [radiusInner, radiusOuter, 64] as [number, number, number], [radiusInner, radiusOuter]);
  // Base texture plane is slightly larger than the ring to cover seams
  const planeSize = radiusOuter * 2.05;
  const planeArgs = useMemo(() => [planeSize, planeSize] as [number, number], [planeSize]);

  const bind = useDrag(({ xy: [x, y], delta: [dx, dy], down, event, first }) => {
    event.stopPropagation();
    if (first) {
        dragRef.current = true;
        onInteract();
    }
    
    if (down) {
      const cx = x - size.width / 2;
      const cy = y - size.height / 2;
      const r2 = cx * cx + cy * cy;
      
      if (r2 > 0) {
        const angleDelta = (cx * dy - cy * dx) / r2;
        const newRotation = rotationRef.current - angleDelta;
        
        // Haptics
        const SLOT = Math.PI / 6;
        const oldSlot = Math.round(rotationRef.current / SLOT);
        const newSlot = Math.round(newRotation / SLOT);
        if (oldSlot !== newSlot) triggerHaptic();

        rotationRef.current = newRotation; 
        
        // Calculate Active Index (Combination Logic)
        // We normalize the rotation to find which slot is currently at Angle 0 (Top)
        // Since we are rotating the ring Z, the item at -Rotation is at the top.
        const currentSlotIndex = Math.round(-newRotation / SLOT);
        // Modulo 12 to get 0-11 index, handling negative numbers correctly
        const normalizedIndex = ((currentSlotIndex % 12) + 12) % 12;
        
        if (normalizedIndex !== activeIndex) {
            setActiveIndex(normalizedIndex);
        }

        api.start({ rotationZ: rotationRef.current, immediate: true });
      }
    } else {
      // Snap Logic
      const SLOT = Math.PI / 6;
      const snapSlot = Math.round(rotationRef.current / SLOT);
      const snapAngle = snapSlot * SLOT;
      
      rotationRef.current = snapAngle;
      
      // Final index update on snap
      const currentSlotIndex = Math.round(-snapAngle / SLOT);
      const normalizedIndex = ((currentSlotIndex % 12) + 12) % 12;
      setActiveIndex(normalizedIndex);

      api.start({ rotationZ: snapAngle, immediate: false });
    }
  }, { preventScroll: true });

  return (
    // @ts-ignore
    <animated.group 
      rotation-z={spring.rotationZ} 
      position={[0, 0, zPos]} 
      rotation-y={Math.PI} // Flip Y so texture maps correctly if needed, or consistent with old model
      onClick={(e: any) => { e.stopPropagation(); onInteract(); }}
      {...(bind() as any)}
    >
      {/* Physical Metal Ring */}
      <mesh>
        <ringGeometry args={ringArgs} />
        <meshPhysicalMaterial color="#8e59c3" metalness={1.0} roughness={0.1} clearcoat={1.0} side={THREE.DoubleSide} />
      </mesh>

      {/* Base Texture (The ring artwork without icons) */}
      <mesh position={[0, 0, 0.001]} raycast={() => null}> 
        <planeGeometry args={planeArgs} /> 
        <meshBasicMaterial map={baseTexture} transparent opacity={1} color="#00ffff" toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* The 12 Dynamic Icons */}
      {iconTextures.map((tex, i) => (
        <CarouselIcon 
            key={i} 
            texture={tex} 
            index={i} 
            activeIndex={activeIndex} 
            radius={iconRadius} 
        />
      ))}
    </animated.group>
  );
}

// =========================================================
// --- CONSTELLATION OVERLAY (LOCKED & OPTIMIZED) ---
// =========================================================
function ConstellationImages({ visible, layout }: { visible: boolean, layout: any }) {
  const [texStars, texHand, texConstellation, texBurst] = useLoader(THREE.TextureLoader, [
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/handstars.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/hand.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/constellation.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/burst.png",
  ]);

  const refHand = useRef<THREE.MeshBasicMaterial>(null);
  const refConstellation = useRef<THREE.MeshBasicMaterial>(null);
  const refBurst = useRef<THREE.MeshBasicMaterial>(null);

  useLayoutEffect(() => {
    [texStars, texHand, texConstellation, texBurst].forEach(t => {
      t.minFilter = THREE.LinearFilter; 
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
    });
  }, [texStars, texHand, texConstellation, texBurst]);

  const isMobile = layout.isMobile;
  const maxHandOpacity = isMobile ? 0.3 : 0.7; 
  const baseStarOpacity = isMobile ? 0.3 : 0.6;

  useFrame((state) => {
    if (!visible) return; 

    // 9 SECOND CYCLE: Rest(1) -> Glow(2) -> Pulse(3) -> Fade(2) -> Rest(1)
    const t = state.clock.elapsedTime % 9.0; 
    const T_REST_START = 1.0; const T_FADE_IN = 3.0; const T_PULSE = 6.0; const T_FADE_OUT = 8.0;

    let opHand = 0; let opBurst = 0;

    if (t < T_REST_START) { opHand = 0; opBurst = 0; } 
    else if (t < T_FADE_IN) { opHand = (t - T_REST_START) / (T_FADE_IN - T_REST_START); opBurst = 0; } 
    else if (t < T_PULSE) { 
        opHand = 1.0; 
        const burstTime = t - T_FADE_IN; 
        opBurst = (1 - Math.cos(burstTime * Math.PI * 2)) / 2; // 3 Pulses
    } 
    else if (t < T_FADE_OUT) { 
        const fadeProgress = (t - T_PULSE) / (T_FADE_OUT - T_PULSE); 
        opHand = 1.0 - fadeProgress; opBurst = 0; 
    } 
    else { opHand = 0; opBurst = 0; }

    if (refHand.current) refHand.current.opacity = opHand * maxHandOpacity;
    if (refConstellation.current) refConstellation.current.opacity = opHand * maxHandOpacity; 
    if (refBurst.current) refBurst.current.opacity = opBurst * maxHandOpacity; 
  });

  const planeArgs = useMemo(() => [3, 3] as [number, number], []); 

  return (
    <group position={layout.pos} rotation={layout.rot} scale={layout.scale} visible={visible}>
      <mesh position={[0,0,0]}><planeGeometry args={planeArgs} /><meshBasicMaterial map={texStars} transparent opacity={baseStarOpacity} color="#ffffff" toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0,0,0.01]}><planeGeometry args={planeArgs} /><meshBasicMaterial ref={refHand} map={texHand} transparent opacity={0} color="#ffffff" toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0,0,0.02]}><planeGeometry args={planeArgs} /><meshBasicMaterial ref={refConstellation} map={texConstellation} transparent opacity={0} color="#ffffff" toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0,0,0.03]}><planeGeometry args={planeArgs} /><meshBasicMaterial ref={refBurst} map={texBurst} transparent opacity={0} color="#ffffff" toneMapped={false} depthWrite={false} /></mesh>
    </group>
  );
}

function ConstellationManager({ hasInteracted }: { hasInteracted: boolean }) {
  const { viewport } = useThree();
  const layout = useMemo(() => {
    const isMobile = viewport.width < viewport.height;
    const baseScale = 0.35;
    if (isMobile) {
      const mobileScale = baseScale * 2.1; 
      return { isMobile: true, pos: [viewport.width / 2.1, (viewport.height / 2.1) + (viewport.height * 0.1), -2], rot: [0, 0, Math.PI * 0.25], scale: [mobileScale, mobileScale, mobileScale] };
    } else {
      const desktopScale = baseScale * 2.5; 
      const safeX = Math.max( (viewport.width / 2) - 1.5, 2.5 );
      const shiftDownAmount = viewport.height * -0.10; 
      const rotZ = THREE.MathUtils.degToRad(-20); const rotY = THREE.MathUtils.degToRad(15); 
      return { isMobile: false, pos: [safeX, shiftDownAmount, 0], rot: [0, rotY, rotZ], scale: [desktopScale, desktopScale, desktopScale] };
    }
  }, [viewport]);
  return <ConstellationImages visible={!hasInteracted} layout={layout} />;
}

// --- SHOOTING STARS ---
function ShootingStar() {
  const ref = useRef<THREE.Mesh>(null);
  const [speed] = useState(() => 10 + Math.random() * 30);
  const [offset] = useState(() => Math.random() * 1000); 
  const [xShift] = useState(() => (Math.random() - 0.5) * 20); 
  const [yShift] = useState(() => (Math.random() - 0.5) * 20);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * speed + offset;
      const loop = t % 250; 
      if (loop < 3) { 
        const progress = loop / 3;
        ref.current.position.x = (15 + xShift) - progress * 40;
        ref.current.position.y = (15 + yShift) - progress * 40;
        ref.current.visible = true;
      } else { ref.current.visible = false; }
    }
  });
  return <mesh ref={ref} rotation={[0, 0, Math.PI / 4]} position={[0, 0, -15]}><planeGeometry args={[0.05, 3 + Math.random() * 4]} /><meshBasicMaterial color="#00ffff" transparent opacity={0.6 + Math.random() * 0.4} side={THREE.DoubleSide} /></mesh>;
}

function CosmicBackground() {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const shaderData = useMemo(() => ({
    uniforms: { uTime: { value: 0 }, uColor1: { value: new THREE.Color("#000000") }, uColor2: { value: new THREE.Color("#10002b") }, uColor3: { value: new THREE.Color("#5a189a") } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3; varying vec2 vUv;
      float random (in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
      float noise (in vec2 st) { vec2 i = floor(st); vec2 f = fract(st); float a = random(i); float b = random(i + vec2(1.0, 0.0)); float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0)); vec2 u = f * f * (3.0 - 2.0 * f); return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y; }
      float fbm (in vec2 st) { float value = 0.0; float amplitude = 0.5; for (int i = 0; i < 5; i++) { value += amplitude * noise(st); st *= 2.0; amplitude *= 0.5; } return value; }
      void main() { vec2 uv = vUv * 2.0 + vec2(uTime * 0.05, uTime * 0.02); float n = fbm(uv); vec3 color = mix(uColor1, uColor2, n * 1.5); float highlight = smoothstep(0.4, 0.8, n); color = mix(color, uColor3, highlight); float dist = distance(vUv, vec2(0.5)); color *= 1.2 - dist * 1.2; gl_FragColor = vec4(color, 1.0); }
    `
  }), []);
  useFrame((state) => { if (shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime; });
  return (
    <group>
      <Stars radius={100} depth={50} count={7000} factor={6} saturation={0} fade speed={1} />
      <ShootingStar /><ShootingStar /><ShootingStar /><ShootingStar /><ShootingStar />
      <mesh position={[0, 0, -20]}><planeGeometry args={[60, 60]} /><shaderMaterial ref={shaderRef} uniforms={shaderData.uniforms} vertexShader={shaderData.vertexShader} fragmentShader={shaderData.fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    </group>
  );
}

// --- LIQUID LOGO ---
function LiquidLayer() {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/coin_displacement.png");
  useLayoutEffect(() => { texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true; }, [texture]);
  const planeArgs = useMemo(() => [3, 3, 512, 512] as [number, number, number, number], []);
  return (
    <mesh position={[0, 0, 0.03]}><planeGeometry args={planeArgs} /><meshPhysicalMaterial color="#e0e0ff" metalness={1.0} roughness={0.6} clearcoat={0.0} envMapIntensity={1.0} iridescence={1.0} iridescenceIOR={1.3} iridescenceThicknessRange={[0, 600]} map={texture} transparent alphaTest={0.3} side={THREE.DoubleSide} displacementMap={texture} displacementScale={-0.3} displacementBias={0.15} bumpMap={texture} bumpScale={0.05} /></mesh>
  );
}

// --- PURPLE DISC ---
function PurpleDisc() {
  const cylArgs = useMemo(() => [1.6, 1.6, 0.05, 64] as [number, number, number, number], []);
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={cylArgs} /><meshPhysicalMaterial color="#330066" metalness={1.0} roughness={0.15} clearcoat={1.0} clearcoatRoughness={0.1} envMapIntensity={2.5} /></mesh>
  );
}

// --- INTERACTIVE ARTIFACT (MAIN) ---
function InteractiveArtifact({ setHasInteracted }: { setHasInteracted: (val: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const childIsDraggingRef = useRef(false);
  const tiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const x = event.gamma ? event.gamma / 45 : 0; 
      const y = event.beta ? (event.beta - 45) / 45 : 0; 
      tiltRef.current = { x: y, y: x };
    };
    if (window.DeviceOrientationEvent) window.addEventListener("deviceorientation", handleOrientation);
    return () => { window.removeEventListener("deviceorientation", handleOrientation); };
  }, []);

  const onInteract = () => setHasInteracted(true);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.08);
      const tX = tiltRef.current.x;
      const tY = tiltRef.current.y;
      const targetTiltX = tX !== 0 ? tX : (state.pointer.y * 0.5);
      const targetTiltZ = tY !== 0 ? -tY : (-state.pointer.x * 0.5);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetTiltX * 0.2, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetTiltZ * 0.2, 0.1);
    }
  });

  const handleMainClick = (e: ThreeEvent<MouseEvent>) => {
    onInteract();
    if (childIsDraggingRef.current) { childIsDraggingRef.current = false; e.stopPropagation(); return; }
    setTargetRotation(targetRotation + Math.PI);
  };

  return (
    <group ref={groupRef} onClick={handleMainClick} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
      <LiquidLayer />
      <PurpleDisc />
      
      {/* PHASE 3 CAROUSEL RINGS: Dynamically Loaded & Interactive */}
      <CryptexRing 
        ringIndex={1} radiusInner={1.02} radiusOuter={1.55} iconRadius={1.28} zPos={-0.07} 
        dragRef={childIsDraggingRef} onInteract={onInteract} 
      />
      <CryptexRing 
        ringIndex={2} radiusInner={0.65} radiusOuter={1.03} iconRadius={0.84} zPos={-0.05} 
        dragRef={childIsDraggingRef} onInteract={onInteract} 
      />
      <CryptexRing 
        ringIndex={3} radiusInner={0.25} radiusOuter={0.645} iconRadius={0.45} zPos={-0.03} 
        dragRef={childIsDraggingRef} onInteract={onInteract} 
      />
    </group>
  );
}

// --- MAIN SCENE ---
export default function TheArtifact() {
  const [hasInteracted, setHasInteracted] = useState(false);
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", overflow: "hidden", touchAction: "none" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
        <ResponsiveCamera />
        <Environment preset="warehouse" blur={0.8} />
        <rectAreaLight width={5} height={5} color="white" intensity={2} position={[3, 3, 3]} lookAt={[0, 0, 0] as any} />
        <rectAreaLight width={5} height={10} color="#aa00ff" intensity={5} position={[-4, 0, 2]} lookAt={[0, 0, 0] as any} />
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