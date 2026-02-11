import React, { Suspense, useRef, useLayoutEffect, useState, useMemo } from "react";
import { Canvas, useLoader, useFrame, ThreeEvent } from "@react-three/fiber"; 
import { Html, Environment, Float, Stars } from "@react-three/drei"; 
import { EffectComposer, Bloom } from "@react-three/postprocessing"; 
import { useDrag } from "@use-gesture/react"; 
import * as THREE from "three";
import { animated, useSpring } from "@react-spring/three"; 

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
function CryptexRingOuter({ dragRef }: { dragRef: React.MutableRefObject<boolean> }) {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/cryptex_ring1_test.png");
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 20, tension: 150 } }));
  const rotationRef = useRef(0);

  const bind = useDrag(({ delta: [dx, dy], down, event, first }) => {
    event.stopPropagation();
    if (first) dragRef.current = true;
    if (down) {
      rotationRef.current -= dx * 0.01; 
      api.start({ rotationZ: rotationRef.current, immediate: true });
    } else {
      const snapAngle = Math.PI / 6; 
      const remainder = rotationRef.current % snapAngle;
      const snapTarget = Math.abs(remainder) < snapAngle / 2 ? rotationRef.current - remainder : rotationRef.current + (snapAngle - remainder);
      rotationRef.current = snapTarget;
      api.start({ rotationZ: snapTarget, immediate: false });
    }
  });

  return (
    // @ts-ignore
    <animated.group 
      rotation-z={spring.rotationZ} 
      position={[0, 0, -0.07]} 
      rotation-y={Math.PI} 
      onClick={(e: any) => e.stopPropagation()}
      {...(bind() as any)}
    >
      <mesh>
        <ringGeometry args={[1.02, 1.55, 64]} />
        <meshPhysicalMaterial color="#c0b0d0" metalness={1.0} roughness={0.1} clearcoat={1.0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]} raycast={() => null}> 
        <planeGeometry args={[3.2, 3.2]} /> 
        <meshBasicMaterial map={texture} transparent opacity={1} color="#00ffff" toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </animated.group>
  );
}

// --- 3. INNER RING ---
function CryptexRingInner({ dragRef }: { dragRef: React.MutableRefObject<boolean> }) {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/cryptex_ring2_test.png");
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 30, tension: 200 } })); 
  const rotationRef = useRef(0);

  const bind = useDrag(({ delta: [dx, dy], down, event, first }) => {
    event.stopPropagation();
    if (first) dragRef.current = true;
    if (down) {
      rotationRef.current -= dx * 0.01; 
      api.start({ rotationZ: rotationRef.current, immediate: true });
    } else {
      const snapAngle = Math.PI / 6; 
      const remainder = rotationRef.current % snapAngle;
      const snapTarget = Math.abs(remainder) < snapAngle / 2 ? rotationRef.current - remainder : rotationRef.current + (snapAngle - remainder);
      rotationRef.current = snapTarget;
      api.start({ rotationZ: snapTarget, immediate: false });
    }
  });

  return (
    // @ts-ignore
    <animated.group 
      rotation-z={spring.rotationZ} 
      position={[0, 0, -0.05]} 
      rotation-y={Math.PI} 
      onClick={(e: any) => e.stopPropagation()}
      {...(bind() as any)}
    >
      <mesh>
        <ringGeometry args={[0.65, 1.03, 64]} />
        <meshPhysicalMaterial color="#9080a0" metalness={1.0} roughness={0.25} clearcoat={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]} raycast={() => null}> 
        <planeGeometry args={[3.3, 3.3]} /> 
        <meshBasicMaterial map={texture} transparent opacity={1} color="#00ffff" toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </animated.group>
  );
}

// --- 4. INNERMOST RING (CORE) ---
function CryptexRingInnermost({ dragRef }: { dragRef: React.MutableRefObject<boolean> }) {
  const texture = useLoader(THREE.TextureLoader, "/artifacts/cryptex_ring3_test.png");
  const [spring, api] = useSpring(() => ({ rotationZ: 0, config: { friction: 30, tension: 200 } })); 
  const rotationRef = useRef(0);

  const bind = useDrag(({ delta: [dx, dy], down, event, first }) => {
    event.stopPropagation(); 
    if (first) dragRef.current = true;
    if (down) {
      rotationRef.current -= dx * 0.01; 
      api.start({ rotationZ: rotationRef.current, immediate: true });
    } else {
      const snapAngle = Math.PI / 6; 
      const remainder = rotationRef.current % snapAngle;
      const snapTarget = Math.abs(remainder) < snapAngle / 2 ? rotationRef.current - remainder : rotationRef.current + (snapAngle - remainder);
      rotationRef.current = snapTarget;
      api.start({ rotationZ: snapTarget, immediate: false });
    }
  });

  return (
    // @ts-ignore
    <animated.group 
      rotation-z={spring.rotationZ} 
      position={[0, 0, -0.03]} 
      rotation-y={Math.PI} 
      onClick={(e: any) => e.stopPropagation()}
      {...(bind() as any)}
    >
      <mesh>
        <ringGeometry args={[0.25, 0.645, 64]} />
        <meshPhysicalMaterial color="#3a2a4a" metalness={1.0} roughness={0.2} clearcoat={0.9} side={THREE.DoubleSide} />
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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.08);
    }
  });

  const handleMainClick = (e: ThreeEvent<MouseEvent>) => {
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
      <CryptexRingOuter dragRef={childIsDraggingRef} />
      <CryptexRingInner dragRef={childIsDraggingRef} />
      <CryptexRingInnermost dragRef={childIsDraggingRef} />
    </group>
  );
}

// --- MAIN SCENE ---
export default function TheArtifact() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
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