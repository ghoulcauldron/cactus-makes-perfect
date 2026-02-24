import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react"; // Fixed missing imports

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

// Export the handle type so MothershipHUD can use it for TypeScript safety
export interface PatternScrambleHandle {
  triggerHover: () => void;
}

interface PatternScrambleProps {
  text: string;
  speed?: number;
  waveWidth?: number;
  flickerSpeed?: number;
  startTrigger?: boolean;
  onThresholdReached?: () => void;
  threshold?: number;
  colors?: string[];
  symbols?: string[];
  patterns?: any[];
}

// Wrap the component in forwardRef to resolve the 'ref' property error
export const PatternScramble = forwardRef<PatternScrambleHandle, PatternScrambleProps>((props, ref) => {
  const {
    text,
    speed = 0.25,
    waveWidth = 15,
    flickerSpeed = 120,
    startTrigger = true,
    onThresholdReached,
    threshold = 0.35,
    colors = ["#FF1493", "#39FF14", "#000000", "#CCCCCC", "#FFFFFF"],
    symbols = ["●", "■", "◈", "◉", "✕", "▤", "▥", "▦"],
    patterns = [
      { backgroundImage: "repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)", backgroundSize: "8px 8px" },
    ]
  } = props;

  const containerRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);
  const iterationRef = useRef(0);
  const hasAnimatedRef = useRef(false);
  const hasFiredThresholdRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const [elements, setElements] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // This hook exposes the function to the parent (MothershipHUD)
  useImperativeHandle(ref, () => ({
    triggerHover: () => {
      if (!isAnimatingRef.current) startAnimation('hover', Math.floor(text.length / 2));
    }
  }));

  useEffect(() => {
    setElements(text.split("").map((char) => ({ type: "hidden", value: char })));
    hasAnimatedRef.current = false;
    hasFiredThresholdRef.current = false;
  }, [text]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && startTrigger && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      startAnimation('initial', 0);
    }
  }, [isVisible, startTrigger]);

  const startAnimation = (mode = 'initial', originIndex = 0) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    iterationRef.current = 0;
    let lastFlickerTime = Date.now();

    const generateRandomStyle = () => {
      const rand = Math.random();
      if (rand < 0.45) return { type: "color", value: getRandom(colors) };
      if (rand < 0.85) return { type: "pattern", value: getRandom(patterns) };
      return { type: "symbol", value: getRandom(symbols) };
    };

    const generateChunkedScrambles = (targetLength: number) => {
      let chunkedArray = [];
      while (chunkedArray.length < targetLength) {
        const chunkSize = Math.floor(Math.random() * 7) + 2;
        const style = generateRandomStyle();
        for (let i = 0; i < chunkSize; i++) {
          if (chunkedArray.length < targetLength) chunkedArray.push(style);
        }
      }
      return chunkedArray;
    };

    let currentScrambles = generateChunkedScrambles(text.length);
    const maxDistance = mode === 'initial' ? text.length : Math.max(originIndex, text.length - 1 - originIndex);

    const animate = () => {
      const now = Date.now();
      if (now - lastFlickerTime > flickerSpeed) {
        currentScrambles = generateChunkedScrambles(text.length);
        lastFlickerTime = now;
      }

      iterationRef.current += speed;
      const currentStep = iterationRef.current;

      if (mode === 'initial' && !hasFiredThresholdRef.current && currentStep >= text.length * threshold) {
        hasFiredThresholdRef.current = true;
        if (onThresholdReached) onThresholdReached();
      }

      const newElements = text.split("").map((char, index) => {
        if (char === " ") return { type: "char", value: " " };
        const distance = mode === 'initial' ? index : Math.abs(index - originIndex);
        if (mode === 'initial') {
          if (distance < Math.floor(currentStep)) return { type: "char", value: char };
          if (distance >= Math.floor(currentStep) && distance < currentStep + waveWidth) return currentScrambles[index];
          return { type: "hidden", value: char };
        }
        if (mode === 'hover') {
          if (distance <= Math.floor(currentStep) && distance > Math.floor(currentStep) - waveWidth) return currentScrambles[index];
          return { type: "char", value: char };
        }
      });

      setElements(newElements);
      if (currentStep < maxDistance + waveWidth) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  const baseStyle: React.CSSProperties = { display: "inline-block", textAlign: "center", width: "1ch", height: "1em" };

  return (
    <span ref={containerRef} style={{ display: "inline-flex", whiteSpace: "pre-wrap"}}>
      {elements.map((el, i) => {
        if (el.type === "char" || el.type === "symbol") return <span key={i} style={baseStyle}>{el.value}</span>;
        if (el.type === "color") return <span key={i} style={{ ...baseStyle, backgroundColor: el.value }} />;
        if (el.type === "pattern") return <span key={i} style={{ ...baseStyle, ...el.value }} />;
        if (el.type === "hidden") return <span key={i} style={{ ...baseStyle, opacity: 0 }}>{el.value}</span>;
        return null;
      })}
    </span>
  );
});

// Set display name for easier debugging in React DevTools
PatternScramble.displayName = "PatternScramble";