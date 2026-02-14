import React, { Suspense, useRef, useLayoutEffect, useState, useMemo, useEffect } from "react";
import { Canvas, useLoader, useFrame, ThreeEvent, useThree } from "@react-three/fiber"; 
import { Html, Environment, Float, Stars, Line } from "@react-three/drei"; 
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

// --- CONSTELLATION HAND (The "Nudge") ---
function ConstellationHand({ visible }: { visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Hand Geometry Data (Right hand pointing left)
  const stars = useMemo(() => [
    new THREE.Vector3(0, 0, 0),       // 0: Index Tip
    new THREE.Vector3(0.5, 0, 0),     // 1: Index Mid
    new THREE.Vector3(1.0, 0, 0),     // 2: Index Base
    new THREE.Vector3(0.8, 0.6, 0),   // 3: Thumb Tip
    new THREE.Vector3(1.2, 0.3, 0),   // 4: Thumb Base
    new THREE.Vector3(1.1, -0.3, 0),  // 5: Middle Knuckle
    new THREE.Vector3(1.15, -0.6, 0), // 6: Ring Knuckle
    new THREE.Vector3(1.2, -0.9, 0),  // 7: Pinky Knuckle
    new THREE.Vector3(1.8, -0.1, 0),  // 8: Wrist Top
    new THREE.Vector3(1.8, -0.8, 0),  // 9: Wrist Bottom
  ], []);

  // Connections for the "Constellation" lines
  const lines = useMemo(() => [
    [stars[0], stars[1]], [stars[1], stars[2]], // Index Finger
    [stars[3], stars[4]], [stars[4], stars[2]], // Thumb
    [stars[2], stars[5]], [stars[5], stars[6]], [stars[6], stars[7]], // Knuckles
    [stars[2], stars[8]], [stars[7], stars[9]], // Hand Back/Palm
    [stars[8], stars[9]] // Wrist cuff
  ], [stars]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Animation Loop: 0 to 1 over roughly 3 seconds
    const t = state.clock.elapsedTime % 3.5;
    
    // 1. Position Animation (Nudge)
    // Move from right (2.8) to left (2.2) to touch the ring
    const nudge = Math.sin(t * 2) * 0.2; 
    // Only nudge during the "visible" phase of the loop
    const basePos = 2.5;
    groupRef.current.position.x = basePos + (t < 1.5 ? -t * 0.3 : -0.45); // Poke in

    // 2. Opacity Animation (Fade In -> Hold -> Fade Out)
    let opacity = 0;
    if (t < 0.5) opacity = t * 2;       // Fade In
    else if (t < 2.0) opacity = 1;      // Hold
    else if (t < 3.0) opacity = 3.0 - t;// Fade Out
    else opacity = 0;                   // Wait

    // Apply opacity to children
    groupRef.current.children.forEach((child: any) => {
        if (child.material) {
            child.material.opacity = visible ? opacity * 0.6 : 0; // Max opacity 0.6
            child.visible = visible && opacity > 0.01;
        }
    });
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[2.5, -0.5, 0]} rotation={[0, 0, 0.2]}>
      {/* The Stars (Joints) */}
      {stars.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
        </mesh>
      ))}
      
      {/* The Constellation Lines */}
      {lines.map((points, i) => (
        <Line 
          key={`l-${i}`} 
          points={points} 
          color="#00ffff" 
          transparent 
          opacity={0.3} 
          lineWidth={1} 
        />
      ))}
    </group>
  );
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
        onInteract(); // Hide hand
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
function InteractiveArtifact() {
  const groupRef = useRef<THREE.Group>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const childIsDraggingRef = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false); // State to hide the hand

  const onInteract = () => {
    if (!hasInteracted) setHasInteracted(true);
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
    <group>
      {/* The Nudging Hand (only visible if user hasn't interacted) */}
      <ConstellationHand visible={!hasInteracted} />

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
    </group>
  );
}

// --- MAIN SCENE ---
export default function TheArtifact() {
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
          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
            <InteractiveArtifact />
          </Float>
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.6} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}