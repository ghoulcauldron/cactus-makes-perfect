// apps/admin/components/ConsoleHome.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
// HELPERS
// ---------------------------------------------------------------------------
const pad = (n: number, len = 3) => String(n).padStart(len, "0");

function stamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}  ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// A printed readout line: LABEL ........ VALUE
function Readout({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`flex items-baseline gap-2 ${alert ? "n51-alert-text" : ""}`}>
      <span className="shrink-0">{label}</span>
      <span aria-hidden className="flex-1 border-b border-dotted border-current opacity-35 -translate-y-[3px]" />
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

// A small green secondary monitor that navigates to one admin area
function SideMonitor({
  title, line, dim = false, onClick,
}: { title: string; line: string; dim?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="n51-bezel n51-btn text-left w-full group">
      <div className={`n51-crt-green px-4 py-3.5 ${dim ? "opacity-45 group-hover:opacity-80" : ""}`}>
        <p className="n51-green-text text-[11px] font-bold tracking-[0.25em]">{title}</p>
        <p className="n51-green-text text-[9px] tracking-[0.2em] mt-1.5 opacity-70">{line}</p>
      </div>
    </button>
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
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
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

  const recent = useMemo(
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

  return (
    <div className="h-full overflow-y-auto n51-chassis font-mono">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">

        {/* ── Status strip ───────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 text-[9px] tracking-[0.3em] text-[#8a9296]">
          <span className="flex items-center gap-2">
            <span
              className="n51-lamp"
              style={{ ["--c" as string]: linkDown ? "#ff3b30" : "#45CC2D" }}
              aria-hidden
            />
            {linkDown ? "LINK DOWN" : "LINK OK"}
          </span>
          <span className="tabular-nums">{stamp(now)}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* ── Main monitor: The Capsule ────────────────────────── */}
          <div>
            <div className="n51-bezel p-3 md:p-4">
              <div className="n51-crt n51-power px-6 py-7 md:px-10 md:py-9">
                <div className="relative z-10 n51-phosphor">

                  <h1 className="n51-wordmark">THE CAPSULE</h1>
                  <p className="text-[10px] md:text-[11px] tracking-[0.35em] mt-3 opacity-80 tabular-nums">
                    CMP-2026 // ARCHIVE {pad(stats.imprints, 6)}
                  </p>

                  {loading ? (
                    <p className="mt-10 mb-6 text-[11px] tracking-[0.3em] n51-cursor">INITIALIZING</p>
                  ) : linkDown ? (
                    <div className="mt-10 mb-6">
                      <p className="text-[11px] tracking-[0.3em]">NO CARRIER. THE ARCHIVE DID NOT RESPOND.</p>
                      <button onClick={load} className="n51-btn mt-4 text-[10px] tracking-[0.3em] underline underline-offset-4">
                        RETRY CONNECTION
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-8 max-w-md space-y-1.5 text-[11px] md:text-[12px] tracking-[0.18em]">
                        <Readout label="IMPRINTS"     value={pad(stats.imprints)} />
                        <Readout label="PHOTOGRAPHS"  value={pad(stats.photos)} />
                        <Readout label="VIDEO"        value={pad(stats.videos)} />
                        <Readout label="CONTRIBUTORS" value={`${stats.active} OF ${stats.cohort}`} />
                        {stats.attention > 0 && (
                          <Readout label="UNFINISHED" value={pad(stats.attention)} alert />
                        )}
                      </div>

                      {recent.length > 0 && (
                        <div className="mt-8 grid grid-cols-4 md:grid-cols-8 gap-2">
                          {recent.map(m => (
                            <button key={m.id} onClick={() => onNavigate("MEDIA")}
                              title={m.guest_name}
                              className="n51-btn aspect-square overflow-hidden rounded-[3px] border border-[#ffd0dc]/25">
                              <img src={m.thumb_url || ""} alt="" loading="lazy" className="n51-phosphor-img w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <button onClick={() => onNavigate("MEDIA")}
                    className="n51-btn n51-cta mt-9 px-7 py-3 text-[11px] font-bold tracking-[0.35em]">
                    OPEN THE CAPSULE
                  </button>
                </div>
              </div>
            </div>

            {/* ── Contributor lamps ──────────────────────────────── */}
            {contributors.length > 0 && (
              <div className="n51-panel mt-5 px-5 py-4">
                <div className="flex flex-wrap gap-2.5">
                  {contributors.map(c => {
                    const problems = problemsByGuest[c.id] || 0;
                    const color = problems > 0 ? "#ffb000" : c.upload_count > 0 ? "#45CC2D" : null;
                    const label = `${c.first_name} ${c.last_name}: ${
                      problems > 0 ? `${problems} unfinished` : c.upload_count > 0 ? `${c.upload_count} uploaded` : "nothing yet"
                    }`;
                    return (
                      <span key={c.id} title={label} aria-label={label}
                        className={`n51-lamp ${color ? "" : "n51-lamp-off"} ${problems > 0 ? "n51-blink" : ""}`}
                        style={color ? { ["--c" as string]: color } : undefined}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3.5 text-[8px] tracking-[0.2em] text-[#8a9296]">
                  <span className="flex items-center gap-1.5">
                    <span className="n51-lamp n51-lamp-sm" style={{ ["--c" as string]: "#45CC2D" }} aria-hidden /> CONTRIBUTED
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="n51-lamp n51-lamp-sm" style={{ ["--c" as string]: "#ffb000" }} aria-hidden /> NEEDS ATTENTION
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="n51-lamp n51-lamp-sm n51-lamp-off" aria-hidden /> NOTHING YET
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Secondary monitors ───────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <SideMonitor
              title="EYES ONLY"
              line={unread > 0 ? `${unread} UNREAD` : "INBOX CLEAR"}
              onClick={() => onNavigate("INBOX")}
            />
            <SideMonitor
              title="GUEST LIST"
              line={`${stats.cohort} IN THE CAPSULE COHORT`}
              onClick={() => onNavigate("GUESTS")}
            />
            <SideMonitor title="LODGING" line="EVENT CONCLUDED" dim onClick={() => onNavigate("LODGING")} />
            <SideMonitor title="SURVEYS" line="EVENT CONCLUDED" dim onClick={() => onNavigate("SURVEYS")} />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Michroma&display=swap');

        .n51-chassis {
          background:
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px) 0 0 / 120px 100%,
            linear-gradient(#1b1e20, #141618);
        }
        .n51-bezel {
          background: linear-gradient(#2b2f32, #1a1d1f);
          border-radius: 12px;
          padding: 10px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -2px 0 rgba(0,0,0,0.5), 0 2px 0 #000;
        }
        .n51-panel {
          background: #0c0d0e;
          border-radius: 8px;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.05);
        }

        /* Main CRT */
        .n51-crt {
          position: relative;
          overflow: hidden;
          border-radius: 22px / 26px;
          background: radial-gradient(ellipse at 50% 42%, #d4335a 0%, #b01e47 46%, #6e0b27 100%);
          box-shadow: inset 0 0 70px rgba(0,0,0,0.55), inset 0 0 14px rgba(0,0,0,0.6), 0 0 44px rgba(212,51,90,0.22);
        }
        .n51-crt::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 20;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 1px, transparent 1px 3px);
        }
        .n51-crt::after {
          content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 21;
          background: radial-gradient(ellipse at 28% 18%, rgba(255,255,255,0.10), transparent 55%);
        }
        .n51-phosphor { color: #ffe6ee; text-shadow: 0 0 6px rgba(255,205,220,0.55); }
        .n51-wordmark {
          font-family: 'Michroma', 'Eurostile', 'Arial Black', sans-serif;
          font-size: clamp(30px, 5.4vw, 66px);
          line-height: 1.05;
          letter-spacing: 0.04em;
          color: transparent;
          -webkit-text-stroke: 1.6px #fff1f5;
          text-shadow: none;
          filter: drop-shadow(0 0 6px rgba(255,210,225,0.65));
        }
        .n51-phosphor-img {
          filter: grayscale(1) sepia(1) saturate(4) hue-rotate(-42deg) contrast(1.05) brightness(0.95);
          mix-blend-mode: screen;
          transition: filter 300ms ease;
        }
        .n51-btn:hover .n51-phosphor-img, .n51-btn:focus-visible .n51-phosphor-img {
          filter: none; mix-blend-mode: normal;
        }
        .n51-cta {
          color: #6e0b27;
          background: #ffe6ee;
          box-shadow: 0 0 18px rgba(255,210,225,0.45);
          text-shadow: none;
        }
        .n51-cta:hover { background: #ffffff; box-shadow: 0 0 26px rgba(255,230,238,0.7); }
        .n51-alert-text { color: #ffd166; text-shadow: 0 0 6px rgba(255,209,102,0.6); }
        .n51-cursor::after { content: "_"; animation: n51-blink 1s steps(1) infinite; }

        /* Secondary CRTs: area51 green phosphor */
        .n51-crt-green {
          position: relative;
          border-radius: 10px / 12px;
          background: radial-gradient(ellipse at 50% 40%, #0b2a10 0%, #051407 70%, #020803 100%);
          box-shadow: inset 0 0 26px rgba(0,0,0,0.7);
          transition: opacity 300ms ease;
        }
        .n51-crt-green::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 3px);
        }
        .n51-green-text { color: #45CC2D; text-shadow: 0 0 6px rgba(69,204,45,0.55); position: relative; }
        .n51-btn:hover .n51-crt-green { box-shadow: inset 0 0 26px rgba(0,0,0,0.7), 0 0 14px rgba(69,204,45,0.25); }

        /* Indicator lamps */
        .n51-lamp {
          display: inline-block; width: 11px; height: 11px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0 12%, var(--c) 38%);
          box-shadow: 0 0 7px var(--c), inset 0 -2px 2px rgba(0,0,0,0.35);
        }
        .n51-lamp-sm { width: 7px; height: 7px; }
        .n51-lamp-off {
          background: radial-gradient(circle at 35% 30%, #3a3e41 0 20%, #202325 60%);
          box-shadow: inset 0 -1px 2px rgba(0,0,0,0.6);
        }
        .n51-blink { animation: n51-blink 2.4s ease-in-out infinite; }

        /* Power-on: the single orchestrated moment */
        .n51-power { animation: n51-on 900ms cubic-bezier(.2,.8,.2,1) both; transform-origin: center; }

        @keyframes n51-on {
          0%   { transform: scaleY(0.004) scaleX(0.55); filter: brightness(3); }
          40%  { transform: scaleY(0.004) scaleX(1);    filter: brightness(2.2); }
          100% { transform: none; filter: none; }
        }
        @keyframes n51-blink { 0%, 55% { opacity: 1; } 70%, 100% { opacity: 0.25; } }

        .n51-btn { cursor: pointer; }
        .n51-btn:focus-visible { outline: 2px solid #ffb000; outline-offset: 3px; border-radius: 12px; }

        @media (prefers-reduced-motion: reduce) {
          .n51-power, .n51-blink, .n51-cursor::after { animation: none; }
        }
      `}</style>
    </div>
  );
}