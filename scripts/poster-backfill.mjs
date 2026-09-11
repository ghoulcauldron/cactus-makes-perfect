#!/usr/bin/env node
// Usage: node poster-backfill.mjs <admin_password> [local_video_dir]
//
// Generates poster frames for any video in the archive that lacks one.
// If local_video_dir is given, matching files there are used directly;
// otherwise the original is pulled from R2 (free egress).

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { tmpdir } from 'node:os';

const run  = promisify(execFile);
const BASE = 'https://www.cactusmakesperfect.org';
const [, , PASSWORD, LOCAL_DIR] = process.argv;

if (!PASSWORD) {
  console.error('Usage: node poster-backfill.mjs <admin_password> [local_video_dir]');
  process.exit(1);
}

// --- auth ---
const login = await fetch(`${BASE}/api/v1/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: PASSWORD }),
}).then(r => r.json());

if (!login.token) { console.error('Login failed:', login); process.exit(1); }
const AUTH = { Authorization: `Bearer ${login.token}` };

const api = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { ...AUTH, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());

// --- index local files by name, if a dir was given ---
let localIndex = new Map();
if (LOCAL_DIR) {
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (/\.(mp4|mov|m4v|avi|webm)$/i.test(e.name)) {
        localIndex.set(e.name.toLowerCase(), full);
      }
    }
  };
  await walk(LOCAL_DIR);
  console.log(`Indexed ${localIndex.size} local video files\n`);
}

// --- fetch work list ---
const { pending } = await api('/api/v1/admin/media/pending-posters');
console.log(`${pending.length} video(s) missing posters\n`);

let done = 0, failed = 0;

for (const [i, v] of pending.entries()) {
  const name = v.original_filename || v.id;
  const tag  = `[${i + 1}/${pending.length}] ${name}`;
  const tmpVideo  = join(tmpdir(), `cmp-${v.id}${extname(name) || '.mp4'}`);
  const tmpPoster = join(tmpdir(), `cmp-${v.id}.jpg`);
  let usedTmp = false;

  try {
    // Locate source: local file if we have it, else pull from R2
    let source = LOCAL_DIR ? localIndex.get(basename(name).toLowerCase()) : null;

    if (!source) {
      process.stdout.write(`${tag} — downloading... `);
      const buf = Buffer.from(await fetch(v.original_url).then(r => r.arrayBuffer()));
      await writeFile(tmpVideo, buf);
      source = tmpVideo;
      usedTmp = true;
    } else {
      process.stdout.write(`${tag} — local `);
    }

    // Probe for dimensions + duration
    let width = null, height = null, duration = null;
    try {
      const { stdout } = await run('ffprobe', [
        '-v', 'quiet', '-print_format', 'json',
        '-show_format', '-show_streams', source,
      ]);
      const probe = JSON.parse(stdout);
      const vs = (probe.streams || []).find(s => s.codec_type === 'video');
      if (vs) { width = vs.width; height = vs.height; }
      duration = parseFloat(probe.format?.duration) || null;
    } catch { /* non-fatal */ }

    // Poster frame at 1s (or 0s for very short clips)
    const seek = (duration && duration < 1.5) ? '0' : '1';
    await run('ffmpeg', [
      '-y', '-ss', seek, '-i', source,
      '-frames:v', '1',
      '-vf', 'scale=400:400:force_original_aspect_ratio=decrease',
      '-q:v', '3',
      tmpPoster,
    ]);

    // Upload
    const pres = await api('/api/v1/admin/media/poster-presign', { media_id: v.id });
    if (!pres.put_url) throw new Error(pres.error || 'presign failed');

    const posterBuf = await readFile(tmpPoster);
    const put = await fetch(pres.put_url, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: posterBuf,
    });
    if (!put.ok) throw new Error(`R2 PUT ${put.status}`);

    await api('/api/v1/admin/media/poster-complete', {
      media_id: v.id, key: pres.key,
      width, height, duration_s: duration,
    });

    const dur = duration ? `${duration.toFixed(1)}s` : '?';
    console.log(`— poster created (${width}x${height}, ${dur})`);
    done++;
  } catch (e) {
    console.log(`— FAILED: ${e.message}`);
    failed++;
  } finally {
    await unlink(tmpPoster).catch(() => {});
    if (usedTmp) await unlink(tmpVideo).catch(() => {});
  }
}

console.log(`\nPosters created: ${done} · Failed: ${failed}`);