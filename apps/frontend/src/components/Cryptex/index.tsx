import React, { useMemo, useRef, useState, useLayoutEffect } from "react";
import { useLoader, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useDrag } from "@use-gesture/react";
import * as THREE from "three";
import { animated, useSpring } from "@react-spring/three";
import { triggerHaptic, shuffleArray } from "../../utils/artifactUtils";

// --- CENTER BUTTON ---
export function CenterButton({ isReady, onClick }: { isReady: boolean, onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (isReady && meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      meshRef.current.scale.set(s, s, s);
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}
      onClick={(e) => { if (isReady) { e.stopPropagation(); onClick(); } }}>
      <circleGeometry args={[0.3, 32]} />
      <meshStandardMaterial 
        color={isReady ? "#00ff88" : "#1a0033"} 
        emissive={isReady ? "#00ff88" : "#000000"}
        emissiveIntensity={isReady ? 3 : 0}
        metalness={0.8} roughness={0.2}
      />
    </mesh>
  );
}

// 1. Restore the texture asset loader hook exactly from original
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

// --- LIQUID & BASE LAYERS ---
export function LiquidLayer() {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/coin_displacement.png");
  useLayoutEffect(() => { 
    texture.minFilter = THREE.LinearFilter; 
    texture.magFilter = THREE.LinearFilter; 
    texture.needsUpdate = true; 
  }, [texture]);
  return (
    <mesh position={[0, 0, 0.03]}>
      <planeGeometry args={[3, 3, 512, 512]} />
      <meshPhysicalMaterial 
        color="#e0e0ff" metalness={1.0} roughness={0.6} clearcoat={0.0}
        envMapIntensity={1.0} iridescence={1.0} iridescenceIOR={1.3} iridescenceThicknessRange={[0, 600]}
        map={texture} transparent alphaTest={0.3} side={THREE.DoubleSide} 
        displacementMap={texture} displacementScale={-0.3} displacementBias={0.15} 
        bumpMap={texture} bumpScale={0.05}
      />
    </mesh>
  );
}

export function PurpleDisc({ opacity = 1 }: { opacity?: any }) {
  return (
    <animated.mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[1.6, 1.6, 0.05, 64]} />
      <animated.meshPhysicalMaterial color="#330066" transparent opacity={opacity} metalness={1.0} roughness={0.15} />
    </animated.mesh>
  );
}

