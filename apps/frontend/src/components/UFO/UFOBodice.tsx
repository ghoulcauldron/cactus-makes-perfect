// src/components/UFO/UFOBodice.tsx
// deprecated - this was an early testbed for the UFO character, but we ended up implementing it directly in PhaseController for better control over its lifecycle and state. Keeping it here for reference and potential future use as a standalone character component.
import React, { useMemo, useRef, useLayoutEffect } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { animated, useSpring } from "@react-spring/three";

export function UFOBodice({ active, position = [0, 0, 0] }: { active: boolean, position?: [number, number, number] }) {
  const baseRadius = 1.4;
  const beltRef = useRef<THREE.Mesh>(null);
  const floatRef = useRef<THREE.Group>(null);

  const alienAlloy = useLoader(THREE.TextureLoader, "/artifacts/ufo_texture.png");
  const energyLayer = useMemo(() => {
    const tex = alienAlloy.clone();
    tex.needsUpdate = true;
    return tex;
  }, [alienAlloy]);

  useLayoutEffect(() => {
    [alienAlloy, energyLayer].forEach(t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 16;
      t.center.set(0.5, 0.5); 
    });
    energyLayer.repeat.set(2, 2); 
  }, [alienAlloy, energyLayer]);

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.elapsedTime;
    const delta = state.clock.getDelta();

    // Swirl Logic
    const alloySpeed = t * 0.2;
    alienAlloy.offset.x = Math.sin(alloySpeed) * 0.15;
    alienAlloy.offset.y = Math.cos(alloySpeed) * 0.15;
    alienAlloy.rotation += 0.15 * delta;

    const energySpeed = t * -0.4;
    energyLayer.offset.x = Math.cos(energySpeed) * 0.2;
    energyLayer.offset.y = Math.sin(energySpeed) * 0.2;
    energyLayer.rotation -= 0.3 * delta;

    const pulse = 1.5 + Math.sin(t * 2) * 0.5;
    energyLayer.repeat.set(pulse, pulse);

    // Autonomous Float + Recoil
    if (floatRef.current) {
      const driftY = Math.sin(t * 0.6) * 0.15;
      const driftX = Math.cos(t * 0.4) * 0.1;
      const recoil = Math.sin(t * 2) * 0.08; 

      floatRef.current.position.y = driftY;
      floatRef.current.position.x = driftX;
      floatRef.current.position.z = recoil; 
      
      floatRef.current.rotation.z = Math.sin(t * 0.3) * 0.05;
      floatRef.current.rotation.x = Math.cos(t * 0.5) * 0.05;
    }

    if (beltRef.current) {
      (beltRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1 + Math.sin(t * 2) * 0.8;
    }
  });

  const { scale, opacity } = useSpring({
    scale: active ? [1, 1, 1] : [0.1, 0.1, 0.1], 
    opacity: active ? 1 : 0,
    config: { mass: 2, tension: 120, friction: 25 }
  });

  const materialProps = {
    map: alienAlloy,
    color: "#220044",
    metalness: 1.0,
    roughness: 0.15,
    envMapIntensity: 0.5,
    normalMap: alienAlloy,
    normalScale: new THREE.Vector2(0.3, 0.3),
    emissive: "#00ffff",
    emissiveMap: energyLayer,
    emissiveIntensity: 0.1,
    transparent: false
  };

  return (
    <animated.group ref={floatRef} scale={scale as any} position={position} visible={opacity.to(o => o > 0.01)}>
      {/* Rim */}
      <mesh scale={[1.3, 1.3, 0.10]}>
        <sphereGeometry args={[baseRadius, 64, 32]} />
        <meshPhysicalMaterial {...materialProps} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 0, 0.12]} scale={[0.6, 0.6, 0.3]}>
        <sphereGeometry args={[baseRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial {...materialProps} />
      </mesh>
      {/* Bottom Hull */}
      <mesh position={[0, 0, -0.08]} scale={[0.5, 0.5, 0.2]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[baseRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial {...materialProps} />
      </mesh>
      {/* Belt */}
      <mesh ref={beltRef} position={[0, 0, 0]}> 
        <torusGeometry args={[baseRadius * 1.3, 0.03, 16, 100]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    </animated.group>
  );
}