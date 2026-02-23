import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

export function useUFOState(isUnlocked: boolean) {
  const [isNavReady, setIsNavReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const progressRef = useRef(0);

  // Trigger the "Flight" to Nav Position after 3 seconds
  useEffect(() => {
    if (isUnlocked) {
      const timer = setTimeout(() => setIsNavReady(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked]);

  useFrame(() => {
    if (!isNavReady) return;
    const currentScroll = window.scrollY;
    const maxScroll = 1000; // Total scroll depth for Phase 2
    const progress = Math.min(Math.max(currentScroll / maxScroll, 0), 1);
    
    if (Math.abs(progress - progressRef.current) > 0.005) {
      progressRef.current = progress;
      setScrollProgress(progress);
    }
  });

  return { isNavReady, scrollProgress };
}