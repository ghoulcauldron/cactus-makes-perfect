import { useState, useRef } from "react";
import InvalidCodeModal from "./InvalidCodeModal";
import React from "react";

type KeyDef =
  | { id: string; label: string; x: number; y: number; w: number; h: number; kind: "digit" | "submit" | "clear" | "delete" };

const LCD = {
  x: 880,  // left edge of LCD
  y: 235,  // top edge
  w: 445,  // width
  h: 83,  // height
};

const KEYS: KeyDef[] = [
  // Row 1
  { id: "7", label: "7", x: 845, y: 780, w: 110, h: 70, kind: "digit" },
  { id: "8", label: "8", x: 970, y: 775, w: 110, h: 70, kind: "digit" },
  { id: "9", label: "9", x: 1100, y: 772, w: 110, h: 70, kind: "digit" },

  // Row 2
  { id: "4", label: "4", x: 845, y: 880, w: 110, h: 70, kind: "digit" },
  { id: "5", label: "5", x: 970, y: 875, w: 110, h: 70, kind: "digit" },
  { id: "6", label: "6", x: 1100, y: 872, w: 110, h: 70, kind: "digit" },

  // Row 3
  { id: "1", label: "1", x: 845, y: 980, w: 110, h: 70, kind: "digit" },
  { id: "2", label: "2", x: 973, y: 980, w: 110, h: 70, kind: "digit" },
  { id: "3", label: "3", x: 1100, y: 977, w: 110, h: 70, kind: "digit" },

  // Bottom row: ON/C + 0
  { id: "on", label: "ON/C", x: 847, y: 1085, w: 110, h: 70, kind: "clear" },
  { id: "0",  label: "0",    x: 978, y: 1080, w: 110, h: 70, kind: "digit" },

  // Big equals bar
  { id: "equals", label: "=", x: 1275, y: 972, w: 110, h: 180, kind: "submit" },

  // MRC button (coordinates to be filled)
  { id: "mrc", label: "MRC", x: 842, y: 680, w: 110, h: 70, kind: "delete" },
];

// The map of which segments are active for each character
const SEVEN_SEGMENT_MAP: Record<string, string[]> = {
  ' ': [], '0': ['a','b','c','d','e','f'], '1': ['b','c'], '2': ['a','b','g','e','d'], '3': ['a','b','g','c','d'], '4': ['f','g','b','c'], '5': ['a','f','g','c','d'], '6': ['a','f','g','c','d','e'], '7': ['a','b','c'], '8': ['a','b','c','d','e','f','g'], '9': ['a','b','c','d','f','g'], 'L': ['f','e','d'], 'O': ['a','b','c','d','e','f'], 'N': ['a','b','c','e','f'], 'P':['a','b','g','e','f'], 'E': ['a','f','g','e','d'], 'S': ['a','f','g','c','d'], 'Y': ['f','b','g','c','d'],
};

// The "Blueprint" for a single digit.
// This defines the precise position and rotation for each of the 7 segments.
// They are all relative to the center of the digit.
const SEGMENT_TRANSFORMS: Record<string, string> = {
  a: "translate(0, -32)",
  b: "translate(20, -16) rotate(90)",
  c: "translate(20, 16) rotate(90)",
  d: "translate(0, 32)",
  e: "translate(-20, 16) rotate(90)",
  f: "translate(-20, -16) rotate(90)",
  g: "translate(0, 0)",
};

// The master path for a single segment, centered at the origin (0,0).
// This is based on your hand-drawn path, but centered for easy rotation.
const MASTER_SEGMENT_PATH = "M -25 -1 L -22 -4 L 21 -4 L 24 -1 L 16 7 L -16 7 Z";


