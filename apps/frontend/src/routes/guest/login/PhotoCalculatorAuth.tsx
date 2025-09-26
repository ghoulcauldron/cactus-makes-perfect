import { useState, useRef, useEffect, useCallback } from "react";

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
  DEBUG = true,
}: { imgSrc?: string; DEBUG?: boolean }) {
  const url = new URL(window.location.href);
  const email = url.searchParams.get("email") || "your email";

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

  /** ===== UX bits ===== */
  const [submitting, setSubmitting] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [faded, setFaded] = useState(false);
  const solarTimer = useRef<number | null>(null);
  const [specialMsg, setSpecialMsg] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  /** ===== Ticker ===== */
  const [tickerPos, setTickerPos] = useState(0);
  const tickerRef = useRef<number | null>(null);
  const tickerMsgRef = useRef<string | null>(null);
  const SCROLL_SPEED = 250;

    const startTicker = (msg: string) => {
        stopTicker();

        // Creates a string that connects back to itself for a seamless loop
        const base = msg + " ".repeat(9) + msg;
        tickerMsgRef.current = base;
        setTickerPos(0);

        tickerRef.current = window.setInterval(() => {
        setTickerPos((pos) => {
            if (!tickerMsgRef.current) return 0;
            
            // This makes the loop reset at the perfect moment to create a seamless effect
            const maxPos = msg.length + LCD_DIGITS;
            
            return (pos + 1) % maxPos;
        });
        }, SCROLL_SPEED);
    };

  const stopTicker = () => {
      // Add these two lines for debugging
    console.log("stopTicker was called unexpectedly!");
    console.trace(); // This is the magic line
    if (tickerRef.current !== null) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    tickerMsgRef.current = null;
    setTickerPos(0);
  };

  useEffect(() => {
    return () => stopTicker();
  }, []);

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

    setSubmitting(true);
    try {
      const token = url.searchParams.get("token") || "";
      const res = await fetch("/api/v1/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, code: pass }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data?.token) localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_ok", "true");
      setSpecialMsg("YES");
      setTimeout(() => window.location.replace("/guest/welcome"), 500);
    } catch {
      setSpecialMsg("NOPE");
      setTimeout(() => {
        setShowInvalid(true);
        setSubmitting(false);
        setSpecialMsg(null);
      }, 500);
    }
  }, [acc, curVal, display, hasOpUsed, op, url, email]);

  /** Core button handler */
  const press = useCallback((key: KeyDef) => {
    if (submitting) return;
    if (tickerMsgRef.current) stopTicker();

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
          startTicker("No shade   No shade   No shade   ");
          return;
        case "m-":
          startTicker("Too  Dry  to  Cry   Too  Dry  to  Cry   Too  Dry  to  Cry   ");
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

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (submitting) return;
      if (tickerMsgRef.current) stopTicker();

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

  return (
    <div className="w-screen h-screen bg-cactus-sand relative overflow-hidden">
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

            <g style={{ opacity: faded ? 0.15 : 1, transition: "opacity 2s" }}>
              <text
                x={LCD.x + LCD.w - 1.5}
                y={LCD.y + LCD.h - 1.8}
                textAnchor="end"
                style={{
                  fontFamily: '"DSEG7Classic", monospace',
                  fontSize: `${LCD.h * 0.9}px`,
                  fill: "#333131",
                }}
              >
                {tickerMsgRef.current
                  ? tickerMsgRef.current.substring(tickerPos, tickerPos + LCD_DIGITS)
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