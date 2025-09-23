import { useState } from "react";
import InvalidCodeModal from "./InvalidCodeModal";

type KeyDef =
  | { id: string; label: string; x: number; y: number; w: number; h: number; kind: "digit" | "submit" | "clear" | "delete" };

const LCD = {
  x: 880,  // left edge of LCD
  y: 230,  // top edge
  w: 450,  // width
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

function SegmentRenderer({ text, x, y, w, h }: { text: string; x: number; y: number; w: number; h: number }) {
  // Define 7 segments polygons relative to a cell bounding box (0,0,w,h)
  // Segment order: a,b,c,d,e,f,g
  // a: top horizontal
  // b: top-right vertical
  // c: bottom-right vertical
  // d: bottom horizontal
  // e: bottom-left vertical
  // f: top-left vertical
  // g: middle horizontal

  // We'll define each segment as a polygon with points relative to the box
  // We'll define a thickness for segments as a fraction of height and width
  const segThickness = Math.min(w, h) * 0.15;
  const segLengthH = w - 2 * segThickness;
  const segLengthV = h / 2 - 1.5 * segThickness;

  // Each segment polygon points are defined clockwise

  const segmentsPoints = {
    a: [
      [segThickness, 0],
      [segThickness + segLengthH, 0],
      [segThickness + segLengthH - segThickness / 2, segThickness / 2],
      [segThickness + segThickness / 2, segThickness / 2],
    ],
    b: [
      [w, segThickness],
      [w, segThickness + segLengthV],
      [w - segThickness / 2, segThickness + segLengthV - segThickness / 2],
      [w - segThickness / 2, segThickness + segThickness / 2],
    ],
    c: [
      [w, h / 2 + segThickness / 2],
      [w, h / 2 + segLengthV + segThickness / 2],
      [w - segThickness / 2, h / 2 + segLengthV],
      [w - segThickness / 2, h / 2 + segThickness],
    ],
    d: [
      [segThickness, h],
      [segThickness + segLengthH, h],
      [segThickness + segLengthH - segThickness / 2, h - segThickness / 2],
      [segThickness + segThickness / 2, h - segThickness / 2],
    ],
    e: [
      [0, h / 2 + segThickness / 2],
      [0, h / 2 + segLengthV + segThickness / 2],
      [segThickness / 2, h / 2 + segLengthV],
      [segThickness / 2, h / 2 + segThickness],
    ],
    f: [
      [0, segThickness],
      [0, segThickness + segLengthV],
      [segThickness / 2, segThickness + segLengthV - segThickness / 2],
      [segThickness / 2, segThickness + segThickness / 2],
    ],
    g: [
      [segThickness, h / 2],
      [segThickness + segLengthH, h / 2],
      [segThickness + segLengthH - segThickness / 2, h / 2 + segThickness / 2],
      [segThickness + segThickness / 2, h / 2 + segThickness / 2],
      [segThickness + segThickness / 2, h / 2 - segThickness / 2],
      [segThickness + segLengthH - segThickness / 2, h / 2 - segThickness / 2],
    ],
  };

  // Map characters to active segments
  // Y: f b g c d
  // S: a f g c d
  // O: a b c d e f
  // L: f e d
  // Other chars: no segments active (empty)

  const charToSegments: Record<string, (keyof typeof segmentsPoints)[]> = {
    Y: ["f", "b", "g", "c", "d"],
    S: ["a", "f", "g", "c", "d"],
    O: ["a", "b", "c", "d", "e", "f"],
    L: ["f", "e", "d"],
  };

  // We'll render each character spaced evenly horizontally within the total width w
  // Calculate cell width per char
  const chars = text.toUpperCase().split("");
  const cellWidth = w / chars.length;

  return (
    <g transform={`translate(${x},${y})`} aria-label={`LCD display: ${text}`}>
      {chars.map((ch, i) => {
        const activeSegments = charToSegments[ch] || [];
        const cx = cellWidth * i;
        const cy = 0;
        return (
          <g key={i} transform={`translate(${cx},${cy})`} aria-label={`Character ${ch}`}>
            {Object.entries(segmentsPoints).map(([seg, points]) => {
              const isActive = activeSegments.includes(seg as keyof typeof segmentsPoints);
              const pointsStr = points.map(p => p.join(",")).join(" ");
              return (
                <polygon
                  key={seg}
                  points={pointsStr}
                  fill={isActive ? "currentColor" : "none"}
                  stroke={isActive ? "currentColor" : "none"}
                  strokeWidth={isActive ? segThickness / 3 : 0}
                />
              );
            })}
            {/* If no active segments, render a faint rectangle as placeholder */}
            {activeSegments.length === 0 && (
              <rect
                x={segThickness / 2}
                y={segThickness / 2}
                width={cellWidth - segThickness}
                height={h - segThickness}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.1}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

export default function PhotoCalculatorAuth({
  imgSrc = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/calculatorHand.png",        // or your Supabase URL
  DEBUG = false,                     // set true to see hotspot outlines
}: { imgSrc?: string; DEBUG?: boolean }) {
  const url = new URL(window.location.href);
  const email = url.searchParams.get("email") || "your email";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  const press = (key: KeyDef) => {
    if (submitting) return;
    if (key.kind === "digit") {
      setCode((c) => {
        if (cleared || c === "0") {
          setCleared(false);
          return key.label;
        }
        return c.length < 6 ? c + key.label : c;
      });
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
      window.location.replace("/guest/welcome");
    } catch {
      setShowInvalid(true);
      setSubmitting(false);
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
        <SegmentRenderer text={code || "58008"} x={LCD.x} y={LCD.y} w={LCD.w} h={LCD.h} />

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
              style={{ cursor: "pointer" }}
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
      </svg>

      <InvalidCodeModal show={showInvalid} onClose={() => setShowInvalid(false)} />
    </div>
  );
}