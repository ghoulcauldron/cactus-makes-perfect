import React, { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { useUFOState } from "../../hooks/useUFOState";
import { UFOBodice } from "../UFO/index";

export function PhaseController({ isUnlocked, children, onUnlock, onNavReady }: any) {
  const { viewport } = useThree();
  const [startFlight, setStartFlight] = useState(false);
  const { scrollProgress } = useUFOState(isUnlocked);

  // Dynamic Responsive Y: 
  // On Desktop (aspect > 1), move to ~35% height.
  // On Mobile (aspect < 1), move higher to ~42% height to clear the thumb zone.
  const isMobile = viewport.width < viewport.height;
  const targetY = isMobile ? viewport.height * 0.62 : viewport.height * 0.35;

  useEffect(() => {
    if (isUnlocked) {
      // Snappy 1.2s hover before automatic repositioning
      const timer = setTimeout(() => setStartFlight(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked]);

  const { ufoY, ufoScale, ufoZ } = useSpring({
    ufoY: startFlight ? targetY : 0,
    ufoScale: startFlight ? 0.5 : 1,
    ufoZ: startFlight ? -2 : 0,
    config: { mass: 2, tension: 50, friction: 25 },
    // Only trigger HUD reveal once the physical move is FINISHED
    onRest: (result) => {
      if (startFlight && result.finished && onNavReady) {
        onNavReady();
      }
    }
  });

  return (
    <group>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onUnlock } as any);
        }
        return null;
      })}

      <animated.group 
        position-y={ufoY} 
        position-z={ufoZ}
        scale={ufoScale.to(s => [s, s, s])}
      >
        <UFOBodice active={isUnlocked} />
      </animated.group>
    </group>
  );
}