// --- CAROUSEL ENGINE ---
function CarouselIcon({ texture, index, activeIndex, radius, baseColor }: any) {
  const angle = index * (Math.PI / 6);
  const isActive = index === activeIndex;
  return (
    <mesh position={[Math.sin(angle) * radius, Math.cos(angle) * radius, 0.005]} rotation={[0, 0, -angle]} scale={isActive ? [1.15, 1.15, 1] : [1, 1, 1]}>
      <planeGeometry args={[0.22, 0.22]} />
      <meshBasicMaterial map={texture} transparent opacity={isActive ? 1.0 : 0.6} color={isActive ? "#ffffff" : baseColor} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

// 2. Update CryptexRing to use the hook and restore the hit-area meshes
export function CryptexRing({ ringIndex, radiusInner, radiusOuter, iconRadius, zPos, dragRef, onInteract, color }: any) {
  const iconTextures = useIconAssets(ringIndex);
  const shuffledIcons = useMemo(() => shuffleArray(iconTextures, ringIndex * 1234), [iconTextures, ringIndex]);
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 30, tension: 200 } }));
  const rotationRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const { size } = useThree();

  const bind = useDrag(({ xy: [x, y], delta: [dx, dy], down, event, first }) => {
    event.stopPropagation();
    if (first) {
    dragRef.current = true;
    onInteract();
    setHovered(true);
    
    // SAFE POINTER CAPTURE: Ensure pointer is active and not already captured
    const target = event.target as HTMLElement;
    const pointerId = (event as any).pointerId;
    if (target && pointerId !== undefined && target.setPointerCapture) {
      try {
        // Only capture if not already captured to avoid the NotFoundError
        if (!target.hasPointerCapture?.(pointerId)) {
          target.setPointerCapture(pointerId);
        }
      } catch (e) {
        /* Ignore capture failures on quick taps */
      }
    }
  }
    if (down) {
      const cx = x - size.width / 2;
      const cy = y - size.height / 2;
      const r2 = cx * cx + cy * cy;
      if (r2 > 0) {
        const newRotation = rotationRef.current - (cx * dy - cy * dx) / r2;
        if (Math.round(rotationRef.current / (Math.PI / 6)) !== Math.round(newRotation / (Math.PI / 6))) triggerHaptic();
        rotationRef.current = newRotation;
        api.start({ rotationZ: newRotation, immediate: true });
      }
    } else {
      dragRef.current = false; setHovered(false);
      const snap = Math.round(rotationRef.current / (Math.PI / 6)) * (Math.PI / 6);
      rotationRef.current = snap;
      api.start({ rotationZ: snap, immediate: false });
    }
  }, { preventScroll: true });

  return (
    <animated.group rotation-z={spring.rotationZ} position={[0, 0, zPos]} rotation-y={Math.PI} {...(bind() as any)}
      onPointerOver={() => !dragRef.current && setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Main Purple Ring */}
      <mesh>
        <ringGeometry args={[radiusInner, radiusOuter, 64]} />
        <meshStandardMaterial color="#8e59c3" metalness={0.9} roughness={0.2} emissive="#8e59c3" emissiveIntensity={hovered ? 1.8 : 0} side={THREE.DoubleSide} />
      </mesh>
      
      {/* RESTORED: Inner Cyan Glow Border [cite: 37] */}
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry args={[radiusInner, radiusInner + 0.02, 64]} />
        <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      
      {/* RESTORED: Outer Cyan Glow Border [cite: 38] */}
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry args={[radiusOuter - 0.02, radiusOuter, 64]} />
        <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0,0,0.01]}>
        <ringGeometry args={[radiusInner, radiusOuter, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {shuffledIcons.map((tex, i) => <CarouselIcon key={i} texture={tex} index={i} activeIndex={activeIndex} radius={iconRadius} baseColor={color} />)}
    </animated.group>
  );
}

// --- OVERLAYS & BACKGROUND ---
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

