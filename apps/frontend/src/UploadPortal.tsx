import React, { useState, useEffect, useCallback, useRef } from 'react';

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

// Convert HEIC → JPEG in the browser. Loaded lazily so the library
// only downloads for users who actually need it.
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
      : reject(new Error(`Upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(file);
  });
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#000', accent: '#aa00ff', cyan: '#00ffff',
  text: '#e0d0ff', dim: 'rgba(224,208,255,0.5)',
  mono: "'Courier New', Courier, monospace",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function UploadPortal() {
  const [token, setToken]       = useState<string | null>(null);
  const [ready, setReady]       = useState(false);
  const [guestName, setGuestName] = useState<string>('');
  const [mine, setMine]         = useState<MediaItem[]>([]);
  const [queue, setQueue]       = useState<QueueItem[]>([]);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [authError, setAuthError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Token resolution: URL param → localStorage
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

  // Poll while anything is still processing
  useEffect(() => {
    if (!token) return;
    if (!mine.some(m => m.status === 'processing')) return;
    const id = setTimeout(() => loadMine(token), 3000);
    return () => clearTimeout(id);
  }, [mine, token, loadMine]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !token) return;

    let list = Array.from(files);

    // HEIC → JPEG before hashing, so the hash matches what we store
    const converted: File[] = [];
    for (const f of list) {
      if (isHeic(f)) {
        try { converted.push(await convertHeic(f)); }
        catch { converted.push(f); }
      } else {
        converted.push(f);
      }
    }
    list = converted;

    const items: QueueItem[] = [];
    for (const file of list) {
      items.push({ file, sha256: await sha256Hex(file), status: 'pending', progress: 0 });
    }
    setQueue(q => [...q, ...items]);

    // Sequential upload keeps memory and connections sane on mobile
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
        mark({ status: 'error', error: e?.message || 'Failed' });
      }
    }

    await loadMine(token);
    setTimeout(() => setQueue([]), 4000);
  };

  // ── No token ──
  if (ready && (!token || authError)) {
    return (
      <div style={{ ...s.page, justifyContent: 'center' }}>
        <div style={s.card}>
          <div style={s.kicker}>/// ACCESS REQUIRED ///</div>
          <p style={s.body}>
            This portal needs your unique link.<br />
            Check your email for the transmission.
          </p>
          <p style={{ ...s.body, fontSize: 11, opacity: 0.5, marginTop: 20 }}>
            Lost it? Email <span style={{ color: C.cyan }}>eyesonly@cactusmakesperfect.org</span><br />
            with subject <span style={{ color: C.cyan }}>upload</span> and we'll resend it.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) return <div style={{ background: C.bg, minHeight: '100vh' }} />;

  const active = queue.filter(q => q.status !== 'done' && q.status !== 'duplicate');
  const dupes  = queue.filter(q => q.status === 'duplicate');

  return (
    <div style={s.page}>
      <div style={s.inner}>

        <div style={s.kicker}>/// CACTUS MAKES PERFECT ///</div>
        <h1 style={s.h1}>THE TIME CAPSULE</h1>
        <p style={s.body}>
          {guestName ? `${guestName.toUpperCase()}, ` : ''}
          add your photos and videos from the weekend.
          Everything you upload becomes part of the shared archive.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => { handleFiles(e.target.files); e.currentTarget.value = ''; }}
        />

        <button style={s.cta} onClick={() => fileRef.current?.click()}>
          + SELECT PHOTOS &amp; VIDEOS
        </button>

        {/* Upload queue */}
        {active.length > 0 && (
          <div style={s.queue}>
            {active.map(q => (
              <div key={q.sha256} style={s.queueRow}>
                <span style={s.queueName}>{q.file.name}</span>
                <span style={s.queueStatus}>
                  {q.status === 'uploading'  && `${Math.round(q.progress * 100)}%`}
                  {q.status === 'processing' && 'PROCESSING'}
                  {q.status === 'pending'    && 'QUEUED'}
                  {q.status === 'error'      && (q.error || 'FAILED')}
                </span>
              </div>
            ))}
          </div>
        )}

        {dupes.length > 0 && (
          <div style={s.note}>
            {dupes.length} file{dupes.length > 1 ? 's were' : ' was'} already
            in the archive — skipped, no need to re-upload.
          </div>
        )}

        {/* Existing uploads */}
        <div style={s.countRow}>
          <span>YOUR UPLOADS</span>
          <span style={{ color: C.cyan }}>{mine.length}</span>
        </div>

        {mine.length === 0 ? (
          <p style={{ ...s.body, opacity: 0.4, textAlign: 'center', padding: '40px 0' }}>
            Nothing yet.
          </p>
        ) : (
          <div style={s.grid}>
            {mine.map(m => (
              <div key={m.id} style={s.tile} onClick={() => m.status === 'ready' && setLightbox(m)}>
                {m.kind === 'video' ? (
                  <div style={s.videoTile}>
                    <div style={{ fontSize: 24 }}>▶</div>
                    <div style={{ fontSize: 8, letterSpacing: 1, marginTop: 4 }}>VIDEO</div>
                  </div>
                ) : m.thumb_url ? (
                  <img src={m.thumb_url} loading="lazy" style={s.tileImg} alt="" />
                ) : (
                  <div style={s.videoTile}>
                    <div style={{ fontSize: 9 }}>
                      {m.status === 'processing' ? '···' : '!'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div style={s.lightbox} onClick={() => setLightbox(null)}>
          {lightbox.kind === 'video' ? (
            <video src={lightbox.original_url || ''} controls style={s.lightboxMedia} />
          ) : (
            <img src={lightbox.display_url || ''} style={s.lightboxMedia} alt="" />
          )}
          <div style={s.lightboxClose}>TAP TO CLOSE</div>
        </div>
      )}
    </div>
  );
}

// ─── Inline styles ───────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    background: C.bg, minHeight: '100vh', color: C.text,
    fontFamily: C.mono, display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '32px 16px 64px',
  },
  inner:  { width: '100%', maxWidth: 720 },
  card:   { border: `2px solid ${C.accent}`, padding: 36, maxWidth: 400, textAlign: 'center' },
  kicker: { fontSize: 10, letterSpacing: 4, opacity: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  h1:     { fontSize: 24, letterSpacing: 4, margin: '0 0 16px', color: '#fff', fontWeight: 700 },
  body:   { fontSize: 13, lineHeight: 1.7, margin: '0 0 24px' },
  cta: {
    width: '100%', background: C.accent, color: '#000', border: 'none',
    padding: '18px 24px', fontFamily: C.mono, fontWeight: 700, fontSize: 13,
    letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase',
  },
  queue:      { marginTop: 20, border: `1px solid ${C.accent}`, padding: 12 },
  queueRow:   { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, padding: '4px 0' },
  queueName:  { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, opacity: 0.7 },
  queueStatus:{ color: C.cyan, whiteSpace: 'nowrap' },
  note: {
    marginTop: 16, padding: 12, border: `1px dashed ${C.cyan}`,
    fontSize: 11, lineHeight: 1.6, color: C.cyan,
  },
  countRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 40, paddingBottom: 8, borderBottom: `1px solid ${C.accent}`,
    fontSize: 11, letterSpacing: 2,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: 6, marginTop: 16,
  },
  tile: {
    aspectRatio: '1', background: '#0a0a0a', border: '1px solid rgba(170,0,255,0.3)',
    overflow: 'hidden', cursor: 'pointer',
  },
  tileImg:   { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  videoTile: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', color: C.accent,
  },
  lightbox: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: 20, cursor: 'pointer',
  },
  lightboxMedia: { maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' },
  lightboxClose: { marginTop: 16, fontSize: 10, letterSpacing: 3, opacity: 0.5 },
};