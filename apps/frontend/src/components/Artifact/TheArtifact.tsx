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

// --- PNG IMAGE OVERLAY SYSTEM ---
function ConstellationImages({ visible, layout }: { visible: boolean, layout: any }) {
  // Load assets
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

  // Opacity Ceilings (Keeping it faint/ethereal as requested)
  const isMobile = layout.isMobile;
  const maxHandOpacity = isMobile ? 0.25 : 0.5; 
  const baseStarOpacity = isMobile ? 0.3 : 0.6;

  useFrame((state) => {
    if (!visible) return; 

    // Total Cycle: 9 Seconds
    const t = state.clock.elapsedTime % 9.0; 

    // --- TIMING CONFIG ---
    const T_REST_START = 1.0;   // 0s-1s: Just Stars
    const T_FADE_IN    = 3.0;   // 1s-3s: Hand Glows In
    const T_PULSE      = 6.0;   // 3s-6s: Burst Pulses x3
    const T_FADE_OUT   = 8.0;   // 6s-8s: Fade Out
    // 8s-9s: End Rest (Buffer)

    let opHand = 0;
    let opBurst = 0;

    // --- SEQUENCE LOGIC ---
    if (t < T_REST_START) {
        // Phase 0: Rest
        opHand = 0;
        opBurst = 0;
    } 
    else if (t < T_FADE_IN) {
        // Phase 1: Hand Glows from 0 to 100%
        // Normalize time 0.0 -> 1.0 over duration
        opHand = (t - T_REST_START) / (T_FADE_IN - T_REST_START);
        opBurst = 0;
    } 
    else if (t < T_PULSE) {
        // Phase 2: Hand Solid, Burst Pulses 3 Times
        opHand = 1.0;
        
        const burstTime = t - T_FADE_IN;
        // Frequency logic: We want 3 pulses in 3 seconds (1Hz)
        // Cosine wave shifted: (1 - cos(2*PI*t)) / 2 starts at 0, goes to 1, back to 0
        opBurst = (1 - Math.cos(burstTime * Math.PI * 2)) / 2;
    } 
    else if (t < T_FADE_OUT) {
        // Phase 3: Fade Everything Out
        const fadeProgress = (t - T_PULSE) / (T_FADE_OUT - T_PULSE);
        opHand = 1.0 - fadeProgress;
        opBurst = 0; // Burst finishes exactly at 0 from previous phase
    } 
    else {
        // Phase 4: Final Rest
        opHand = 0;
        opBurst = 0;
    }

    // Apply Opacities (Scaled by 'maxHandOpacity' to keep it faint)
    if (refHand.current) refHand.current.opacity = opHand * maxHandOpacity;
    if (refConstellation.current) refConstellation.current.opacity = opHand * maxHandOpacity; 
    if (refBurst.current) refBurst.current.opacity = opBurst * maxHandOpacity; 
  });

  const PLANE_SIZE = 3; 

  return (
    <group position={layout.pos} rotation={layout.rot} scale={layout.scale} visible={visible}>
      {/* LAYER 1: STARS (Persistent) */}
      <mesh position={[0,0,0]}>
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <meshBasicMaterial 
            map={texStars} 
            transparent 
            opacity={baseStarOpacity}
            color="#ffffff" 
            toneMapped={false} 
            depthWrite={false} 
        />
      </mesh>

      {/* LAYER 2: HAND */}
      <mesh position={[0,0,0.01]}>
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <meshBasicMaterial ref={refHand} map={texHand} transparent opacity={0} color="#ffffff" toneMapped={false} depthWrite={false} />
      </mesh>

      {/* LAYER 3: CONSTELLATION */}
      <mesh position={[0,0,0.02]}>
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <meshBasicMaterial ref={refConstellation} map={texConstellation} transparent opacity={0} color="#ffffff" toneMapped={false} depthWrite={false} />
      </mesh>

      {/* LAYER 4: BURST */}
      <mesh position={[0,0,0.03]}>
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <meshBasicMaterial ref={refBurst} map={texBurst} transparent opacity={0} color="#ffffff" toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// 3. MAIN MANAGER
function ConstellationManager({ hasInteracted }: { hasInteracted: boolean }) {
  const { viewport } = useThree();

  const layout = useMemo(() => {
    const isMobile = viewport.width < viewport.height;
    const baseScale = 0.35;
    
    if (isMobile) {
      // --- MOBILE CONFIG ---
      // Scale: ~2.1x base (Reduced 30% from 3.0)
      const mobileScale = baseScale * 2.1; 

      return {
        isMobile: true,
        // Pos: Top Right + 10% Higher
        pos: [
            viewport.width / 2.1, 
            (viewport.height / 2.1) + (viewport.height * 0.1), 
            -2
        ], 
        rot: [0, 0, Math.PI * 0.25],
        scale: [mobileScale, mobileScale, mobileScale]
      };
    } else {
      // --- DESKTOP CONFIG ---
      // Scale: ~2.45x base (Reduced 30% from 3.5)
      const desktopScale = baseScale * 2.45; 

      const rightAnchor = viewport.width / 2.2; 
      const paddingRight = viewport.width * 0.05; 
      const shiftDownAmount = viewport.height * -0.10; 
      const rotZ = THREE.MathUtils.degToRad(-20); 
      const rotY = THREE.MathUtils.degToRad(15); 

      return {
        isMobile: false,
        pos: [rightAnchor - paddingRight, shiftDownAmount, -2],
        rot: [0, rotY, rotZ], 
        scale: [desktopScale, desktopScale, desktopScale]
      };
    }
  }, [viewport]);

  return <ConstellationImages visible={!hasInteracted} layout={layout} />;
}


// --- 0. SHOOTING STAR SYSTEM ---
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
      } else {
        ref.current.visible = false;
      }
    }
  });

  return (
    <mesh ref={ref} rotation={[0, 0, Math.PI / 4]} position={[0, 0, -15]}>
      <planeGeometry args={[0.05, 3 + Math.random() * 4]} /> 
      <meshBasicMaterial color="#00ffff" transparent opacity={0.6 + Math.random() * 0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// --- 1. COSMIC BACKGROUND ---
function CosmicBackground() {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const shaderData = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#000000") }, 
      uColor2: { value: new THREE.Color("#10002b") }, 
      uColor3: { value: new THREE.Color("#5a189a") }  
    },
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
      <mesh position={[0, 0, -20]}> <planeGeometry args={[60, 60]} /> <shaderMaterial ref={shaderRef} uniforms={shaderData.uniforms} vertexShader={shaderData.vertexShader} fragmentShader={shaderData.fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} /> </mesh>
    </group>
  );
}

