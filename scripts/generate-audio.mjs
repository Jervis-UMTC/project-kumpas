import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geminiTtsConfig, voicePrompts } from '../src/audioPrompts.js';

const apiKey =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_TTS_API_KEY;
const force = process.argv.includes('--force');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const maxArg = process.argv.find((arg) => arg.startsWith('--max='));
const onlyIds = onlyArg
  ? onlyArg
      .slice('--only='.length)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  : null;
const maxRequests = maxArg ? Number(maxArg.slice('--max='.length)) : Infinity;
const rootDir = fileURLToPath(new URL('..', import.meta.url));
const manifestPath = join(rootDir, 'public', 'audio', 'ceb', 'manifest.json');

if (!apiKey) {
  console.error(
    'GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_TTS_API_KEY is required to generate Cebuano audio files.',
  );
  process.exit(1);
}

if (!Number.isFinite(maxRequests) && maxRequests !== Infinity) {
  console.error('--max must be a number.');
  process.exit(1);
}

const allPromptEntries = Object.entries(voicePrompts);
const promptEntries = onlyIds
  ? onlyIds.map((id) => {
      const prompt = voicePrompts[id];
      if (!prompt) {
        console.error(`Unknown prompt id: ${id}`);
        process.exit(1);
      }
      return [id, prompt];
    })
  : allPromptEntries;

if (promptEntries.length > maxRequests) {
  console.error(
    `Refusing to generate ${promptEntries.length} prompts because --max=${maxRequests}.`,
  );
  process.exit(1);
}

const selectedVoice = process.env.GEMINI_TTS_VOICE || geminiTtsConfig.voice;

function createWaveBuffer(
  pcm,
  {
    sampleRateHz = geminiTtsConfig.sampleRateHz,
    channels = geminiTtsConfig.channels,
    bitsPerSample = geminiTtsConfig.bitsPerSample,
  } = {},
) {
  const byteRate = (sampleRateHz * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRateHz, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

function buildPrompt(text) {
  return `${geminiTtsConfig.stylePrompt}\n\nTranscript:\n${text}`;
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

  if (!fmt) {
    return { ok: false, reason: 'missing fmt chunk' };
  }

  if (!dataBytes) {
    return { ok: false, reason: 'missing data chunk' };
  }

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

async function isValidWaveFile(outputPath) {
  const buffer = await readFile(outputPath);
  return readWaveInfo(buffer).ok;
}

async function synthesizePrompt([id, prompt]) {
  const outputPath = join(rootDir, 'public', prompt.src.replace(/^\//, ''));
  const tempPath = join(dirname(outputPath), `.${basename(outputPath)}.${Date.now()}.tmp`);

  await mkdir(dirname(outputPath), { recursive: true });

  if (!force) {
    try {
      const existing = await stat(outputPath);
      if (existing.size > 0) {
        let isTrueWav = false;
        try {
          isTrueWav = await isValidWaveFile(outputPath);
        } catch {
          isTrueWav = false;
        }

        if (isTrueWav) {
          console.log(`Skipping ${id}: ${prompt.src} already exists (Gemini HQ)`);
          return;
        } else {
          console.log(`Fallback detected for ${id}. Will attempt to upgrade to Gemini...`);
        }
      }
    } catch {
      // Missing files are generated below.
    }
  }

  console.log(`Generating ${id}: ${prompt.src}`);

  let retries = 5;
  let saved = false;
  while (retries > 0) {
    const response = await fetch(geminiTtsConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildPrompt(prompt.text),
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedVoice,
              },
            },
          },
        },
        model: geminiTtsConfig.model,
      }),
    });

    if (response.status === 429) {
      console.log(`Rate limit hit (429) for ${id}, waiting 30 seconds before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 30000));
      retries--;
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini TTS failed for ${id}: ${response.status} ${body}`);
    }

    const result = await response.json();
    const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error(`Gemini TTS returned no inline audio data for ${id}`);
    }

    const pcm = Buffer.from(audioData, 'base64');
    const waveBuffer = createWaveBuffer(pcm);
    const waveInfo = readWaveInfo(waveBuffer);

    if (!waveInfo.ok) {
      throw new Error(`Gemini TTS produced invalid WAV for ${id}: ${waveInfo.reason}`);
    }

    await writeFile(tempPath, waveBuffer);

    const tempInfo = readWaveInfo(await readFile(tempPath));
    if (!tempInfo.ok) {
      await rm(tempPath, { force: true });
      throw new Error(`Temporary WAV validation failed for ${id}: ${tempInfo.reason}`);
    }

    try {
      await rename(tempPath, outputPath);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      await rm(outputPath, { force: true });
      await rename(tempPath, outputPath);
    }

    console.log(`Saved ${id}: ${prompt.src} (${tempInfo.durationSeconds.toFixed(2)}s)`);
    saved = true;
    break;
  }

  await rm(tempPath, { force: true });
  if (!saved) {
    throw new Error(`Gemini TTS did not complete for ${id}; retry limit exhausted.`);
  }
}

for (const entry of promptEntries) {
  await synthesizePrompt(entry);
}

await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(
  manifestPath,
  `${JSON.stringify(
    {
      dialect: 'ceb-PH',
      provider: geminiTtsConfig.provider,
      endpoint: geminiTtsConfig.endpoint,
      model: geminiTtsConfig.model,
      targetLanguageCode: geminiTtsConfig.targetLanguageCode,
      voice: selectedVoice,
      container: geminiTtsConfig.container,
      sampleRateHz: geminiTtsConfig.sampleRateHz,
      channels: geminiTtsConfig.channels,
      bitsPerSample: geminiTtsConfig.bitsPerSample,
      stylePrompt: geminiTtsConfig.stylePrompt,
      needsNativeSpeakerReview: true,
      assets: allPromptEntries.map(([, prompt]) => prompt.src),
    },
    null,
    2,
  )}\n`,
);

console.log('Gemini 3.1 Cebuano audio generation complete.');
