import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { PatternScramble, type PatternScrambleHandle } from "../../../components/UI/PatternScramble";
import { CYBERPUNK_THEME } from "../../../constants/themes";

type KeyKind = "digit" | "submit" | "clear" | "delete" | "op";
type KeyDef = { id: string; label: string; x: number; y: number; w: number; h: number; kind: KeyKind };

const LCD = {
  x: 890,
  y: 227,
  w: 445,
  h: 83,
};
const LCD_DIGITS = 7;

const KEYS: KeyDef[] = [
  // Row 1
  { id: "7", label: "7", x: 845, y: 777, w: 110, h: 70, kind: "digit" },
  { id: "8", label: "8", x: 970, y: 777, w: 110, h: 70, kind: "digit" },
  { id: "9", label: "9", x: 1100, y: 777, w: 110, h: 70, kind: "digit" },

  // Row 2
  { id: "4", label: "4", x: 845, y: 880, w: 110, h: 70, kind: "digit" },
  { id: "5", label: "5", x: 970, y: 880, w: 110, h: 70, kind: "digit" },
  { id: "6", label: "6", x: 1100, y: 880, w: 110, h: 70, kind: "digit" },

  // Row 3
  { id: "1", label: "1", x: 845, y: 980, w: 110, h: 70, kind: "digit" },
  { id: "2", label: "2", x: 973, y: 980, w: 110, h: 70, kind: "digit" },
  { id: "3", label: "3", x: 1100, y: 980, w: 110, h: 70, kind: "digit" },

  // Bottom row
  { id: "on", label: "ON/C", x: 844, y: 1088, w: 110, h: 70, kind: "clear" },
  { id: "0", label: "0", x: 975, y: 1088, w: 110, h: 70, kind: "digit" },
  { id: "equals-small", label: "=", x: 1100, y: 1088, w: 110, h: 70, kind: "submit" },

  // Big equals bar
  { id: "equals", label: "=", x: 1277, y: 980, w: 108, h: 180, kind: "submit" },

  // Row above MRC
  { id: "sign", label: "+/-", x: 842, y: 565, w: 110, h: 70, kind: "op" },
  { id: "sqrt", label: "√", x: 973, y: 565, w: 110, h: 70, kind: "op" },
  { id: "percent", label: "%", x: 1100, y: 565, w: 110, h: 70, kind: "op" },

  // Same row as MRC
  { id: "mrc", label: "MRC", x: 842, y: 671, w: 110, h: 70, kind: "delete" },
  { id: "m-", label: "M-", x: 973, y: 671, w: 107, h: 70, kind: "op" },
  { id: "m+", label: "M+", x: 1100, y: 671, w: 107, h: 70, kind: "op" },

  // Right-hand ops column
  { id: "mul", label: "×", x: 1277, y: 671, w: 110, h: 70, kind: "op" },
  { id: "div", label: "÷", x: 1277, y: 565, w: 110, h: 70, kind: "op" },
  { id: "add", label: "+", x: 1277, y: 880, w: 110, h: 70, kind: "op" },
  { id: "sub", label: "-", x: 1277, y: 777, w: 110, h: 70, kind: "op" },
];

