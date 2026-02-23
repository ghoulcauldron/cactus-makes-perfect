import React, { useMemo, useRef, useLayoutEffect } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { animated, useSpring } from "@react-spring/three";

// --- NEW: TRACTOR BEAM COMPONENT ---
function TractorBeam({ active }: { active: boolean }) {
  const { beamScale, beamOpacity } = useSpring({
    beamScale: active ? 1 : 0,
    beamOpacity: active ? 0.35 : 0, // Lowered opacity for a more spectral/diffuse look
    config: { mass: 1, tension: 20, friction: 10 }
  });

  return (
    <animated.mesh 
      // Positioned at center, rotated 90 deg forward (X-axis) to point toward viewer
      position={[0, 0, 0]} 
      rotation={[Math.PI / 4, 0, 0]}
      scale-y={beamScale.to(s => s * 25)} // Increased reach slightly for better diffusion falloff
      scale-x={beamScale}
      scale-z={beamScale}
      visible={active}
    >
      {/* ConeGeometry: top radius 0.01 (the start point), bottom radius 3.5 (wider base for diffusion), height 1. 
          We use onUpdate to translate the geometry so the apex is at the origin [0,0,0].
      */}
      <coneGeometry args={[3.5, 1, 64, 1, true]} onUpdate={(geom) => geom.translate(0, -0.5, 0)} />
      <animated.meshBasicMaterial 
        color="#00ffff" 
        transparent 
        opacity={beamOpacity} 
        blending={THREE.AdditiveBlending} // Makes the light look gaseous/diffuse
        toneMapped={false}
        side={THREE.DoubleSide}
        depthWrite={false} // Prevents the beam from "cutting" through other transparent layers
      />
    </animated.mesh>
  );
}

export function UFOBodice({ 
  active, 
  position = [0, 0, 0],
  scale = 1 // 1. is default scale, can be overridden for different sizes
}: { 
  active: boolean; 
  position?: [number, number, number];
  scale?: number; // 2. Added scale prop for flexible sizing of the UFO, defaulting to 1 (original size) if not provided
}) {
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

  const { springScale, opacity } = useSpring({
    // 3. Rename internal spring to avoid name collision and multiply by passed prop
    springScale: active ? [scale, scale, scale] : [0.1 * scale, 0.1 * scale, 0.1 * scale], 
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
    <animated.group 
      ref={floatRef} 
      scale={springScale as any} // 4. Updated to use the renamed spring and apply the passed scale prop 
      position={position} 
      visible={opacity.to(o => o > 0.01)}
    >
      <TractorBeam active={active} />

      {/* Rim: Rotated 90 deg on X to face the screen */}
      <mesh scale={[1.3, 1.3, 0.10]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[baseRadius, 64, 32]} />
        <meshPhysicalMaterial {...materialProps} />
      </mesh>

      {/* Dome: Positioned on top and rotated to face the screen */}
      <mesh position={[0, 0.12, 0]} scale={[0.6, 0.3, 0.6]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[baseRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial {...materialProps} />
      </mesh>

      {/* Bottom Hull: Visible undershell rotated back toward the screen depth */}
      <mesh position={[0, -0.08, 0]} scale={[0.5, 0.2, 0.5]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[baseRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial {...materialProps} />
      </mesh>

      {/* Torus Belt: Aligned with the Rim to face the screen */}
      <mesh ref={beltRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}> 
        <torusGeometry args={[baseRadius * 1.3, 0.03, 16, 100]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    </animated.group>
  );
}