export function SegmentRenderer({
  text,
  x = 0,
  y = 0,
  digitHeight = 80, // Control size with a single height property
}: {
  text: string;
  x?: number;
  y?: number;
  digitHeight?: number;
}) {
  const chars = text.toUpperCase().split('');

  // The natural size of our blueprint digit is ~77 units tall.
  // Calculate a single, uniform scale factor.
  const scale = digitHeight / 77;
  
  // The width of a single digit is determined by its height and natural aspect ratio.
  const digitWidth = 54.4 * scale;
  const digitSpacing = digitWidth * 0.2;

  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        {/* Define our master segment shape once */}
        <path id="master-segment" d={MASTER_SEGMENT_PATH} />
      </defs>

      {chars.map((char, i) => {
        const activeSegments = SEVEN_SEGMENT_MAP[char] || [];
        const charX = i * (digitWidth + digitSpacing);

        return (
          // This group positions the entire digit and applies the final scale and slant.
          <g
            key={i}
            transform={`translate(${charX + digitWidth / 2}, ${digitHeight / 2}) scale(${scale}) skewX(0)`}
          >
            {activeSegments.map((segmentKey) => (
              // For each active segment, stamp a copy of the master path
              // and apply its specific position/rotation from the blueprint.
              <use
                key={segmentKey}
                href="#master-segment"
                transform={SEGMENT_TRANSFORMS[segmentKey]}
                fill={'#202020ff'}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

export default function PhotoCalculatorAuth({
  imgSrc = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/calculatorHand.png",        // or your Supabase URL
  DEBUG = true,                     // set true to see hotspot outlines
}: { imgSrc?: string; DEBUG?: boolean }) {
  const url = new URL(window.location.href);
  const email = url.searchParams.get("email") || "your email";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);

  const [faded, setFaded] = useState(false);
  const solarTimer = useRef<number | null>(null);
  const [specialMsg, setSpecialMsg] = useState<string | null>(null);

  const [cleared, setCleared] = useState(false);

  const press = (key: KeyDef) => {
    if (submitting) return;
    if (key.kind === "digit") {
      if (cleared) {
        setCode(key.label);
        setCleared(false);
      } else {
        setCode((c) => (c.length < 6 ? c + key.label : c));
      }
    } else if (key.kind === "clear") {
      setCode("0");
      setCleared(true);
    } else if (key.kind === "delete") {
      setCode((c) => c.slice(0, -1));
    } else if (key.kind === "submit") {
      submit();
    }
  };

  const submit = async () => {
    if (code.length < 4) return;
    setSubmitting(true);
    try {
      const token = url.searchParams.get("token") || "";
      const res = await fetch("/api/v1/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, code }),
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
          href={imgSrc}              // ✅ keep using Supabase URL
          x="0"
          y="0"
          width="2236"
          height="1440"
          preserveAspectRatio="xMidYMid slice"
          crossOrigin="anonymous"
        />

        {/* LCD display text */}
        {/* Debug LCD outline */}
        {DEBUG && (
          <rect
            x={LCD.x}
            y={LCD.y}
            width={LCD.w}
            height={LCD.h}
            fill="rgba(0,255,0,0.25)"
            stroke="rgba(0,200,0,0.9)"
            strokeWidth="1"
            rx="1.5"
          />
        )}
        {specialMsg ? (
          <g style={{ opacity: faded ? 0.15 : 1, transition: "opacity 2s" }}>
          <SegmentRenderer text={specialMsg} x={LCD.x + 10} y={LCD.y + 5} digitHeight={LCD.h * 0.9} />          </g>
        ) : (
          <g style={{ opacity: faded ? 0.15 : 1, transition: "opacity 2s" }}>
            <text
              x={LCD.x + LCD.w - 1.5}
              y={LCD.y + LCD.h - 1.8}
              textAnchor="end"
              style={{
                fontFamily: '"DSEG7Classic", monospace',
                fontSize: `${LCD.h * 0.9}px`,
                fill: "#202020ff",
              }}
            >
              {code || "58008"}
            </text>
          </g>
        )}

        {/* Hotspots */}
        {KEYS.map((k) => (
          <g key={k.id}>
            {/* Debug overlays for key mapping */}
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
                />
                {/* Small label with id and coords */}
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
            {/* Actual clickable area */}
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
            {/* Press effect overlay */}
            {pressed === k.id && (
              <rect
                x={k.x} y={k.y} width={k.w} height={k.h}
                rx="1.2" fill="rgba(0,0,0,0.18)"
              />
            )}
          </g>
        ))}

        {/* Solar panel hotspot */}
        {DEBUG && (
          <rect
            x={830}
            y={430}
            width={265}
            height={80}
            fill="rgba(0,255,0,0.15)"
            stroke="rgba(0,128,0,0.4)"
            strokeWidth="0.25"
          />
        )}
        <rect
          x={830} y={430} width={265} height={80}
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

      <InvalidCodeModal show={showInvalid} onClose={() => setShowInvalid(false)} />
    </div>
  );
}