export default function PhotoCalculatorAuth({
  imgSrc = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/CalculatorHandPaintingCorrected.png",
  DEBUG = false,
}: { imgSrc?: string; DEBUG?: boolean }) {
  // Only token from URL, or fallback to dev value if DEBUG
  const DEV_TOKEN = "devtoken123";
  const url = new URL(window.location.href);
  let token = url.searchParams.get("token");
  if (DEBUG) {
    if (!token) token = DEV_TOKEN;
  }

  const [imgLoaded, setImgLoaded] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    document.fonts.load('16px "DSEG7Classic"').then(() => setFontLoaded(true)).catch(() => setFontLoaded(true));
  }, []);

  /** ===== Calculator state ===== */
  const [display, setDisplay] = useState<string>("");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<null | "+" | "-" | "*" | "/">(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [hasOpUsed, setHasOpUsed] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  // Ref array for the PatternScramble components on each digit (for triggering scrambles on demand)
  /* --- TARGETED PATCH: NATIVE WATERFALL UTILITY --- */
  const CascadingMatrixColumn = ({ text, delay }: { text: string; delay: number }) => {
    const [displayChars, setDisplayChars] = useState<string[]>(new Array(text.length).fill(""));
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const symbols = ["▽", "▱", "⌇", "⚯", "⌗", "⏦", "⌬", "⋔", "⌁"];
    const colors = ["#00ffff", "#39FF14", "#FFFFFF"];

    const runScramble = useCallback(() => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      startTimeRef.current = null;

      const animate = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const progress = (time - startTimeRef.current - delay) / 800; // Duration 800ms

        if (progress < 0) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const newChars = text.split("").map((char, i) => {
          const threshold = i / text.length;
          if (progress > threshold + 0.2) return char; // Fully revealed
          if (progress > threshold) return symbols[Math.floor(Math.random() * symbols.length)]; // Scrambling
          return ""; // Hidden
        });

        setDisplayChars(newChars);
        if (progress < 1.2) animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }, [text, delay]);

    useEffect(() => {
      runScramble();
      return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [runScramble]);

    return (
      <div 
        onMouseEnter={runScramble} 
        className="flex flex-col text-[6px] md:text-[8px] leading-none select-none transition-colors duration-500 hover:text-[#00ffff]"
        style={{ width: '1ch' }}
      >
        {displayChars.map((char, i) => (
          <span key={i} style={{ 
            height: '1em',
            color: symbols.includes(char) ? colors[Math.floor(Math.random() * colors.length)] : 'inherit',
            opacity: char === "" ? 0 : 1,
            textShadow: symbols.includes(char) ? `0 0 8px ${colors[0]}` : 'none'
          }}>
            {char || " "}
          </span>
        ))}
      </div>
    );
  };
  const asciiColumns = useMemo(() => {
    const raw = `


⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⠠⢤⠖⠖⡲⠦⠤⢤⣄⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠰⠈⠁⠀⠀⠀⠀⠀⠀⠀⠂⠁⠀⡉⠙⠳⠦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠊⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠀⠈⠌⢛⢦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠌⡀⢊⠹⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠐⠈⠒⡌⢻⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠃⠀⠀⠀⠀⠀⢀⠀⠀⡀⢀⠀⠀⡀⠀⡀⠀⠀⠀⠀⠀⠀⠀⢀⠠⢁⠈⠤⡘⡀⢪⡹⢷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠁⠀⠀⠄⡀⢀⠀⠀⠈⡀⠄⠂⠌⡐⠠⡁⢄⠂⡄⠠⠁⠂⠄⠁⠀⠀⠠⠈⡐⠠⠑⢂⢄⡨⢛⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠡⠀⠡⠈⠀⠀⠀⠀⠀⠀⢀⠀⠐⠀⠄⡁⠒⢌⠲⣀⠃⠔⠠⠀⠀⢀⠠⠀⠀⢀⠀⢁⠈⠄⣂⠉⡝⢷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡟⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⠀⠐⠠⢁⠊⡰⠀⡘⠀⠂⠐⠀⠂⢀⠠⠈⡀⠀⠀⡈⠆⡠⣒⣆⡖⢮⣟⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠅⡀⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⢂⠐⠡⠂⠡⢀⠀⠢⠈⠄⡀⠐⠠⠀⠀⢦⣼⠿⠋⠁⠀⠀⠙⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢠⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠄⡁⠒⠠⣀⠂⠁⠐⡀⢁⠆⡁⣴⠋⠀⠀⠀⠀⠀⠀⠀⢜⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⡴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠐⠈⠄⢀⠀⡐⠐⠀⡄⠂⡘⠁⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠄⢀⠀⠠⠀⠀⡀⠀⠀⡀⠀⢀⠀⠠⠀⠀⢀⠀⠀⢀⠀⠀⡀⠀⢀⠀⠀⡀⠀⠀⠄⠀⡀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣵⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠀⠂⢈⠀⠰⠄⠀⢠⠁⠀⠀⠀⠀⠀⡀⠀⢠⠀⠘⡇⠠⢈⠀⠄⠂⠄⠠⠁⢀⠠⠁⠀⠄⡆⠀⠄⡀⠁⡀⠠⠈⢀⠀⠂⢀⠐⡀⢀⠂⠄⠠⠁⡀⠂⠀⠄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠘⣾⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠁⡀⢄⣂⠠⠐⠀⠀⠀⠀⠀⠀⠀⠂⠀⣴⠀⢠⣯⠐⢠⠈⡐⠈⠄⡁⠂⠄⠂⠄⡁⢂⠠⠐⠠⠐⠠⠐⡀⠂⠄⡈⠐⡀⢂⠐⡀⠂⠌⡐⢠⢀⠡⠌⠠
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠁⡀⢄⠹⡇⠀⠠⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⢈⠡⠯⠽⠵⣆⠐⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⢀⣼⡷⢈⠆⢢⠑⡌⠒⡠⢉⠄⢣⠈⡔⠈⡄⠡⢂⠡⢂⠡⠄⡡⠒⡈⠤⢁⠆⡘⢠⠉⡔⠨⢄⠢⡘⢄⢃
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠈⠀⠌⠠⢁⠂⠤⠹⡄⠁⢀⠂⠄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠔⠈⠁⢀⠛⠞⣿⢤⢢⠀⠀⠀⠀⠀⠀⠀⠀⣀⢠⣾⠇⣊⠜⣄⠣⢌⠱⣀⠣⡘⢌⠡⢂⠱⡈⢆⠡⢂⠡⢂⠡⠄⡡⠒⡈⠤⢁⠆⡘⢠⠉⡔⠨⢄⠢⡘⢄⢃
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠂⢀⠡⢈⡐⠄⢊⠔⡃⡱⡄⠂⠀⠐⠈⠐⣂⠄⠀⠀⠀⠀⡀⢀⠀⡀⣀⠢⡡⠀⠀⠀⢸⠀⠀⠈⢣⠘⣥⠑⠂⣠⠠⣀⣴⣴⣿⣿⢏⡜⡤⣋⢤⢋⡜⢢⡑⢦⢉⠦⣉⢆⠓⣌⠢⢍⡒⡜⢢⢉⡒⢍⢢⠓⣌⠲⡑⢆⠳⣬⢓⢬⡱⡸⣌⠳
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠀⠂⠄⠒⠃⠖⡈⠆⡜⡰⢡⠹⣄⡀⠀⠀⠀⠀⠈⠐⠁⠁⢄⠁⡂⠐⡡⢄⠲⡁⠀⠀⣐⢺⡄⠀⠀⠀⣞⢘⠷⣐⠤⢘⢉⣱⣶⡿⢣⡞⡼⡱⣎⠶⣩⠜⣥⠺⣄⡋⢖⡡⢎⡜⢤⢋⡔⢢⡙⢆⠣⡜⣌⠦⣙⠆⢧⡙⢎⡳⢌⠫⣖⡱⢳⡼⣹
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠀⠠⠁⠌⢠⠉⡔⢡⠚⣄⠣⣇⢳⡘⡜⢄⠠⠀⠀⠀⠀⠀⠠⠀⠢⠁⢍⡐⠊⡄⠄⣀⠲⣌⢳⠻⡀⢂⢡⠻⠉⣶⣙⠓⢂⣪⡿⣫⣞⢧⡟⣶⢳⣎⠷⣩⠞⣦⠳⡜⣜⢢⡕⢪⡔⢣⠎⡜⣡⠞⣌⠳⡜⣰⢣⡍⣞⡱⢎⡝⣲⠬⣥⢞⡽⣳⣳⡽
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⢈⠀⠡⠈⢄⠒⡈⠆⠣⣌⠳⡬⢧⣛⣜⢦⡒⠄⠐⠀⠀⠌⡐⠁⠌⠰⢀⠔⡁⠢⠐⣄⠳⢬⢳⡏⢷⠈⢰⠎⣿⣾⣿⣷⡿⣫⣾⣿⢾⣯⣟⡷⣯⢞⡽⣣⢟⠶⣹⠜⣜⢲⡘⠧⣜⢣⡹⢬⡱⣚⢬⡓⢭⡒⢧⣚⢴⣙⣎⢾⣡⢟⡼⣫⣞⣷⡷⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣶⣶⣤⣐⣀⣈⣀⣁⣢⣈⠔⢊⣳⡶⣍⡱⢫⡼⡽⣦⡻⣮⠁⢌⠐⡀⠐⢈⠠⢁⠢⡘⠠⡑⠌⢆⡫⣝⠽⣛⡞⢍⠂⠣⡹⣿⣿⢟⡽⣿⣿⣿⣿⣯⣿⣽⣞⣯⡷⣹⢎⡿⣌⢟⣬⢣⡝⡳⣌⢧⢣⢇⡳⣍⠶⡹⣖⡹⢧⣞⢣⣏⡞⣧⣛⣮⢿⣵⣻⣾⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⡀⠀⠀⠀⢀⣾⠟⠛⢻⣿⣿⠟⠉⠉⠀⢶⠃⠻⡟⣇⢨⣾⣿⠗⠀⡙⢷⣮⡬⡳⣦⡀⠀⠁⠂⡀⠂⡐⢌⠡⠌⠸⠌⢧⣹⡓⡛⡷⢈⣵⠒⢻⣿⢏⣾⣿⣿⣿⣿⣿⣷⣿⣾⢿⡾⣝⣳⢯⡞⣮⢏⡶⣳⢼⡱⢎⣮⢓⡮⢵⢎⡟⡵⣭⣛⢷⣚⣯⢞⡽⣯⣟⣾⢿⣽⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡌⠁⠈⠉⠉⠓⠂⠒⠋⢛⡠⢂⢘⠈⡉⠀⠀⠀⠀⠀⠣⢘⡄⠌⠋⡭⠇⡁⠲⢌⡙⣿⣿⣼⣦⡻⣆⠄⠐⠀⡁⠀⠌⠐⡀⠂⢀⣀⠈⣁⣡⡭⠁⣇⠃⣿⣫⣿⣿⣭⣿⣿⣿⣿⣿⣾⣟⣿⣽⣻⢷⣯⡽⣎⢷⣣⢏⡾⣙⣦⢻⡜⡯⣞⡹⣵⢣⡟⣮⡽⣎⡿⣽⣳⢿⣾⣿⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⢀⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⡝⠀⠀⠂⢡⠀⠀⠀⠀⠀⢀⣡⣬⡘⣱⡂⡣⠄⠐⠠⠘⡰⢽⢳⣿⣿⣎⠆⠉⠀⢀⠀⠀⠂⠀⡐⠠⢀⡈⡄⠀⣼⣺⢟⡾⣵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣯⣟⣿⣳⣞⢷⡽⣧⢟⣮⣳⢻⣜⣧⢻⢵⣋⡷⣝⣻⡞⣷⣻⢭⣟⣷⣿⢿⣿⣿⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡰⠛⠉⠀⢀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠈⠄⠀⠀⡌⢀⣧⠀⢄⠠⢢⣼⣿⣿⣿⣦⣉⠭⣒⣂⣤⣬⣴⣴⣿⣿⣿⣿⣷⡄⠀⠀⠂⠀⠀⠐⢀⠡⠒⡬⠉⣼⣿⡿⣫⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣻⣷⢿⡾⣯⢿⣽⣻⡶⣯⣟⣞⣮⢟⣮⣳⡽⣞⣳⢯⡷⣯⢿⣞⣿⣾⣿⣻⣿⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⠀⠀⠀⠀⠀⠀⠄⠐⠀⠀⠂⠀⡰⣒⢼⣿⠨⠤⣴⠿⣟⠋⡿⢿⣿⣿⠷⢮⡙⢾⣟⣾⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠠⢀⠀⠐⠉⣖⣾⣷⣿⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣯⣿⣿⣳⣿⣳⣟⡾⣾⣻⣜⣧⣛⡾⣝⡾⣳⢯⣟⡾⣽⣞⣿⣻⢿⡾⣟⡿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠀⠀⠀⢠⠸⠀⠀⠀⠀⠀⡈⢀⠀⠀⠀⠀⠀⠄⢯⡼⣿⡆⠀⠀⢂⠉⠛⡁⠌⡱⠈⠀⠳⢿⣮⠹⣿⣿⣿⣿⣿⣿⣿⡿⡅⠀⢳⡬⡑⢎⠰⢂⠄⠄⡉⢿⣿⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⣿⣿⣳⣿⣽⡷⣿⢾⣽⣷⣻⣞⡷⣯⢿⡽⡽⣯⢟⡾⣽⣏⢿⡳⣟⡯⢿⣹⣿⡳⣟
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡜⠀⠆⠀⠀⢀⠀⠄⠂⡀⠄⠠⠀⠀⠂⢹⡿⣿⡇⠀⠀⠠⠈⠀⠀⠀⠀⠀⠀⠀⠀⠙⠗⡍⠿⢿⣿⣿⣿⣿⢧⣷⠀⠹⣷⣒⢎⡕⣪⢘⠠⢰⣿⣏⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣟⣾⢷⡯⢿⣹⣏⡿⣽⣹⢾⡹⢶⣻⢮⡝⡾⣹⠳⣝⢶⡹⡽
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⡂⠀⠄⠀⠀⡀⠀⠆⠁⠐⠈⠀⠄⠂⠀⢌⡗⣿⣧⠀⠀⠀⣀⣀⡠⠀⡄⣀⢀⠀⠀⠀⠀⢈⡹⣶⡹⣿⣿⠟⠠⠈⡄⠐⠮⣿⡆⢚⢶⡩⢖⢱⣿⣯⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣿⣻⢷⡟⣿⣚⢧⡟⣧⢳⡞⣵⢣⡟⢮⣙⢧⡛⢮⠽⡲⣍⠻⣜⢮⡱⢫
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠠⡅⠀⠀⠀⠀⢀⠀⣇⠀⠀⡀⢀⡀⠄⠐⠈⢧⢻⣿⡀⠂⢉⠉⠠⠄⠱⡐⢌⠪⡑⠦⡄⢀⣶⣿⣿⡇⠟⡁⠀⠠⡑⠨⡀⢭⢿⣿⡜⣣⠝⡢⢳⣿⣿⣷⣝⡿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣻⡽⣞⡷⣏⡿⣼⢣⡟⢮⠵⣪⠗⣼⣊⢗⡺⢥⣋⠶⡹⣍⣞⡱⢎⠧⡍⣎⡱⢋
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠘⣏⠀⠀⠀⠀⠀⡁⢽⠀⠁⢌⠐⠡⢸⠀⢀⠺⣿⢿⣧⠀⠂⢈⠐⡈⠔⣈⠢⢡⠙⠦⠁⢸⣾⣿⡿⢁⠂⢠⢁⢲⠁⠐⠠⠈⣼⣿⡷⢬⠛⢼⣻⣿⣿⢿⣿⣿⢿⣲⠯⣽⣛⣻⠿⣿⣿⣿⣿⣿⣿⡿⣷⣻⡞⣷⣫⡽⢾⣭⢳⡭⣷⠹⣎⡳⢥⡛⢦⡙⢮⡱⢣⢎⠳⡱⢎⠴⡑⢮⡑⢏⠴⢡⢋
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠆⢹⣂⠀⠀⠂⠀⠀⢸⡆⠀⠠⢈⠅⡣⠄⠀⠣⠿⣾⣿⠀⡐⠀⠂⠐⠐⠄⠢⠑⣈⠔⠀⠠⣼⣿⡇⠐⠈⠄⡌⢂⠐⠠⠁⠌⢷⣿⣳⡇⠚⣝⣿⣿⣿⠙⢿⢿⣾⣼⡹⣓⣾⣽⢟⢶⣝⠿⣟⣿⢯⡿⣽⡳⣗⡻⢷⡭⣛⠧⣏⡳⡝⢦⡛⡴⡙⢦⣙⠦⣙⠦⣑⠣⢎⠳⡑⢎⠒⡍⡒⠌⡌⢂⠣⠌
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠌⣿⡀⠀⠀⠀⠀⠀⣧⠀⠀⠂⡌⢱⡁⠀⠀⢹⣿⣿⠡⠴⠞⠻⢿⣿⣿⣟⠫⠉⠁⠀⢞⣿⣾⡇⠠⢁⠆⡘⠤⠈⠐⠀⢂⢹⡽⣟⣺⡜⢎⣿⣿⡿⢃⠎⠙⠹⠿⢙⢛⠿⠻⢿⣱⢍⣓⢮⣍⠿⣺⠽⣝⡮⡝⢧⡳⣍⠳⣌⠣⡝⢢⠝⡰⢍⡒⢌⡒⢡⠒⡡⢃⠌⢣⠘⡄⠣⠐⠡⢊⠐⠡⠘⠠
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⠘⣧⠀⠀⠀⠀⠡⣽⡄⠀⠠⠐⢁⡞⠀⠈⠄⢻⣿⣆⣤⣬⣔⡓⢫⣝⣿⣿⣿⣄⠀⠠⢩⠟⠁⡐⣁⠊⡒⠡⠀⢅⡈⢄⣦⢽⡞⡴⣭⣷⣿⢿⡟⡋⠤⢈⠔⢠⣐⣪⣾⡿⢇⢹⠌⣤⢣⡹⣷⣜⠯⣙⠧⣙⢣⠱⣊⠵⣈⠓⠬⡑⢊⠅⢢⠘⠄⡘⠄⢃⠰⢁⠊⠄⠡⢀⠡⠉⡐⠠⠈⠄⡁⠂
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⡄⠀⠀⠈⣧⡟⠀⠀⠡⢊⡜⠀⠀⠂⢍⡟⣳⣿⣿⣮⡽⡞⣿⣿⣿⣾⣿⡿⡱⣂⡴⢭⢶⢦⣳⣔⠦⣌⣤⣄⣫⣼⣿⣿⡙⣶⢿⣛⣯⣔⣤⣛⣷⣎⡷⡳⣝⢿⡻⢏⣦⣌⢹⡿⢱⣙⣿⣦⠃⡞⡰⢃⡱⢌⠒⠤⡉⠆⠡⠌⡈⡐⢈⠐⠠⠈⠄⠂⠄⡈⠄⠁⠂⢀⠡⠄⠠⠁⠠⠐⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠟⠀⠀⠀⠌⠀⠀⢈⠰⢡⢚⣦⣀⣐⣨⣾⣿⣾⣿⣿⣷⣿⡑⠌⠻⢻⣿⣿⠷⣭⣙⣻⡾⣟⣷⢿⣿⢾⣿⣻⣿⣿⣿⡻⣝⠮⣛⠞⡳⢪⠷⣹⣖⡽⢳⠣⢟⠋⡜⢏⡌⣑⣼⣸⣳⣷⢺⣿⣷⠨⣁⠣⡐⢊⠜⢠⠡⠘⡀⠒⠠⠐⠀⠌⢀⠁⠂⠈⠀⠀⠀⠂⠈⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⢂⠜⢢⣛⢎⣿⣿⣷⣿⣿⣿⣿⣿⣿⡟⣇⠐⡀⠉⠛⡛⡵⣪⢷⣬⣿⣏⢛⣫⢏⡟⣭⠿⣿⣍⠷⠬⠓⠡⠋⠱⠡⢺⠕⣚⠈⡕⠊⢆⠘⠨⡖⣧⢿⢂⣱⣿⣿⣿⣿⣿⣇⠄⢡⠘⠠⠈⠄⢂⠡⢀⠁⢂⠁⠈⢀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⢌⠢⡜⠢⡜⠸⡓⣽⣿⣿⣿⣿⣿⣿⣿⣇⣯⠂⠄⠀⠁⢂⢁⠃⣎⢷⣻⣽⢫⣷⢻⡜⢮⣳⣶⣾⠵⣣⡍⠠⣁⠒⣔⣋⡞⣌⠳⢤⡙⠼⡸⣐⡗⣩⡼⣂⣿⣿⣿⡿⣟⢿⣿⡀⠂⣌⠠⠁⠌⢀⠐⡀⠈⠀⠠⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⠀⠀⠠⠐⠠⢌⠒⡌⠳⠀⠡⣭⣿⢧⡟⣿⣿⣿⣿⣿⡷⠉⡈⠐⠈⠀⠐⢀⢊⠌⢻⠏⣿⡽⣞⡞⢾⠹⣤⣼⣋⣷⡱⢌⡡⢐⡈⠖⡪⡻⢜⡱⢣⡘⠥⣓⠖⣺⣽⡷⢭⣿⣿⣽⠍⢘⠿⢿⡇⠐⠀⢀⠐⠈⠀⢀⠀⠐⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠀⠀⠀⠀⠁⠀⠀⠈⠄⡩⣐⣹⣹⢇⣞⣧⣹⣿⡷⢿⡏⠀⠀⠁⠀⠀⠂⡈⠄⡊⢅⠛⡵⣹⢎⡻⣟⡴⢯⡓⡝⢧⠊⠤⠃⠄⡐⠬⡑⢧⡓⣌⠣⡜⣜⣡⡟⢾⣻⣧⣿⣿⣿⡇⠀⠀⢬⣿⡇⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠌⣲⠭⣋⡴⣍⣴⢾⠻⠋⠔⠋⠀⠀⠀⠀⠀⠀⠠⠐⠠⠁⢎⠘⡒⣡⢞⣓⠾⣍⠓⢎⣢⣝⠂⠀⡁⠤⡐⢢⡙⢦⡙⣦⢛⣔⣣⢯⣴⣿⣿⣿⣿⣿⡿⡀⠆⢀⡼⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⢈⠴⠜⠊⠁⠀⠉⠁⠀⠀⠢⡄⠀⠀⠀⠀⠀⠀⠀⠀⠄⠡⠘⢀⠣⠑⡄⢊⡙⢶⡯⣴⢳⣿⣿⣶⠀⠱⡐⢉⠆⡌⠣⠜⢢⡙⢤⢛⣾⡿⣿⣿⣿⣿⣿⠁⠀⠀⢨⢲⢿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠡⠀⠀⠀⠀⠀⠀⠀⠀⠁⠈⢄⠂⠡⢈⠂⡉⠎⡵⠳⡽⣿⠻⣍⠉⠐⠀⠂⠌⠠⢁⠊⠄⡘⢄⠊⡜⡻⠿⣿⣿⣿⡇⠀⠀⠀⠀⠨⢞⢿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`;
  const lines = raw.split('\n');
  const maxLen = Math.max(...lines.map(l => l.length));
  
  // Create an array of columns for the vertical waterfall
  const cols: string[] = [];
    for (let x = 0; x < maxLen; x++) {
      let columnStr = "";
      for (let y = 0; y < lines.length; y++) {
        columnStr += lines[y][x] || " ";
      }
      cols.push(columnStr);
    }
    return cols;
  }, []);

  // Individual column refs for localized re-triggering
  const colRefs = useRef<(PatternScrambleHandle | null)[]>([]);

  const triggerVerticalWaterfall = useCallback(() => {
    asciiColumns.forEach((_, i) => {
      // Randomize the delay slightly for a "dripping" waterfall effect
      setTimeout(() => {
        colRefs.current[i]?.triggerHover();
      }, i * 20 + Math.random() * 100); 
    });
  }, [asciiColumns]);

  /** ===== UX bits ===== */
  const [submitting, setSubmitting] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [faded, setFaded] = useState(false);
  const [flash, setFlash] = useState(false);
  const solarTimer = useRef<number | null>(null);
  const [specialMsg, setSpecialMsg] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  /** ===== Ticker (endless marquee) ===== */
  const [tickerPos, setTickerPos] = useState(0);
  const tickerTimerRef = useRef<number | null>(null);
  const tickerBaseRef = useRef<string | null>(null);   // base string: [spaces]+msg+[spaces]
  const tickerLoopRef = useRef<string | null>(null);   // doubled base for easy wrap
  const tickerLenRef = useRef<number>(0);              // base length (not doubled)
  const SCROLL_SPEED = 250; // ms per step

  const startTicker = (msg: string) => {
    // Stop any existing ticker first
    stopTicker();

    // Build a base string that starts and ends with blanks so the message
    // "enters from the right", scrolls across, then exits to the left.
    const blanks = " ".repeat(LCD_DIGITS);
    const base = blanks + msg + blanks; // e.g., "_______HELLO_______"
    const loop = base + base;            // doubled for seamless wraparound

    tickerBaseRef.current = base;
    tickerLoopRef.current = loop;
    tickerLenRef.current = base.length;

    // Start at the far-right blank frame
    setTickerPos(0);

    // Advance one step every SCROLL_SPEED ms
    tickerTimerRef.current = window.setInterval(() => {
      setTickerPos((pos) => {
        const len = tickerLenRef.current || 1;
        return (pos + 1) % len;
      });
    }, SCROLL_SPEED);
  };

  const stopTicker = () => {
    if (tickerTimerRef.current !== null) {
      clearInterval(tickerTimerRef.current);
      tickerTimerRef.current = null;
    }
    tickerBaseRef.current = null;
    tickerLoopRef.current = null;
    tickerLenRef.current = 0;
    setTickerPos(0);
  };

  useEffect(() => {
    return () => stopTicker();
  }, []);

  // Removed blinkTimerRef, blink, and triggerBlink

  /** Helpers */
  const curVal = () => parseFloat(display || "0");
  const setVal = (n: number) => setDisplay(Number.isFinite(n) ? trimNum(n) : "Err");
  const trimNum = (n: number) => {
    const s = n.toString();
    return s.length <= LCD_DIGITS ? s : n.toExponential(2);
  };

  const doCompute = (a: number, b: number, operator: NonNullable<typeof op>) => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? NaN : a / b;
    }
  };

  /** "=" pressed */
  const onEquals = useCallback(async () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 80);
    if (hasOpUsed && acc !== null && op !== null && display !== "Err") {
      const result = doCompute(acc, curVal(), op);
      setVal(result);
      setAcc(result);
      setOp(null);
      setWaitingForNext(true);
      setHasOpUsed(false);
      return;
    }

    const pass = (display || "").replace(/[^\d]/g, "");
    if (pass.length < 4) return;

    // Clear any previous ticker state before starting
    stopTicker();
    setSpecialMsg(null);
    setShowInvalid(false);

    setSubmitting(true);
    startTicker("ooooh...");
    try {
      const res = await fetch("/api/v1/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token || "", code: pass }),
      });

      // --- STRATEGIC INTERCEPTION ---
      if (!res.ok) {
        stopTicker();
        
        // If the link is structurally dead (Expired or Already Used), redirect.
        if (res.status === 410) {
          window.location.replace("/denied?reason=expired");
          return;
        }
        if (res.status === 403) {
          window.location.replace("/denied?reason=used");
          return;
        }

        // If it's a 401 (Wrong Code), throw to the catch block for the "NOPE" behavior.
        throw new Error("Invalid entry");
      }

      const data = await res.json();
      if (data?.token) localStorage.setItem("auth_token", data.token);
      if (data?.guest_id) localStorage.setItem("guest_user_id", data.guest_id);
      localStorage.setItem("auth_ok", "true");
      setSpecialMsg("YES");
      // Clear any scrolling/hmmm before redirect
      stopTicker();
      setTimeout(() => {
        stopTicker();
        window.location.replace("/guest/welcome");
      }, 500);
    } catch {
      stopTicker();
      setSpecialMsg("NOPE");
      setTimeout(() => {
        stopTicker();
        setShowInvalid(true);
        setSubmitting(false);
        setSpecialMsg(null);
      }, 500);
    }
  }, [acc, curVal, display, hasOpUsed, op, token]);

  /** Core button handler */
  const press = useCallback((key: KeyDef) => {
    if (submitting) return;
    if (tickerBaseRef.current) stopTicker();

    if (key.kind === "digit") {
      const d = key.label;
      if (cleared || waitingForNext || display === "Err" || display === "" || display === "58008") {
        setDisplay(d);
        setCleared(false);
        setWaitingForNext(false);
      } else {
        setDisplay((s) => (s && s.length < LCD_DIGITS ? s + key.label : s));
      }
      return;
    }

    if (key.kind === "clear" || key.id === "on") {
      setFlash(true);
      setTimeout(() => setFlash(false), 80);
      setDisplay("0");
      setCleared(true);
      setAcc(null);
      setOp(null);
      setWaitingForNext(false);
      setHasOpUsed(false);
      setSpecialMsg(null);
      stopTicker();
      return;
    }

    if (key.kind === "delete" || key.id === "mrc") {
      if (!display || display === "0" || display === "Err") {
        setDisplay("0");
        setCleared(true);
      } else {
        const next = display.slice(0, -1);
        if (!next.length) {
          setDisplay("0");
          setCleared(true);
        } else {
          setDisplay(next);
        }
      }
      return;
    }

    if (key.kind === "op") {
      switch (key.id) {
        case "sign":
          if (display !== "Err" && display !== "0" && display) {
            setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
          }
          return;
        case "sqrt":
          const v = curVal();
          if (v < 0) setDisplay("Err");
          else setVal(Math.sqrt(v));
          setHasOpUsed(true);
          setWaitingForNext(true);
          return;
        case "percent":
          setVal(curVal() / 100);
          setHasOpUsed(true);
          setWaitingForNext(true);
          return;
        case "m+":
          startTicker("No  5hade");
          return;
        case "m-":
          startTicker("Too  Dry  to  Cry");
          return;
        case "add": case "sub": case "mul": case "div":
          const opMap: Record<string, "+" | "-" | "*" | "/"> = {
            add: "+", sub: "-", mul: "*", div: "/",
          };
          const nextOp = opMap[key.id];
          const val = curVal();
          if (op !== null && acc !== null && !waitingForNext && display !== "Err") {
            const result = doCompute(acc, val, op);
            setAcc(result);
            setVal(result);
          } else {
            setAcc(val);
          }
          setOp(nextOp);
          setWaitingForNext(true);
          setHasOpUsed(true);
          return;
      }
    }

    if (key.kind === "submit") {
      onEquals();
      return;
    }
  }, [acc, cleared, display, hasOpUsed, op, submitting, waitingForNext, onEquals]);


  // Ref for the hidden paste input
  const pasteInputRef = useRef<HTMLInputElement>(null);

  // Focus the hidden input on mount
  useEffect(() => {
    if (pasteInputRef.current) {
      pasteInputRef.current.focus();
    }
  }, []);

  // When submitting, blur the input; when not, focus it
  useEffect(() => {
    if (pasteInputRef.current) {
      if (submitting) pasteInputRef.current.blur();
      else pasteInputRef.current.focus();
    }
  }, [submitting]);

  // Paste handler for the hidden input
  const onHiddenPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData("text") ?? "";
    const digits = pasted.replace(/\D/g, "");
    if (digits.length >= 4) {
      setDisplay(digits.slice(0, LCD_DIGITS));
      setCleared(false);
      setWaitingForNext(false);
      setSpecialMsg(null);
      stopTicker();
    }
    // Always clear the input after paste
    if (pasteInputRef.current) {
      pasteInputRef.current.value = "";
    }
    e.preventDefault();
  };

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (submitting) return;
      if (tickerBaseRef.current) stopTicker();

      let keyToPress: KeyDef | undefined;
      if (/^[0-9]$/.test(e.key)) {
        keyToPress = KEYS.find((k) => k.kind === "digit" && k.label === e.key);
      } else {
        switch (e.key) {
          case "+": keyToPress = KEYS.find(k => k.id === "add"); break;
          case "-": keyToPress = KEYS.find(k => k.id === "sub"); break;
          case "*": case "x": case "X": keyToPress = KEYS.find(k => k.id === "mul"); break;
          case "/": keyToPress = KEYS.find(k => k.id === "div"); break;
          case "%": keyToPress = KEYS.find(k => k.id === "percent"); break;
          case "Enter": case "=": keyToPress = KEYS.find(k => k.kind === "submit"); break;
          case "Backspace": keyToPress = KEYS.find(k => k.kind === "delete"); break;
          case "c": case "C": case "Escape": keyToPress = KEYS.find(k => k.kind === "clear"); break;
        }
      }

      if (keyToPress) {
        e.preventDefault();
        setPressed(keyToPress.id);
        press(keyToPress);
        setTimeout(() => setPressed(null), 150);
      }
    };

    window.addEventListener("keydown", keydownHandler);
    return () => window.removeEventListener("keydown", keydownHandler);
  }, [press, submitting]);


  // Early conditional render: if not in DEBUG and missing token, show message
  /* --- TARGETED PATCH: RESTRICTED SECTOR UI --- */
  if (!token && !DEBUG) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center font-mono text-white p-4 text-center overflow-hidden touch-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#39FF14]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#00ffff]/5 rounded-full blur-[140px] animate-pulse delay-1000" />

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl p-12 rounded-[40px] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)]">
          
          <div className="flex items-center gap-3 mb-8 shrink-0">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#00ffff]" />
            <span className="text-[10px] tracking-[0.8em] text-[#00ffff] font-black uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              Restricted_Sector
            </span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#00ffff]" />
          </div>

          {/* WATERFALL RENDER: Localized columns with sine-wave delay */}
          <div className="flex flex-row mb-12 justify-center items-start min-h-[300px]">
            {asciiColumns.map((colText, i) => (
              <CascadingMatrixColumn 
                key={i} 
                text={colText} 
                // Sine wave randomness for the "dripping" effect
                delay={i * 15 + Math.sin(i * 0.5) * 150} 
              />
            ))}
          </div>

          <div className="space-y-6 max-w-sm relative shrink-0">
            <div className="absolute -top-4 -left-4 w-8 h-8 border-t border-l border-[#39FF14]/40 rounded-tl-2xl" />
            <h2 className="text-sm font-light tracking-[0.5em] uppercase text-white">
              Beacon <span className="text-[#39FF14] font-bold">Offline</span>
            </h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="text-[10px] uppercase leading-relaxed tracking-[0.3em] text-white/40 italic">
              Terminal requires a valid landing frequency.<br/>
              Mingle or I'll mangle.
            </p>
          </div>

          <div className="mt-12 py-2 px-6 bg-red-500/5 border border-red-500/20 rounded-full flex items-center gap-3 shrink-0">
            <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
            <span className="text-[8px] text-red-500 tracking-[0.4em] font-bold uppercase">Error: Signal_Interrupted</span>
          </div>
        </div>
      </div>
    );
  }
{/* --- END TARGETED PATCH --- */}

  return (
    <div className="w-screen h-screen bg-cactus-green relative overflow-hidden">
      {/* Hidden input for paste handling */}
      <input
        ref={pasteInputRef}
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
          left: 0,
          top: 0,
          zIndex: -1,
        }}
        onPaste={onHiddenPaste}
        autoFocus
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 2236 1440"
        preserveAspectRatio="xMidYMid slice"
      >
        <image
          href={imgSrc}
          x="0" y="0" width="2236" height="1440"
          preserveAspectRatio="xMidYMid slice"
          crossOrigin="anonymous"
          onLoad={() => setImgLoaded(true)}
        />

        {(!imgLoaded || !fontLoaded) && (
          <foreignObject x="0" y="0" width="2236" height="1440">
            <div className="w-full h-full flex items-center justify-center bg-cactus-sand text-2xl font-semibold">
              Loading…
            </div>
          </foreignObject>
        )}

        {imgLoaded && fontLoaded && (
          <>
            {DEBUG && (
              <rect
                x={LCD.x} y={LCD.y} width={LCD.w} height={LCD.h}
                fill="rgba(0,255,0,0.25)" stroke="rgba(0,200,0,0.9)"
                strokeWidth="1" rx="8" ry="8"
              />
            )}

            {/* Fade layer */}
            <g
              style={{
                opacity: faded ? 0.05 : 1,
                transition: "opacity 1s ease-in-out",
              }}
            >
              <text
                x={LCD.x + LCD.w - 1.5}
                y={LCD.y + LCD.h - 1.8}
                textAnchor="end"
                style={{
                  fontFamily: '"DSEG7Classic", monospace',
                  fontSize: `${LCD.h * 0.9}px`,
                  fill: "#333131",
                  opacity: flash ? 0 : 1,
                  transition: "opacity 0s",
                }}
              >
                {tickerBaseRef.current && tickerLoopRef.current
                  ? tickerLoopRef.current.substring(tickerPos, tickerPos + LCD_DIGITS)
                  : (specialMsg || (display === "" ? "58008" : display))}
              </text>
            </g>

            {KEYS.map((k) => (
              <g key={k.id}>
                {DEBUG && (
                  <rect
                    x={k.x} y={k.y} width={k.w} height={k.h}
                    fill="rgba(0,255,0,0.15)" stroke="rgba(0,128,0,0.4)"
                    strokeWidth="0.25" rx="6" ry="6"
                  />
                )}

                <rect
                  x={k.x} y={k.y} width={k.w} height={k.h}
                  rx="1.2" fill="transparent"
                  style={{ cursor: "pointer", userSelect: "none", WebkitUserSelect: "none" }}
                  onPointerDown={() => setPressed(k.id)}
                  onPointerUp={() => { setPressed(null); press(k); }}
                  onPointerLeave={() => setPressed(null)}
                  aria-label={k.label}
                />

                {pressed === k.id && (
                  <rect x={k.x} y={k.y} width={k.w} height={k.h}
                        rx="1.2" fill="rgba(0,0,0,0.18)" />
                )}
              </g>
            ))}

            {DEBUG && (
              <rect
                x={840} y={420} width={265} height={80}
                fill="rgba(0,255,0,0.15)" stroke="rgba(0,128,0,0.4)"
                strokeWidth="0.25" rx="6" ry="6"
              />
            )}
            <rect
              x={840} y={420} width={265} height={80}
              fill="transparent"
              style={{ cursor: "pointer", userSelect: "none", WebkitUserSelect: "none" }}
              onPointerDown={() => {
                solarTimer.current = window.setTimeout(() => {
                  setFaded(true);
                  setSpecialMsg("LOL");
                }, 600);
              }}
              onPointerUp={() => {
                if (solarTimer.current) clearTimeout(solarTimer.current);
                setFaded(false);
                setSpecialMsg(null);
              }}
              onPointerLeave={() => {
                if (solarTimer.current) clearTimeout(solarTimer.current);
                setFaded(false);
                setSpecialMsg(null);
              }}
              aria-label="solar-panel"
            />
          </>
        )}
      </svg>
    </div>
  );
}