import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geminiTtsConfig, voicePrompts } from '../src/audioPrompts.js';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const requiredAudioIds = [
  'splash.start',
  'login.user',
  'menu.start',
  'lesson.label',
  'test.label',
  'lesson.medicine',
  'test.medicine',
  'voice.read',
  'success.good',
];
const imageManifestPath = join(rootDir, 'public', 'images', 'medicine', 'manifest.json');

function resolvePublicPath(assetPath) {
  return join(rootDir, 'public', assetPath.replace(/^\//, ''));
}

function readWaveInfo(buffer) {
  if (buffer.length < 44) {
    return { ok: false, reason: 'file is too small' };
  }

  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return { ok: false, reason: 'missing RIFF/WAVE header' };
  }

  let offset = 12;
  let fmt = null;
  let dataBytes = null;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;

    if (id === 'fmt ') {
      fmt = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRateHz: buffer.readUInt32LE(start + 4),
        byteRate: buffer.readUInt32LE(start + 8),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      };
    }

    if (id === 'data') {
      dataBytes = length;
    }

    offset = start + length + (length % 2);
  }

  if (!fmt) return { ok: false, reason: 'missing fmt chunk' };
  if (!dataBytes) return { ok: false, reason: 'missing data chunk' };

  const durationSeconds = dataBytes / fmt.byteRate;
  const ok =
    fmt.audioFormat === 1 &&
    fmt.channels === geminiTtsConfig.channels &&
    fmt.sampleRateHz === geminiTtsConfig.sampleRateHz &&
    fmt.bitsPerSample === geminiTtsConfig.bitsPerSample &&
    durationSeconds > 0.25;

  return {
    ok,
    durationSeconds,
    reason: ok ? '' : 'unexpected WAV format or duration',
    ...fmt,
  };
}

function detectImageType(buffer, assetPath) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png';
  }
  if (assetPath.endsWith('.svg') && buffer.toString('utf8', 0, 256).includes('<svg')) return 'svg';
  return null;
}

async function auditAudio() {
  const failures = [];
  const rows = [];

  for (const id of requiredAudioIds) {
    const prompt = voicePrompts[id];
    if (!prompt) {
      failures.push(`Missing prompt id: ${id}`);
      continue;
    }

    const assetPath = resolvePublicPath(prompt.src);
    let buffer;
    try {
      buffer = await readFile(assetPath);
    } catch {
      failures.push(`Missing audio file: ${prompt.src}`);
      continue;
    }

    const info = readWaveInfo(buffer);
    rows.push({
      id,
      src: prompt.src,
      ok: info.ok,
      seconds: info.durationSeconds ? info.durationSeconds.toFixed(2) : 'n/a',
      reason: info.reason,
    });

    if (!info.ok) {
      failures.push(`Invalid audio ${prompt.src}: ${info.reason}`);
    }
  }

  return { failures, rows };
}

async function auditImages() {
  const failures = [];
  let manifest;

  try {
    manifest = JSON.parse(await readFile(imageManifestPath, 'utf8'));
  } catch (error) {
    return { failures: [`Could not read image manifest: ${error.message}`], rows: [] };
  }

  if (!Array.isArray(manifest.assets)) {
    return { failures: ['Image manifest must contain an assets array.'], rows: [] };
  }

  const rows = [];

  for (const asset of manifest.assets) {
    if (!asset.startsWith('/images/medicine/')) {
      failures.push(`Image asset must be local to medicine folder: ${asset}`);
      continue;
    }

    if (/^https?:\/\//i.test(asset)) {
      failures.push(`Remote image asset is not allowed: ${asset}`);
      continue;
    }

    const filePath = resolvePublicPath(asset);
    let buffer;
    let fileStat;
    try {
      fileStat = await stat(filePath);
      buffer = await readFile(filePath);
    } catch {
      failures.push(`Missing image file: ${asset}`);
      continue;
    }

    const type = detectImageType(buffer, asset);
    rows.push({ asset, type: type ?? 'unknown', bytes: fileStat.size });

    if (!type) {
      failures.push(`Unsupported image format: ${asset}`);
    }

    if (fileStat.size < 100) {
      failures.push(`Image file is too small: ${asset}`);
    }
  }

  return { failures, rows };
}

const audio = await auditAudio();
const images = await auditImages();
const failures = [...audio.failures, ...images.failures];

console.table(audio.rows);
console.table(images.rows);

if (failures.length > 0) {
  console.error('\nDemo asset audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nDemo asset audit passed.');