// --- 2. OUTER RING ---
function CryptexRingOuter({ dragRef, onInteract }: { dragRef: React.MutableRefObject<boolean>, onInteract: () => void }) {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/cryptex_ring1_test.png");
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 20, tension: 150 } }));
  const rotationRef = useRef(0);
  const { size } = useThree(); 

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

        const SLOT = Math.PI / 6; 
        const oldSlot = Math.floor(rotationRef.current / SLOT);
        const newSlot = Math.floor(newRotation / SLOT);
        
        if (oldSlot !== newSlot) triggerHaptic();

        rotationRef.current = newRotation; 
        api.start({ rotationZ: rotationRef.current, immediate: true });
      }

    } else {
      const snapAngle = Math.PI / 6; 
      const remainder = rotationRef.current % snapAngle;
      const snapTarget = Math.abs(remainder) < snapAngle / 2 ? rotationRef.current - remainder : rotationRef.current + (snapAngle - remainder);
      rotationRef.current = snapTarget;
      api.start({ rotationZ: snapTarget, immediate: false });
    }
  }, { preventScroll: true });

  return (
    // @ts-ignore
    <animated.group 
      rotation-z={spring.rotationZ} 
      position={[0, 0, -0.07]} 
      rotation-y={Math.PI} 
      onClick={(e: any) => { e.stopPropagation(); onInteract(); }}
      {...(bind() as any)}
    >
      <mesh>
        <ringGeometry args={[1.02, 1.55, 64]} />
        <meshPhysicalMaterial color="#8e59c3" metalness={1.0} roughness={0.1} clearcoat={1.0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]} raycast={() => null}> 
        <planeGeometry args={[3.2, 3.2]} /> 
        <meshBasicMaterial map={texture} transparent opacity={1} color="#00ffff" toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </animated.group>
  );
}

// --- 3. INNER RING ---
function CryptexRingInner({ dragRef, onInteract }: { dragRef: React.MutableRefObject<boolean>, onInteract: () => void }) {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/cryptex_ring2_test.png");
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 30, tension: 200 } })); 
  const rotationRef = useRef(0);
  const { size } = useThree();

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
        const oldRotation = rotationRef.current;
        const newRotation = rotationRef.current - angleDelta;

        const SLOT = Math.PI / 6;
        const oldSlot = Math.floor(oldRotation / SLOT);
        const newSlot = Math.floor(newRotation / SLOT);
        if (oldSlot !== newSlot) triggerHaptic();

        rotationRef.current = newRotation; 
        api.start({ rotationZ: rotationRef.current, immediate: true });
      }
    } else {
      const snapAngle = Math.PI / 6; 
      const remainder = rotationRef.current % snapAngle;
      const snapTarget = Math.abs(remainder) < snapAngle / 2 ? rotationRef.current - remainder : rotationRef.current + (snapAngle - remainder);
      rotationRef.current = snapTarget;
      api.start({ rotationZ: snapTarget, immediate: false });
    }
  }, { preventScroll: true });

  return (
    // @ts-ignore
    <animated.group 
      rotation-z={spring.rotationZ} 
      position={[0, 0, -0.05]} 
      rotation-y={Math.PI} 
      onClick={(e: any) => { e.stopPropagation(); onInteract(); }}
      {...(bind() as any)}
    >
      <mesh>
        <ringGeometry args={[0.65, 1.03, 64]} />
        <meshPhysicalMaterial color="#8e59c3" metalness={1.0} roughness={0.3} clearcoat={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]} raycast={() => null}> 
        <planeGeometry args={[3.3, 3.3]} /> 
        <meshBasicMaterial map={texture} transparent opacity={1} color="#00ffff" toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </animated.group>
  );
}