export function CosmicBackground() {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const shaderData = useMemo(() => ({
    uniforms: { uTime: { value: 0 }, uColor1: { value: new THREE.Color("#000000") }, uColor2: { value: new THREE.Color("#10002b") }, uColor3: { value: new THREE.Color("#5a189a") } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor1, uColor2, uColor3; varying vec2 vUv;
      float random (vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
      float noise (vec2 st) { vec2 i = floor(st); vec2 f = fract(st); float a = random(i); float b = random(i + vec2(1.0, 0.0)); float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0)); vec2 u = f * f * (3.0 - 2.0 * f); return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y; }
      float fbm (vec2 st) { float value = 0.0, amp = 0.5; for (int i = 0; i < 5; i++) { value += amp * noise(st); st *= 2.0; amp *= 0.5; } return value; }
      void main() { vec2 uv = vUv * 2.0 + vec2(uTime * 0.05, uTime * 0.02); float n = fbm(uv); vec3 color = mix(uColor1, uColor2, n * 1.5); color = mix(color, uColor3, smoothstep(0.4, 0.8, n)); gl_FragColor = vec4(color * (1.2 - distance(vUv, vec2(0.5)) * 1.2), 1.0); }
    `
  }), []);
  useFrame((state) => { if (shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime; });
  return (
    <group>
      <Stars radius={100} depth={50} count={7000} factor={6} saturation={0} fade speed={1} />
      {[...Array(5)].map((_, i) => <ShootingStar key={i} />)}
      <mesh position={[0, 0, -20]}><planeGeometry args={[60, 60]} /><shaderMaterial ref={shaderRef} {...shaderData} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    </group>
  );
}

// --- Add this interface above the component ---
interface LayoutConfig {
  isMobile: boolean;
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
}

export function ConstellationManager({ hasInteracted }: { hasInteracted: boolean }) {
  const { viewport } = useThree();
  const [texStars, texHand, texConstellation, texBurst] = useLoader(THREE.TextureLoader, [
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/handstars.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/hand.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/constellation.png",
    "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/artifact/burst.png",
  ]);
  const refHand = useRef<any>(null);
  const refConstellation = useRef<any>(null);
  const refBurst = useRef<any>(null);

  // Explicitly type the useMemo return to LayoutConfig
  const layout = useMemo((): LayoutConfig => {
    const isMobile = viewport.width < viewport.height;
    if (isMobile) {
      return { 
        isMobile: true, 
        pos: [viewport.width / 2.1, (viewport.height / 2.1) + (viewport.height * 0.1), -2], 
        rot: [0, 0, Math.PI * 0.25], 
        scale: [0.735, 0.735, 0.735] 
      };
    }
    return { 
      isMobile: false, 
      pos: [Math.max((viewport.width / 2) - 1.5, 2.5), viewport.height * -0.10, 0], 
      rot: [0, 0.26, -0.35], 
      scale: [0.875, 0.875, 0.875] 
    };
  }, [viewport]);

  useFrame((state) => {
    if (hasInteracted) return; 
    const t = state.clock.elapsedTime % 9.0; 
    let opHand = 0, opBurst = 0;
    if (t > 1.0 && t < 3.0) opHand = (t - 1.0) / 2.0;
    else if (t >= 3.0 && t < 6.0) { 
        opHand = 1.0; 
        opBurst = (1 - Math.cos((t - 3.0) * Math.PI * 2)) / 2; 
    }
    else if (t >= 6.0 && t < 8.0) opHand = 1.0 - (t - 6.0) / 2.0;

    const maxOp = layout.isMobile ? 0.3 : 0.7;
    if (refHand.current) refHand.current.opacity = opHand * maxOp;
    if (refConstellation.current) refConstellation.current.opacity = opHand * maxOp; 
    if (refBurst.current) refBurst.current.opacity = opBurst * maxOp; 
  });

  return (
    <group position={layout.pos} rotation={layout.rot} scale={layout.scale} visible={!hasInteracted}>
      <mesh position={[0,0,0]}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial map={texStars} transparent opacity={layout.isMobile ? 0.3 : 0.6} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0,0,0.01]}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial ref={refHand} map={texHand} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0,0,0.02]}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial ref={refConstellation} map={texConstellation} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0,0,0.03]}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial ref={refBurst} map={texBurst} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// --- INTERACTIVE ARTIFACT ---
export function InteractiveArtifact({ setHasInteracted, onUnlock }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const [targetRotationY, setTargetRotationY] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const childIsDraggingRef = useRef(false);
  const [ringStates, setRingStates] = useState([false, false, false]);
  const { uiOpacity } = useSpring({ uiOpacity: isUnlocked ? 0 : 1, config: { tension: 100, friction: 20 } });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.08);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, isUnlocked ? Math.PI / 2 : state.pointer.y * 0.1, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, isUnlocked ? 0 : -state.pointer.x * 0.1, 0.1);
    }
  });

  return (
    <group ref={groupRef} onClick={() => { if (!childIsDraggingRef.current && targetRotationY === 0) { setHasInteracted(true); setTargetRotationY(Math.PI); } }}>
      <animated.group scale={uiOpacity} visible={uiOpacity.to(o => o > 0.01)}>
         <LiquidLayer /> 
         <PurpleDisc opacity={uiOpacity} />
         <CenterButton isReady={ringStates.every(Boolean)} onClick={() => { triggerHaptic(); setIsUnlocked(true); if (onUnlock) onUnlock(); }} />
      </animated.group>
      <animated.group visible={uiOpacity.to(o => o > 0.2)}>
        <CryptexRing ringIndex={1} radiusInner={1.18} radiusOuter={1.55} iconRadius={1.37} zPos={-0.07} dragRef={childIsDraggingRef} onInteract={() => setRingStates(s => [true, s[1], s[2]])} color="#00ffff" />
        <CryptexRing ringIndex={2} radiusInner={0.80} radiusOuter={1.20} iconRadius={0.99} zPos={-0.05} dragRef={childIsDraggingRef} onInteract={() => setRingStates(s => [s[0], true, s[2]])} color="#00ffff" />
        <CryptexRing ringIndex={3} radiusInner={0.40} radiusOuter={0.82} iconRadius={0.60} zPos={-0.03} dragRef={childIsDraggingRef} onInteract={() => setRingStates(s => [s[0], s[1], true])} color="#00ffff" />
      </animated.group>
    </group>
  );
}