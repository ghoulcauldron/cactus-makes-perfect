// apps/admin/components/ConsoleHome.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "@fontsource/vt323";
import { apiFetch } from "../api/client";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type Destination = "MEDIA" | "INBOX" | "GUESTS" | "LODGING" | "SURVEYS";

interface MediaRow {
  id: string;
  kind: "image" | "video";
  status: string;
  thumb_url: string | null;
  display_url?: string | null;
  guest_id: string;
  guest_name: string;
  uploaded_at: string;
}

interface Contributor {
  id: string;
  first_name: string;
  last_name: string;
  upload_count: number;
}

interface Thread {
  unread_count: number;
}

// ---------------------------------------------------------------------------
// VECTOR FACE
// Centerline strokes for a blocky, chamfered vector alphabet, plotted in a
// 40 x 56 unit box the way stroke displays drew type. Rendered as hollow
// outlines: a wide stroke with a narrower stroke cut out of it via a mask.
// ---------------------------------------------------------------------------
const GLYPHS: Record<string, string> = {
  T: "M0 0H40M20 0V56",
  H: "M0 0V56M40 0V56M0 28H40",
  E: "M40 0H0V56H40M0 28H30",
  C: "M40 0H8L0 8V48L8 56H40",
  A: "M0 56V8L8 0H32L40 8V56M0 32H40",
  P: "M0 56V0H32L40 8V24L32 32H0",
  S: "M40 0H8L0 8V20L8 28H32L40 36V48L32 56H0",
  U: "M0 0V48L8 56H32L40 48V0",
  L: "M0 0V56H40",
};

// An original emblem in the same stroke language: a saguaro
const CACTUS = "M20 56V4M20 36H6V18M20 28H34V12";

const ADVANCE = 54;   // glyph width + tracking
const SPACE   = 30;
const PAD     = 6;    // room for the outer stroke

function HollowStrokes({ id, paths, width, height, className, label }: {
  id: string;
  paths: { d: string; x: number }[];
  width: number;
  height: number;
  className?: string;
  label: string;
}) {
  const box = { x: -PAD, y: -PAD, w: width + PAD * 2, h: height + PAD * 2 };
  const strokes = (color: string, w: number) => (
    <g stroke={color} strokeWidth={w}>
      {paths.map((p, i) => <path key={i} d={p.d} transform={`translate(${p.x} 0)`} />)}
    </g>
  );
  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} className={className} role="img" aria-label={label}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
          <g fill="none" strokeLinecap="square" strokeLinejoin="miter">
            {strokes("#fff", 9)}
            {strokes("#000", 3.4)}
          </g>
        </mask>
      </defs>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}

