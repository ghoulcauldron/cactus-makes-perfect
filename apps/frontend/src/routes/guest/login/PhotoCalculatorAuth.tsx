import { useState, useRef } from "react";
// import InvalidCodeModal from "./InvalidCodeModal";

type KeyKind = "digit" | "submit" | "clear" | "delete" | "op";
type KeyDef = { id: string; label: string; x: number; y: number; w: number; h: number; kind: KeyKind };

const LCD = {
  x: 890,
  y: 227,
  w: 445,
  h: 83,
};

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

  // Bottom row: ON/C + 0 + small "="
  { id: "on", label: "ON/C", x: 844, y: 1088, w: 110, h: 70, kind: "clear" },
  { id: "0",  label: "0",    x: 975, y: 1088, w: 110, h: 70, kind: "digit" },
  { id: "equals-small", label: "=", x: 1100, y: 1088, w: 110, h: 70, kind: "submit" },

  // Big equals bar
  { id: "equals", label: "=", x: 1277, y: 980, w: 108, h: 180, kind: "submit" },

  // Row above MRC
  { id: "sign",    label: "+/-", x: 842, y: 565, w: 110, h: 70, kind: "op" },
  { id: "sqrt",    label: "√",   x: 973, y: 565, w: 110, h: 70, kind: "op" },
  { id: "percent", label: "%",   x: 1100, y: 565, w: 110, h: 70, kind: "op" },

  // Same row as MRC
  { id: "mrc", label: "MRC", x: 842, y: 671, w: 110, h: 70, kind: "delete" }, // still backspace per your decision
  { id: "m-",  label: "M-",  x: 973, y: 671, w: 107, h: 70, kind: "op" },
  { id: "m+",  label: "M+",  x: 1100, y: 671, w: 107, h: 70, kind: "op" },

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

  /** ===== Calculator state ===== */
  const [display, setDisplay] = useState<string>("");   // empty gives you the 58008 gag
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<null | "+" | "-" | "*" | "/">(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [hasOpUsed, setHasOpUsed] = useState(false);    // <- distinguishes auth vs calc on "="
  const [memory, setMemory] = useState<number>(0);

  /** ===== Existing UX bits ===== */
  const [submitting, setSubmitting] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [faded, setFaded] = useState(false);
  const solarTimer = useRef<number | null>(null);
  const [specialMsg, setSpecialMsg] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false); // ON/C → show "0" and arm first-digit overwrite

  /** Helpers */
  const curVal = () => parseFloat(display || "0");
  const setVal = (n: number) => setDisplay(Number.isFinite(n) ? trimNum(n) : "Err");
  const trimNum = (n: number) => {
    const s = n.toString();
    // Keep it simple: limit length so it fits LCD
    return s.length > 12 ? n.toExponential(6) : s;
  };

  const doCompute = (a: number, b: number, operator: NonNullable<typeof op>) => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? NaN : a / b;
    }
  };

  /** Core button handler */
  const press = (key: KeyDef) => {
    if (submitting) return;

    if (key.kind === "digit") {
      const d = key.label;
      if (cleared || waitingForNext || display === "Err") {
        setDisplay(d);
        setCleared(false);
        setWaitingForNext(false);
      } else {
        // ✅ limit to 7 characters
    setDisplay((s) =>
      s && s.length < 7 ? s + key.label : s
    );
      }
      return;
    }

    if (key.kind === "clear" || key.id === "on") {
      // ON/C behavior you asked for:
      // show "0" but DO NOT append leading zero to next digit
      setDisplay("0");
      setCleared(true);
      setAcc(null);
      setOp(null);
      setWaitingForNext(false);
      setHasOpUsed(false);
      setSpecialMsg(null);
      return;
    }

    if (key.kind === "delete" || key.id === "mrc") {
      // Backspace (per earlier choice)
      if (!display || display === "0" || display === "Err") {
        setDisplay("0");
      } else {
        const next = display.slice(0, -1);
        setDisplay(next.length ? next : "0");
      }
      return;
    }

    if (key.kind === "op") {
      switch (key.id) {
        case "sign": {
          if (display === "Err") return;
          if (!display || display === "0") return;
          setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
          return;
        }
        case "sqrt": {
          const v = curVal();
          if (v < 0) {
            setDisplay("Err");
          } else {
            setVal(Math.sqrt(v));
          }
          setHasOpUsed(true);
          setWaitingForNext(true);
          return;
        }
        case "percent": {
          // Simple %: value / 100
          setVal(curVal() / 100);
          setHasOpUsed(true);
          setWaitingForNext(true);
          return;
        }
        case "m+": {
          setMemory((m) => m + curVal());
          return;
        }
        case "m-": {
          setMemory((m) => m - curVal());
          return;
        }
        // arithmetic ops
        case "add":
        case "sub":
        case "mul":
        case "div": {
          const opMap: Record<string, "+" | "-" | "*" | "/"> = {
            add: "+",
            sub: "-",
            mul: "*",
            div: "/",
          };
          const nextOp = opMap[key.id];
          const v = curVal();

          if (op !== null && acc !== null && !waitingForNext && display !== "Err") {
            const result = doCompute(acc, v, op);
            setAcc(result);
            setVal(result);
          } else {
            setAcc(v);
          }
          setOp(nextOp);
          setWaitingForNext(true);
          setHasOpUsed(true);
          return;
        }
        default:
          return;
      }
    }

    if (key.kind === "submit") {
      onEquals();
      return;
    }
  };

  /** "=" pressed */
  const onEquals = async () => {
    // If ANY arithmetic op was used, compute.
    if (hasOpUsed && acc !== null && op !== null && display !== "Err") {
      const result = doCompute(acc, curVal(), op);
      setVal(result);
      setAcc(result);
      setOp(null);
      setWaitingForNext(true);
      setHasOpUsed(false);
      return;
    }

    // Otherwise fall back to AUTH flow (your original behavior)
    // Only submit if it's at least 4 digits to avoid accidental hits.
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
      if (data?.token) {
        try { localStorage.setItem("auth_token", data.token); } catch {}
      }
      try { localStorage.setItem("auth_ok", "true"); } catch {}
      setSpecialMsg("YES");
      setTimeout(() => {
        window.location.replace("/guest/welcome");
      }, 500);
    } catch {
      setSpecialMsg("NOPE");
      setTimeout(() => {
        setShowInvalid(true);
        setSubmitting(false);
        setSpecialMsg(null);
      }, 500);
    }
  };

  return (
    <div className="w-screen h-screen bg-cactus-sand relative overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 2236 1440"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background photo */}
        <image
          href={imgSrc}
          x="0"
          y="0"
          width="2236"
          height="1440"
          preserveAspectRatio="xMidYMid slice"
          crossOrigin="anonymous"
        />

        {/* LCD outline (debug) */}
        {DEBUG && (
          <rect
            x={LCD.x}
            y={LCD.y}
            width={LCD.w}
            height={LCD.h}
            fill="rgba(0,255,0,0.25)"
            stroke="rgba(0,200,0,0.9)"
            strokeWidth="1"
            rx="8"
            ry="8"
          />
        )}

        {/* LCD text (fades with solar hold) */}
        <g style={{ opacity: faded ? 0.15 : 1, transition: "opacity 2s" }}>
          <text
            x={LCD.x + LCD.w - 1.5}
            y={LCD.y + LCD.h - 1.8}
            textAnchor="end"
            style={{
              fontFamily: '"DSEG7Classic", monospace',
              fontSize: `${LCD.h * 0.9}px`,
              fill: "#202020",
            }}
          >
            {specialMsg || (display === "" ? "58008" : display)}
          </text>
        </g>

        {/* Button hotspots */}
        {KEYS.map((k) => (
          <g key={k.id}>
            {DEBUG && (
              <>
                <rect
                  x={k.x}
                  y={k.y}
                  width={k.w}
                  height={k.h}
                  fill="rgba(0,255,0,0.15)"
                  stroke="rgba(0,128,0,0.4)"
                  strokeWidth="0.25"
                  rx="6"
                  ry="6"
                />
                <text
                  x={k.x + 0.6}
                  y={k.y + 2.5}
                  fontSize="2.5px"
                  fill="#008800"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {`${k.id} (${k.x},${k.y})`}
                </text>
              </>
            )}

            <rect
              x={k.x} y={k.y} width={k.w} height={k.h}
              rx="1.2"
              fill="transparent"
              style={{ cursor: "pointer", userSelect: "none", WebkitUserSelect: "none" }}
              onPointerDown={() => setPressed(k.id)}
              onPointerUp={() => { setPressed(null); press(k); }}
              onPointerLeave={() => setPressed(null)}
              aria-label={k.label}
            />

            {pressed === k.id && (
              <rect
                x={k.x} y={k.y} width={k.w} height={k.h}
                rx="1.2" fill="rgba(0,0,0,0.18)"
              />
            )}
          </g>
        ))}

        {/* Solar panel hotspot (with fade + LOL easter egg) */}
        {DEBUG && (
          <rect
            x={840}
            y={420}
            width={265}
            height={80}
            fill="rgba(0,255,0,0.15)"
            stroke="rgba(0,128,0,0.4)"
            strokeWidth="0.25"
            rx="6"
            ry="6"
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
      </svg>

      {/* <InvalidCodeModal show={showInvalid} onClose={() => setShowInvalid(false)} /> */}
    </div>
  );
}