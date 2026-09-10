import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PatternScramble } from './components/UI/PatternScramble';
import { CYBERPUNK_THEME } from './constants/themes';

// ─── Types ───────────────────────────────────────────────────────────────────

type MediaItem = {
  id: string;
  kind: 'image' | 'video';
  status: string;
  thumb_url: string | null;
  display_url: string | null;
  original_url: string | null;
  width: number | null;
  height: number | null;
  taken_at: string | null;
  filename: string | null;
  duration_s: number | null;
};

type QueueItem = {
  file: File;
  sha256: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'duplicate' | 'error';
  progress: number;
  error?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sha256Hex(file: File): Promise<string> {
  const buf  = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const isHeic = (f: File) =>
  /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

async function convertHeic(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default as any;
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const out  = Array.isArray(blob) ? blob[0] : blob;
  return new File(
    [out],
    file.name.replace(/\.hei[cf]$/i, '.jpg'),
    { type: 'image/jpeg', lastModified: file.lastModified }
  );
}

function uploadWithProgress(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300)
      ? resolve()
      : reject(new Error(`HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error('NETWORK_FAULT'));
    xhr.send(file);
  });
}

// ─── Access denied panel ─────────────────────────────────────────────────────

function NoAccessPanel() {
  const [email, setEmail]           = useState('');
  const [sent, setSent]             = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRelink = async () => {
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/v1/auth/artifact-relink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch { /* always report sent */ }
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 font-mono">
      <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" />

      <div className="relative w-full max-w-md bg-gradient-to-br from-white/10 to-transparent
        border border-white/20 rounded-[40px] shadow-[0_0_100px_rgba(170,0,255,0.15)]
        p-10 overflow-hidden backdrop-blur-xl">

        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-[#aa00ff]/15 blur-[80px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-[#00ffff]/10 blur-[80px] rounded-full animate-pulse" />

        <div className="relative z-10 flex flex-col items-center">
          <h3 className="text-[#aa00ff] text-[10px] tracking-[0.8em] uppercase mb-10 text-center opacity-80">
            <PatternScramble text="ARCHIVE_LOCKED" {...CYBERPUNK_THEME} startTrigger={true} />
          </h3>

          <div className="w-full mb-8">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-md text-center">
              {sent ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-[#39FF14] uppercase tracking-[0.3em] animate-biopulse-green">
                    <PatternScramble text="TRANSMISSION_DISPATCHED" {...CYBERPUNK_THEME} startTrigger={sent} />
                  </p>
                  <p className="text-white/50 text-[9px] uppercase tracking-widest leading-relaxed">
                    If coordinates are on file, check your archive.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#aa00ff]/80 uppercase tracking-[0.3em]">
                      <PatternScramble text="AUTHENTICATION_REQUIRED" {...CYBERPUNK_THEME} startTrigger={true} />
                    </p>
                    <p className="text-white/50 text-[9px] uppercase tracking-widest leading-relaxed">
                      Archive access requires your unique link.<br />
                      Check your transmission archive.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[8px] text-[#00ffff]/40 uppercase tracking-[0.4em]">
                      // Input Relink Coordinates
                    </p>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRelink()}
                      placeholder="ENTER_EMAIL_VECTOR"
                      disabled={submitting}
                      className="w-full bg-black/40 border border-[#aa00ff]/30 text-[#00ffff]
                        px-4 py-3 rounded-lg text-[10px] tracking-widest placeholder:text-white/20
                        focus:outline-none focus:border-[#00ffff]/60 focus:bg-white/5
                        transition-all duration-300 text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {!sent && (
            <button
              onClick={handleRelink}
              disabled={submitting}
              className={`w-full py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.5em]
                transition-all duration-700
                ${submitting
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-white/90 text-black hover:bg-[#aa00ff] hover:text-white hover:shadow-[0_0_30px_rgba(170,0,255,0.6)]'
                }`}
            >
              {submitting ? '[ DISPATCHING... ]' : '[ REQUEST_NEW_LINK ]'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function UploadPortal() {
  const [token, setToken]         = useState<string | null>(null);
  const [ready, setReady]         = useState(false);
  const [guestName, setGuestName] = useState('');
  const [mine, setMine]           = useState<MediaItem[]>([]);
  const [queue, setQueue]         = useState<QueueItem[]>([]);
  const [lightbox, setLightbox]   = useState<MediaItem | null>(null);
  const [authError, setAuthError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url      = new URL(window.location.href);
    const urlToken = url.searchParams.get('token');
    if (urlToken) {
      localStorage.setItem('artifact_token', urlToken);
      window.history.replaceState({}, '', '/upload');
      setToken(urlToken);
    } else {
      setToken(localStorage.getItem('artifact_token'));
    }
    setReady(true);
  }, []);

  const loadMine = useCallback(async (t: string) => {
    try {
      const res = await fetch(`/api/v1/upload/mine?token=${encodeURIComponent(t)}`);
      if (res.status === 401) { setAuthError(true); return; }
      const data = await res.json();
      setMine(data.media || []);
      setGuestName(data.guest?.first_name || '');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (token) loadMine(token); }, [token, loadMine]);

  useEffect(() => {
    if (!token) return;
    if (!mine.some(m => m.status === 'processing')) return;
    const id = setTimeout(() => loadMine(token), 3000);
    return () => clearTimeout(id);
  }, [mine, token, loadMine]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !token) return;

    let list = Array.from(files);

    const converted: File[] = [];
    for (const f of list) {
      if (isHeic(f)) {
        try { converted.push(await convertHeic(f)); }
        catch { converted.push(f); }
      } else converted.push(f);
    }
    list = converted;

    const items: QueueItem[] = [];
    for (const file of list) {
      items.push({ file, sha256: await sha256Hex(file), status: 'pending', progress: 0 });
    }
    setQueue(q => [...q, ...items]);

    for (const item of items) {
      const mark = (patch: Partial<QueueItem>) =>
        setQueue(q => q.map(x => x.sha256 === item.sha256 ? { ...x, ...patch } : x));

      try {
        mark({ status: 'uploading' });

        const pres = await fetch('/api/v1/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            sha256: item.sha256,
            filename: item.file.name,
            mime: item.file.type || 'application/octet-stream',
            bytes: item.file.size,
          }),
        }).then(r => r.json());

        if (pres.error)     { mark({ status: 'error', error: pres.error }); continue; }
        if (pres.duplicate) { mark({ status: 'duplicate', progress: 1 });   continue; }

        await uploadWithProgress(pres.put_url, item.file, p => mark({ progress: p }));
        mark({ status: 'processing', progress: 1 });

        await fetch('/api/v1/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, media_id: pres.media_id }),
        });

        mark({ status: 'done' });
      } catch (e: any) {
        mark({ status: 'error', error: e?.message || 'FAILED' });
      }
    }

    await loadMine(token);
    setTimeout(() => setQueue([]), 4000);
  };

  if (!ready) return <div className="fixed inset-0 bg-[#020617]" />;
  if (!token || authError) return <NoAccessPanel />;

  const active = queue.filter(q => q.status !== 'done' && q.status !== 'duplicate');
  const dupes  = queue.filter(q => q.status === 'duplicate');
  const busy   = active.length > 0;

  return (
    <div className="min-h-screen bg-[#020617] font-mono relative overflow-x-hidden">

      {/* Ambient field */}
      <div className="fixed top-[-10%] left-[-15%] w-[500px] h-[500px] bg-[#aa00ff]/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-15%] w-[500px] h-[500px] bg-[#00ffff]/8 blur-[120px] rounded-full animate-pulse pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 md:py-20">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="text-[9px] tracking-[0.6em] uppercase text-[#aa00ff]/70 mb-6">
            <PatternScramble text="/// CACTUS_MAKES_PERFECT ///" {...CYBERPUNK_THEME} startTrigger={true} />
          </div>

          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] italic uppercase
            text-white leading-none mb-6">
            The <span className="text-[#00ffff] drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">Capsule</span>
          </h1>

          <p className="text-white/40 text-[9px] uppercase tracking-[0.25em] leading-relaxed max-w-sm">
            {guestName && (
              <span className="text-[#39FF14]/70 animate-biopulse-green">{guestName}</span>
            )}
            {guestName && <br />}
            Deposit your imprints of the weekend.<br />
            The archive persists.
          </p>
        </div>

        {/* ── Upload console ── */}
        <div className="bg-gradient-to-br from-white/10 to-transparent border border-white/20
          rounded-[40px] shadow-[0_0_80px_rgba(170,0,255,0.12)] p-8 md:p-10
          backdrop-blur-xl overflow-hidden mb-10">

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={e => { handleFiles(e.target.files); e.currentTarget.value = ''; }}
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={`w-full py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.5em]
              transition-all duration-700
              ${busy
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : 'bg-white/90 text-black hover:bg-[#aa00ff] hover:text-white hover:shadow-[0_0_30px_rgba(170,0,255,0.6)]'
              }`}
          >
            {busy ? '[ TRANSMITTING... ]' : '[ SELECT_IMPRINTS ]'}
          </button>

          <p className="text-white/20 text-[8px] uppercase tracking-[0.3em] text-center mt-4 leading-relaxed">
            Photos & video // Phone or terminal // Multi-select supported
          </p>

          {/* Queue */}
          {active.length > 0 && (
            <div className="mt-8 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md p-5 space-y-3">
              <p className="text-[8px] text-[#00ffff]/40 uppercase tracking-[0.4em] mb-1">
                // Uplink Queue [{active.length}]
              </p>
              {active.map(q => (
                <div key={q.sha256} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-white/40 text-[9px] tracking-wider truncate flex-1">
                      {q.file.name}
                    </span>
                    <span className={`text-[8px] uppercase tracking-[0.2em] shrink-0
                      ${q.status === 'error' ? 'text-[#ff0055]' : 'text-[#00ffff]'}`}>
                      {q.status === 'uploading'  && `${Math.round(q.progress * 100)}%`}
                      {q.status === 'processing' && 'RENDERING'}
                      {q.status === 'pending'    && 'QUEUED'}
                      {q.status === 'error'      && (q.error || 'FAULT')}
                    </span>
                  </div>
                  <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full
                        ${q.status === 'error' ? 'bg-[#ff0055]' : 'bg-[#00ffff] shadow-[0_0_8px_#00ffff]'}`}
                      style={{ width: `${q.progress * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Duplicates */}
          {dupes.length > 0 && (
            <div className="mt-6 bg-[#39FF14]/5 rounded-2xl border border-[#39FF14]/20 p-5 text-center">
              <p className="text-[9px] text-[#39FF14]/80 uppercase tracking-[0.3em] animate-biopulse-green">
                {dupes.length} DUPLICATE{dupes.length > 1 ? 'S' : ''} DETECTED
              </p>
              <p className="text-white/30 text-[8px] uppercase tracking-widest mt-2">
                Already in the archive — transmission skipped.
              </p>
            </div>
          )}
        </div>

        {/* ── Archive grid ── */}
        <div className="flex items-baseline justify-between mb-6 px-2">
          <span className="text-[9px] text-[#aa00ff]/60 uppercase tracking-[0.4em]">
            <PatternScramble text="YOUR_IMPRINTS" {...CYBERPUNK_THEME} startTrigger={true} />
          </span>
          <span className="text-[#00ffff] text-[10px] tracking-[0.2em] animate-biopulse-cyan">
            {String(mine.length).padStart(3, '0')}
          </span>
        </div>

        {mine.length === 0 ? (
          <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md py-16 text-center">
            <p className="text-white/20 text-[9px] uppercase tracking-[0.4em] italic">
              No signal detected
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {mine.map(m => (
              <button
                key={m.id}
                onClick={() => m.status === 'ready' && setLightbox(m)}
                className="group relative aspect-square rounded-2xl overflow-hidden
                  bg-white/5 border border-white/10 backdrop-blur-md
                  hover:border-[#00ffff]/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]
                  transition-all duration-500"
              >
                {m.kind === 'video' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#aa00ff]/60">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-[7px] tracking-[0.3em] uppercase opacity-50">Video</span>
                  </div>
                ) : m.thumb_url ? (
                  <img
                    src={m.thumb_url}
                    loading="lazy"
                    alt=""
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100
                      group-hover:scale-105 transition-all duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[8px] text-[#00ffff]/40 tracking-[0.3em] uppercase animate-pulse">
                      {m.status === 'processing' ? '···' : 'ERR'}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <p className="text-center text-white/15 text-[8px] uppercase tracking-[0.35em] mt-16 leading-relaxed">
          Bookmark this vector — it is yours alone.<br />
          Return anytime to deposit more.
        </p>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[11000] flex flex-col items-center justify-center p-4 font-mono"
          onClick={() => setLightbox(null)}
        >
          <div className="absolute inset-0 bg-[#020617]/97 backdrop-blur-2xl" />
          <div className="relative z-10 flex flex-col items-center max-w-4xl w-full">
            {lightbox.kind === 'video' ? (
              <video
                src={lightbox.original_url || ''}
                controls
                autoPlay
                onClick={e => e.stopPropagation()}
                className="max-w-full max-h-[80vh] rounded-2xl border border-white/10
                  shadow-[0_0_60px_rgba(0,255,255,0.15)]"
              />
            ) : (
              <img
                src={lightbox.display_url || ''}
                alt=""
                onClick={e => e.stopPropagation()}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl
                  border border-white/10 shadow-[0_0_60px_rgba(170,0,255,0.2)]"
              />
            )}
            <p className="text-white/25 text-[8px] uppercase tracking-[0.5em] mt-6">
              [ TAP_TO_DISCONNECT ]
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes biopulse-green {
          0%, 100% { opacity: 0.5; text-shadow: 0 0 0px rgba(57,255,20,0); }
          50%      { opacity: 1;   text-shadow: 0 0 8px rgba(57,255,20,0.8); }
        }
        @keyframes biopulse-cyan {
          0%, 100% { opacity: 0.5; text-shadow: 0 0 0px rgba(0,255,255,0); }
          50%      { opacity: 1;   text-shadow: 0 0 8px rgba(0,255,255,0.8); }
        }
        .animate-biopulse-green { animation: biopulse-green 4s ease-in-out infinite; }
        .animate-biopulse-cyan  { animation: biopulse-cyan  4s ease-in-out infinite; animation-delay: 2s; }
      `}</style>
    </div>
  );
}