// --- 4. INNERMOST RING (CORE) ---
function CryptexRingInnermost({ dragRef, onInteract }: { dragRef: React.MutableRefObject<boolean>, onInteract: () => void }) {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/cryptex_ring3_test.png");
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 30, tension: 200 } })); 
  const rotationRef = useRef(0);
  const { size } = useThree();

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
        const oldRotation = rotationRef.current;
        const newRotation = rotationRef.current - angleDelta;

        const SLOT = Math.PI / 6;
        const oldSlot = Math.floor(oldRotation / SLOT);
        const newSlot = Math.floor(newRotation / SLOT);
        if (oldSlot !== newSlot) triggerHaptic();

        rotationRef.current = newRotation; 
        api.start({ rotationZ: rotationRef.current, immediate: true });
      }
    } else {
      const snapAngle = Math.PI / 6; 
      const remainder = rotationRef.current % snapAngle;
      const snapTarget = Math.abs(remainder) < snapAngle / 2 ? rotationRef.current - remainder : rotationRef.current + (snapAngle - remainder);
      rotationRef.current = snapTarget;
      api.start({ rotationZ: snapTarget, immediate: false });
    }
  }, { preventScroll: true });

  return (
    // @ts-ignore
    <animated.group 
      rotation-z={spring.rotationZ} 
      position={[0, 0, -0.03]} 
      rotation-y={Math.PI} 
      onClick={(e: any) => { e.stopPropagation(); onInteract(); }}
      {...(bind() as any)}
    >
      <mesh>
        <ringGeometry args={[0.25, 0.645, 64]} />
        <meshPhysicalMaterial color="#8e59c3" metalness={1.0} roughness={0.1} clearcoat={1.0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]} raycast={() => null}> 
        <planeGeometry args={[3.4, 3.4]} /> 
        <meshBasicMaterial map={texture} transparent opacity={1} color="#00ffff" toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </animated.group>
  );
}

// --- 5. THE LIQUID LOGO ---
function LiquidLayer() {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/coin_displacement.png");
  useLayoutEffect(() => { texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true; }, [texture]);
  return (
    <mesh position={[0, 0, 0.03]}> 
      <planeGeometry args={[3, 3, 512, 512]} />
      <meshPhysicalMaterial 
        color="#e0e0ff" metalness={1.0} roughness={0.6} clearcoat={0.0} envMapIntensity={1.0}    
        iridescence={1.0} iridescenceIOR={1.3} iridescenceThicknessRange={[0, 600]}
        map={texture} transparent alphaTest={0.3} side={THREE.DoubleSide}
        displacementMap={texture} displacementScale={-0.3} displacementBias={0.15} bumpMap={texture} bumpScale={0.05}
      />
    </mesh>
  );
}

// --- 6. THE PURPLE DISC ---
function PurpleDisc() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[1.6, 1.6, 0.05, 64]} />
      <meshPhysicalMaterial color="#330066" metalness={1.0} roughness={0.15} clearcoat={1.0} clearcoatRoughness={0.1} envMapIntensity={2.5} />
    </mesh>
  );
}

// --- 7. INTERACTIVE ARTIFACT ---
function InteractiveArtifact({ setHasInteracted }: { setHasInteracted: (val: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const childIsDraggingRef = useRef(false);

  const onInteract = () => {
    setHasInteracted(true);
  };

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.08);
    }
  });

  const handleMainClick = (e: ThreeEvent<MouseEvent>) => {
    onInteract();
    if (childIsDraggingRef.current) {
      childIsDraggingRef.current = false;
      e.stopPropagation();
      return;
    }
    setTargetRotation(targetRotation + Math.PI);
  };

  return (
    <group 
      ref={groupRef}
      onClick={handleMainClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <LiquidLayer />
      <PurpleDisc />
      
      <CryptexRingOuter dragRef={childIsDraggingRef} onInteract={onInteract} />
      <CryptexRingInner dragRef={childIsDraggingRef} onInteract={onInteract} />
      <CryptexRingInnermost dragRef={childIsDraggingRef} onInteract={onInteract} />
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
          
          {/* STATIC OVERLAY: Constellation Images */}
          <ConstellationManager hasInteracted={hasInteracted} />

          {/* FLOATING ARTIFACT */}
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