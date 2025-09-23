import { useState } from "react";
import InvalidCodeModal from "./InvalidCodeModal";

type KeyDef =
  | { id: string; label: string; x: number; y: number; w: number; h: number; kind: "digit" | "submit" | "clear" };

const LCD = {
  x: 885,  // left edge of LCD
  y: 230,  // top edge
  w: 450,  // width
  h: 90,  // height
};

const KEYS: KeyDef[] = [
  // Row 1
  { id: "7", label: "7", x: 845, y: 780, w: 93, h: 70, kind: "digit" },
  { id: "8", label: "8", x: 38, y: 48, w: 12, h: 9, kind: "digit" },
  { id: "9", label: "9", x: 54, y: 48, w: 12, h: 9, kind: "digit" },

  // Row 2
  { id: "4", label: "4", x: 22, y: 60, w: 12, h: 9, kind: "digit" },
  { id: "5", label: "5", x: 38, y: 60, w: 12, h: 9, kind: "digit" },
  { id: "6", label: "6", x: 54, y: 60, w: 12, h: 9, kind: "digit" },

  // Row 3
  { id: "1", label: "1", x: 22, y: 72, w: 12, h: 9, kind: "digit" },
  { id: "2", label: "2", x: 38, y: 72, w: 12, h: 9, kind: "digit" },
  { id: "3", label: "3", x: 54, y: 72, w: 12, h: 9, kind: "digit" },

  // Bottom row: ON/C + 0
  { id: "on", label: "ON/C", x: 22, y: 84, w: 12, h: 9, kind: "clear" },
  { id: "0",  label: "0",    x: 38, y: 84, w: 12, h: 9, kind: "digit" },

  // Big equals bar
  { id: "equals", label: "=", x: 70, y: 55, w: 14, h: 38, kind: "submit" },
];

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

  const press = (key: KeyDef) => {
    if (submitting) return;
    if (key.kind === "digit") {
      setCode((c) => (c.length < 6 ? c + key.label : c));
    } else if (key.kind === "clear") {
      setCode("");
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