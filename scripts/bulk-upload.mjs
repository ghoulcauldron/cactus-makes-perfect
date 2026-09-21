#!/usr/bin/env node
// Usage: node bulk-upload.mjs <token> <directory>

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';

const BASE = 'https://www.cactusmakesperfect.org';
const [, , TOKEN, DIR] = process.argv;

if (!TOKEN || !DIR) {
  console.error('Usage: node bulk-upload.mjs <artifact_token> <directory>');
  process.exit(1);
}

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.heic': 'image/heic',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v',
  '.avi': 'video/x-msvideo', '.webm': 'video/webm',
};

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (MIME[extname(entry.name).toLowerCase()]) out.push(full);
  }
  return out;
}

const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json());

const files = await walk(DIR);
console.log(`Found ${files.length} media files in ${DIR}\n`);

let done = 0, dupes = 0, failed = 0;

for (const [i, path] of files.entries()) {
  const name = basename(path);
  const tag  = `[${String(i + 1).padStart(4)}/${files.length}] ${name}`;

  try {
    const buf   = await readFile(path);
    const info  = await stat(path);
    const hash  = createHash('sha256').update(buf).digest('hex');
    const mime  = MIME[extname(path).toLowerCase()];

    const pres = await post('/api/v1/upload/presign', {
      token: TOKEN, sha256: hash, filename: name, mime, bytes: info.size,
    });

    if (pres.error)     { console.log(`${tag} — ERROR: ${pres.error}`); failed++; continue; }
    if (pres.duplicate) { console.log(`${tag} — already in archive`);   dupes++;  continue; }

    const put = await fetch(pres.put_url, {
      method: 'PUT',
      headers: { 'Content-Type': mime },
      body: buf,
    });
    if (!put.ok) throw new Error(`R2 PUT ${put.status}`);

    await post('/api/v1/upload/complete', { token: TOKEN, media_id: pres.media_id });

    const mb = (info.size / 1048576).toFixed(1);
    console.log(`${tag} — uploaded (${mb} MB)`);
    done++;
  } catch (e) {
    console.log(`${tag} — FAILED: ${e.message}`);
    failed++;
  }
}

console.log(`\nUploaded ${done} · Skipped ${dupes} duplicates · Failed ${failed}`);