function VectorWord({ text, className }: { text: string; className?: string }) {
  const paths: { d: string; x: number }[] = [];
  let x = 0;
  for (const ch of text) {
    if (ch === " ") { x += SPACE; continue; }
    const d = GLYPHS[ch];
    if (d) paths.push({ d, x });
    x += ADVANCE;
  }
  return <HollowStrokes id="n51-word" paths={paths} width={x - (ADVANCE - 40)} height={56} className={className} label={text} />;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const pad = (n: number, len = 3) => String(n).padStart(len, "0");

function clock(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
function datestamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

// ---------------------------------------------------------------------------
// HARDWARE PARTS
// ---------------------------------------------------------------------------
const SCREW_ANGLES = [18, 72, 131, 44];

function Screws() {
  return (
    <>
      {(["tl", "tr", "bl", "br"] as const).map((pos, i) => (
        <span key={pos} aria-hidden className={`n51-screw n51-screw-${pos}`}
          style={{ ["--r" as string]: `${SCREW_ANGLES[i]}deg` }} />
      ))}
    </>
  );
}

// Embossed label-maker tape
function Tape({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`n51-tape ${className}`}>{children}</span>;
}

// Indicator lamp: chrome ring, domed lens. Unlit lenses keep a dark tint of their color.
function Lamp({ color, on, blink = false, label, size = "md" }: {
  color: string; on: boolean; blink?: boolean; label?: string; size?: "sm" | "md";
}) {
  return (
    <span
      className={`n51-lamp n51-lamp-${size} ${on ? "is-on" : ""} ${blink ? "n51-blink" : ""}`}
      style={{ ["--c" as string]: color }}
      title={label}
      aria-label={label}
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
    >
      <i />
    </span>
  );
}

// ---------------------------------------------------------------------------
// FEED MONITOR: cuts between recent photos like a camera channel
// ---------------------------------------------------------------------------
function FeedMonitor({ items, onOpen }: { items: MediaRow[]; onOpen: () => void }) {
  const [i, setI] = useState(0);
  const [cutting, setCutting] = useState(false);
  const reduce = usePrefersReducedMotion();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (items.length < 2 || reduce) return;
    const id = window.setInterval(() => {
      setCutting(true);
      timers.current.push(window.setTimeout(() => setI(n => (n + 1) % items.length), 110));
      timers.current.push(window.setTimeout(() => setCutting(false), 240));
    }, 4800);
    return () => {
      window.clearInterval(id);
      timers.current.forEach(t => window.clearTimeout(t));
      timers.current = [];
    };
  }, [items.length, reduce]);

  const current = items[i];

  return (
    <div className="n51-panel p-4 pt-5">
      <Screws />
      <div className="flex items-center justify-between mb-3 px-1">
        <Tape>FEED</Tape>
        <span className="n51-engrave text-[10px]">CH {pad(i + 1, 2)}</span>
      </div>
      <button onClick={onOpen} className="n51-bezel n51-bezel-sm block w-full" aria-label="Open The Capsule">
        <div className={`n51-glass n51-glass-feed aspect-[4/3] ${cutting ? "is-cutting" : ""}`}>
          {current ? (
            <>
              <img src={current.thumb_url || ""} alt={`Photo from ${current.guest_name}`}
                className="n51-feed-img absolute inset-0 w-full h-full object-cover" />
              <div className="n51-raster n51-feed-text absolute inset-x-0 top-0 flex justify-between px-3 pt-2 text-[17px]">
                <span>FEED {pad(i + 1, 2)}/{pad(items.length, 2)}</span>
                {!reduce && <span className="n51-rec">REC</span>}
              </div>
              <div className="n51-raster n51-feed-text absolute inset-x-0 bottom-0 px-3 pb-2 text-[17px] truncate">
                {current.guest_name.toUpperCase()}
              </div>
            </>
          ) : (
            <div className="n51-static absolute inset-0 flex items-center justify-center">
              <span className="n51-raster n51-feed-text text-[20px]">NO SIGNAL</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SIDE MONITOR: small green-phosphor screen; powered down when its area is concluded
// ---------------------------------------------------------------------------
function SideMonitor({ label, lines, off = false, onClick }: {
  label: string; lines: string[]; off?: boolean; onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Tape className="self-start">{label}</Tape>
      <button onClick={onClick} className="n51-bezel n51-bezel-sm block w-full text-left" aria-label={label}>
        <div className={`n51-glass ${off ? "n51-glass-off" : "n51-glass-green"} min-h-[64px] flex items-center`}>
          <div className="n51-raster relative z-10 px-3 py-2 text-[19px] leading-[1.05]">
            {lines.map((l, k) => <div key={k}>{l}</div>)}
          </div>
        </div>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
export default function ConsoleHome({ onNavigate }: { onNavigate: (tab: Destination) => void }) {
  const [media, setMedia]               = useState<MediaRow[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [unread, setUnread]             = useState(0);
  const [loading, setLoading]           = useState(true);
  const [linkDown, setLinkDown]         = useState(false);
  const [now, setNow]                   = useState(() => new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const [m, t] = await Promise.allSettled([
      apiFetch("/admin/media"),
      apiFetch("/admin/email/threads"),
    ]);
    if (m.status === "fulfilled") {
      setMedia(m.value.media || []);
      setContributors(m.value.contributors || []);
    }
    if (t.status === "fulfilled") {
      const threads: Thread[] = t.value.threads || [];
      setUnread(threads.reduce((sum, th) => sum + (th.unread_count || 0), 0));
    }
    setLinkDown(m.status === "rejected");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  // /admin/media returns one row per (media, contributor); count each file once
  const unique = useMemo(() => {
    const seen = new Set<string>();
    return media.filter(m => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  }, [media]);

  const stats = useMemo(() => ({
    imprints:  unique.length,
    photos:    unique.filter(m => m.kind === "image").length,
    videos:    unique.filter(m => m.kind === "video").length,
    attention: unique.filter(m => m.status !== "ready").length,
    cohort:    contributors.length,
    active:    contributors.filter(c => c.upload_count > 0).length,
  }), [unique, contributors]);

  const feed = useMemo(
    () => unique.filter(m => m.status === "ready" && m.kind === "image" && m.thumb_url).slice(0, 8),
    [unique]
  );

  const problemsByGuest = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of media) {
      if (m.status !== "ready") counts[m.guest_id] = (counts[m.guest_id] || 0) + 1;
    }
    return counts;
  }, [media]);

  // Readout rows on a fixed character grid
  const row = (label: string, value: string) => `${label.padEnd(14, " ")}${value}`;

  return (
    <div className="n51-chassis h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-7">

        {/* ── Status strip ─────────────────────────────────────── */}
        <div className="n51-panel flex items-center justify-between px-5 py-3 mb-4">
          <Screws />
          <div className="flex items-center gap-3 pl-3">
            <Lamp color={linkDown ? "#ff3b24" : "#3ddc3a"} on label={linkDown ? "Link down" : "Link OK"} size="sm" />
            <span className="n51-engrave text-[10px]">LINK</span>
          </div>
          <div className="n51-led-window pr-1 mr-3">
            <span className="n51-raster n51-led text-[15px] sm:text-[17px] mr-3 opacity-70">{datestamp(now)}</span>
            <span className="n51-raster n51-led text-[22px] sm:text-[26px]">{clock(now)}</span>
          </div>
        </div>

        {/* Phones: one stack, ordered by use. Desktop: two columns. */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_320px]">

          {/* ── Left column ─────────────────────────────────────── */}
          <div className="contents lg:flex lg:flex-col lg:gap-4">

            {/* Main monitor: The Capsule */}
            <div className="n51-panel p-3 sm:p-5 order-1 lg:order-none">
              <Screws />
              <div className="n51-bezel">
                <div className="n51-glass n51-glass-red n51-power">
                  <div className="n51-roll" aria-hidden />
                  <div className="n51-phosphor-red relative z-10 px-5 py-6 sm:px-10 sm:py-9">

                    <HollowStrokes
                      id="n51-cactus" label="Cactus emblem"
                      paths={[{ d: CACTUS, x: 0 }]} width={40} height={56}
                      className="n51-vector h-9 sm:h-12 w-auto mb-3 sm:mb-4"
                    />
                    <VectorWord text="THE CAPSULE" className="n51-vector w-full max-w-[620px] h-auto" />

                    <div className="n51-raster text-[20px] sm:text-[24px] mt-2 sm:mt-3 tracking-[0.12em]">
                      ARCHIVE {pad(stats.imprints, 9)}
                    </div>

                    <div className="n51-raster mt-6 sm:mt-8 text-[20px] sm:text-[24px] leading-[1.2]">
                      {loading ? (
                        <div>&gt; CONNECTING<span className="n51-cursor" /></div>
                      ) : linkDown ? (
                        <>
                          <div>&gt; NO CARRIER</div>
                          <div className="opacity-80">&gt; ARCHIVE DID NOT RESPOND</div>
                        </>
                      ) : (
                        <>
                          <pre className="n51-pre">{row("PHOTOGRAPHS", pad(stats.photos))}</pre>
                          <pre className="n51-pre">{row("VIDEO", pad(stats.videos))}</pre>
                          <pre className="n51-pre">{row("CONTRIBUTORS", `${pad(stats.active, 2)}/${pad(stats.cohort, 2)}`)}</pre>
                          {stats.attention > 0 && (
                            <pre className="n51-pre"><span className="n51-inverse">{row("UNFINISHED", pad(stats.attention))}</span></pre>
                          )}
                          <div className="mt-3">&gt; READY<span className="n51-cursor" /></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Control row */}
              <div className="flex items-center gap-4 mt-4 sm:mt-5 px-1">
                {linkDown ? (
                  <button onClick={load} className="n51-pushbutton n51-pushbutton-red" aria-label="Retry connection">
                    <span>RETRY</span>
                  </button>
                ) : (
                  <button onClick={() => onNavigate("MEDIA")} className="n51-pushbutton" aria-label="Open The Capsule">
                    <span>OPEN</span>
                  </button>
                )}
                <Tape>{linkDown ? "RECONNECT" : "THE CAPSULE"}</Tape>
                <div className="ml-auto hidden sm:flex items-center gap-2">
                  <Lamp color="#ffb000" on={stats.attention > 0} blink={stats.attention > 0} size="sm" />
                  <span className="n51-engrave text-[10px]">ATTN</span>
                </div>
              </div>
            </div>

            {/* Contributor lamps */}
            {contributors.length > 0 && (
              <div className="n51-panel px-6 py-5 order-3 lg:order-none">
                <Screws />
                <div className="flex items-center justify-between mb-4">
                  <span className="n51-engrave text-[11px]">CONTRIBUTORS</span>
                  <span className="n51-engrave text-[10px]">{pad(stats.active, 2)} OF {pad(stats.cohort, 2)}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-3">
                  {contributors.map(c => {
                    const problems = problemsByGuest[c.id] || 0;
                    const label = `${c.first_name} ${c.last_name}: ${
                      problems > 0 ? `${problems} unfinished`
                        : c.upload_count > 0 ? `${c.upload_count} uploaded` : "nothing yet"
                    }`;
                    return (
                      <Lamp key={c.id}
                        color={problems > 0 ? "#ffb000" : "#3ddc3a"}
                        on={problems > 0 || c.upload_count > 0}
                        blink={problems > 0}
                        label={label}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                  <span className="flex items-center gap-2"><Lamp color="#3ddc3a" on size="sm" /><span className="n51-engrave text-[9px]">CONTRIBUTED</span></span>
                  <span className="flex items-center gap-2"><Lamp color="#ffb000" on size="sm" /><span className="n51-engrave text-[9px]">NEEDS ATTENTION</span></span>
                  <span className="flex items-center gap-2"><Lamp color="#3ddc3a" on={false} size="sm" /><span className="n51-engrave text-[9px]">NOTHING YET</span></span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ────────────────────────────────────── */}
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            <div className="order-4 lg:order-none">
              <FeedMonitor items={feed} onOpen={() => onNavigate("MEDIA")} />
            </div>

            <div className="n51-panel px-5 py-5 order-2 lg:order-none">
              <Screws />
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <SideMonitor
                  label="EYES ONLY"
                  lines={unread > 0 ? [`${pad(unread)} UNREAD`] : ["INBOX CLEAR"]}
                  onClick={() => onNavigate("INBOX")}
                />
                <SideMonitor
                  label="GUEST LIST"
                  lines={[`COHORT ${pad(stats.cohort, 2)}`]}
                  onClick={() => onNavigate("GUESTS")}
                />
                <SideMonitor label="LODGING" lines={["OFFLINE"]} off onClick={() => onNavigate("LODGING")} />
                <SideMonitor label="SURVEYS" lines={["OFFLINE"]} off onClick={() => onNavigate("SURVEYS")} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{CONSOLE_CSS}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
// Powder-coat grain: fine fractal noise at low opacity
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;

const STATIC = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='1'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23s)'/></svg>")`;

const CONSOLE_CSS = `
.n51-chassis {
  background: ${GRAIN}, #1c1b18;
  color: #cfcabd;
}

/* Painted steel panels */
.n51-panel {
  position: relative;
  background: ${GRAIN}, linear-gradient(#2e2c27, #282621);
  border: 1px solid #0d0c0a;
  border-radius: 3px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.5), 0 2px 3px rgba(0,0,0,0.5);
}

.n51-screw {
  position: absolute; width: 9px; height: 9px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #b7b2a6, #5a564e 65%, #3a3833);
  box-shadow: inset 0 -1px 1px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05);
}
.n51-screw::after {
  content: ""; position: absolute; left: 1.5px; right: 1.5px; top: 50%; height: 1.6px;
  background: #22211d; transform: translateY(-50%) rotate(var(--r));
}
.n51-screw-tl { top: 7px; left: 7px; }
.n51-screw-tr { top: 7px; right: 7px; }
.n51-screw-bl { bottom: 7px; left: 7px; }
.n51-screw-br { bottom: 7px; right: 7px; }

/* Engraved plate lettering */
.n51-engrave {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 700; letter-spacing: 0.22em;
  color: #8f8a7e;
  text-shadow: 0 -1px 0 rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.07);
}

/* Label-maker tape: raised white letters on black */
.n51-tape {
  display: inline-block;
  font-family: "Helvetica Neue", "Arial Narrow", Arial, sans-serif;
  font-stretch: condensed; font-weight: 700;
  font-size: 11px; letter-spacing: 0.16em; line-height: 1;
  color: #f1efe9;
  background: linear-gradient(#1a1a1a, #0e0e0e);
  padding: 4px 8px 3px;
  border-radius: 1px;
  transform: rotate(-0.6deg);
  text-shadow: 0 1px 0 rgba(0,0,0,0.9), 0 -1px 0 rgba(255,255,255,0.18);
  box-shadow: 0 1px 1px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
}

/* Monitor housings */
.n51-bezel {
  background: linear-gradient(#34322d, #262420);
  border-radius: 14px;
  padding: 14px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 3px rgba(0,0,0,0.6), 0 1px 0 rgba(0,0,0,0.8);
}
.n51-bezel-sm { border-radius: 10px; padding: 8px; }

/* Tube glass: curvature, vignette, reflection, scanlines */
.n51-glass {
  position: relative; overflow: hidden;
  border-radius: 26px / 34px;
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.85), inset 0 0 38px rgba(0,0,0,0.7);
}
.n51-bezel-sm .n51-glass { border-radius: 14px / 18px; }
.n51-glass::before {
  content: ""; position: absolute; inset: 0; z-index: 20; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 3px);
}
.n51-glass::after {
  content: ""; position: absolute; inset: 0; z-index: 21; pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(0,0,0,0.6) 100%),
    radial-gradient(ellipse 60% 40% at 26% 14%, rgba(255,255,255,0.09), transparent 70%);
}

/* Red phosphor: the whole field is lit */
.n51-glass-red { background: radial-gradient(ellipse at 50% 45%, #cf2a5a 0%, #b51f4c 42%, #7d1033 100%); }
.n51-phosphor-red { color: #ffdbe5; }
.n51-phosphor-red .n51-raster { text-shadow: 0 0 3px rgba(255,219,229,0.85), 0 0 10px rgba(255,160,190,0.35); }
.n51-vector { color: #fff0f4; filter: drop-shadow(0 0 2px rgba(255,235,242,0.9)) drop-shadow(0 0 8px rgba(255,170,200,0.4)); }
.n51-inverse { background: #ffdbe5; color: #9c1640; text-shadow: none; }

/* Slow brightness band rolling down the tube */
.n51-roll {
  position: absolute; left: 0; right: 0; top: -30%; height: 30%; z-index: 5; pointer-events: none;
  background: linear-gradient(transparent, rgba(255,255,255,0.05), transparent);
  animation: n51-roll 9s linear infinite;
}

/* Green phosphor secondary screens */
.n51-glass-green { background: radial-gradient(ellipse at 50% 45%, #0d2c10 0%, #071a09 65%, #030b04 100%); }
.n51-glass-green .n51-raster { color: #62e24a; text-shadow: 0 0 3px rgba(98,226,74,0.8), 0 0 9px rgba(98,226,74,0.25); }

/* Powered down: dark glass, faint burn-in */
.n51-glass-off { background: radial-gradient(ellipse at 50% 45%, #1a1d1c 0%, #0d0f0e 70%, #070808 100%); }
.n51-glass-off .n51-raster { color: rgba(140,150,140,0.16); }

/* White phosphor feed screen */
.n51-glass-feed { background: #0b0e0f; }
.n51-feed-img {
  filter: grayscale(1) contrast(1.35) brightness(0.92) blur(0.35px);
  opacity: 0.92;
}
.n51-glass-feed .n51-feed-img { mix-blend-mode: screen; }
.n51-feed-text { position: absolute; z-index: 10; color: #eef6f8; text-shadow: 0 0 3px rgba(230,245,250,0.9), 0 1px 2px #000; }
.n51-glass-feed.is-cutting .n51-feed-img { transform: translateY(-6%); filter: grayscale(1) brightness(1.8) blur(1px); }
.n51-rec::before { content: "\\25CF "; animation: n51-blink 1.6s steps(1) infinite; }
.n51-static { background: ${STATIC}, #1a1e20; }

/* Raster type */
.n51-raster { font-family: "VT323", "Courier New", monospace; font-weight: 400; letter-spacing: 0.04em; }
.n51-pre { font: inherit; margin: 0; white-space: pre; }
.n51-cursor::after { content: "_"; animation: n51-blink 1s steps(1) infinite; }

/* LED readout window */
.n51-led-window {
  background: #120505; border-radius: 3px; padding: 2px 10px;
  box-shadow: inset 0 1px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.05);
}
.n51-led { color: #ff3a24; text-shadow: 0 0 4px rgba(255,58,36,0.9), 0 0 12px rgba(255,58,36,0.35); }

/* Indicator lamps */
.n51-lamp {
  display: inline-block; flex: none; border-radius: 50%;
  padding: 3px;
  background: radial-gradient(circle at 32% 28%, #efece4, #9a968c 40%, #4a4842 78%, #2c2b28);
  box-shadow: 0 1px 1px rgba(0,0,0,0.7);
}
.n51-lamp-md { width: 18px; height: 18px; }
.n51-lamp-sm { width: 13px; height: 13px; padding: 2px; }
.n51-lamp > i {
  position: relative;
  display: block; width: 100%; height: 100%; border-radius: 50%;
  background: radial-gradient(circle at 36% 30%, rgba(255,255,255,0.28) 0 12%, color-mix(in srgb, var(--c) 24%, #070707) 62%);
}
.n51-lamp.is-on > i::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #fffef8 0 14%, var(--c) 48%, color-mix(in srgb, var(--c) 65%, #000) 100%);
  box-shadow: 0 0 9px var(--c), 0 0 3px var(--c);
}
.n51-blink > i::after { animation: n51-lamp-blink 2.4s ease-in-out infinite; }

/* Illuminated square pushbutton */
.n51-pushbutton {
  flex: none; width: 58px; height: 58px; padding: 5px; border-radius: 4px;
  background: linear-gradient(#4a4740, #2b2925);
  box-shadow: 0 3px 0 #11100e, 0 4px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12);
  transition: transform 80ms ease, box-shadow 80ms ease;
}
.n51-pushbutton > span {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%; border-radius: 2px;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-weight: 800;
  font-size: 11px; letter-spacing: 0.14em;
  color: #4a2a00;
  background: radial-gradient(circle at 50% 40%, #ffe29a, #ffb000 55%, #d98a00);
  box-shadow: 0 0 14px rgba(255,176,0,0.55), inset 0 -2px 3px rgba(120,60,0,0.4);
}
.n51-pushbutton-red > span {
  color: #3d0500;
  background: radial-gradient(circle at 50% 40%, #ff9a88, #ff3b24 55%, #c41c0a);
  box-shadow: 0 0 14px rgba(255,59,36,0.55), inset 0 -2px 3px rgba(90,10,0,0.4);
}
.n51-pushbutton:active { transform: translateY(2px); box-shadow: 0 1px 0 #11100e, inset 0 1px 0 rgba(255,255,255,0.1); }

/* Power-on: the one orchestrated moment */
.n51-power { animation: n51-on 1000ms cubic-bezier(.2,.8,.2,1) both; transform-origin: center; }

button:focus-visible { outline: 2px solid #ffb000; outline-offset: 3px; }

@keyframes n51-on {
  0%   { transform: scaleY(0.006) scaleX(0.5); filter: brightness(4); }
  45%  { transform: scaleY(0.006) scaleX(1);   filter: brightness(2.5); }
  100% { transform: none; filter: none; }
}
@keyframes n51-roll { from { transform: translateY(0); } to { transform: translateY(460%); } }
@keyframes n51-blink { 0%, 55% { opacity: 1; } 70%, 100% { opacity: 0.25; } }
@keyframes n51-lamp-blink { 0%, 50% { opacity: 1; } 62%, 100% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .n51-power, .n51-roll, .n51-blink > i::after, .n51-cursor::after, .n51-rec::before { animation: none; }
}
`;