import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Highway({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create a long path for the road
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -2, 5),
      new THREE.Vector3(0, -2, -20),
      new THREE.Vector3(2, -2, -40),
      new THREE.Vector3(-2, -2, -70),
      new THREE.Vector3(0, -2, -100),
    ]);
  }, []);

  const shaderData = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color("#00ffff") },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        // Create a moving pulse along the UV.y (length of the road)
        float pulse = step(0.9, fract(vUv.y * 10.0 - uTime * 2.0));
        float fade = smoothstep(0.0, 0.1, uProgress); // Fade in as we scroll
        vec3 finalColor = mix(vec3(0.05, 0.0, 0.1), uColor, pulse);
        gl_FragColor = vec4(finalColor, fade * 0.8);
      }
    `
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
      mat.uniforms.uProgress.value = progress;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <planeGeometry args={[4, 200, 1, 100]} />
      <shaderMaterial 
        {...shaderData} 
        transparent 
        side={THREE.DoubleSide} 
        depthWrite={false}
      />
    </mesh>
  );
}