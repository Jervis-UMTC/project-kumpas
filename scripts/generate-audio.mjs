import { mkdir, stat, writeFile, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geminiTtsConfig, voicePrompts } from '../src/audioPrompts.js';

const apiKey =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_TTS_API_KEY;
const force = process.argv.includes('--force');
const rootDir = fileURLToPath(new URL('..', import.meta.url));
const manifestPath = join(rootDir, 'public', 'audio', 'ceb', 'manifest.json');

if (!apiKey) {
  console.error(
    'GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_TTS_API_KEY is required to generate Cebuano audio files.',
  );
  process.exit(1);
}

const promptEntries = Object.entries(voicePrompts);
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

async function synthesizePrompt([id, prompt]) {
  const outputPath = join(rootDir, 'public', prompt.src.replace(/^\//, ''));

  await mkdir(dirname(outputPath), { recursive: true });

  if (!force) {
    try {
      const existing = await stat(outputPath);
      if (existing.size > 0) {
        let isTrueWav = false;
        try {
          const fd = await open(outputPath, 'r');
          const header = Buffer.alloc(4);
          await fd.read(header, 0, 4, 0);
          await fd.close();
          isTrueWav = header.toString('utf8') === 'RIFF';
        } catch (e) {
          // Ignore read errors, assume it's not a true WAV
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
    await writeFile(outputPath, createWaveBuffer(pcm));
    break;
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
      assets: promptEntries.map(([, prompt]) => prompt.src),
    },
    null,
    2,
  )}\n`,
);

console.log('Gemini 3.1 Cebuano audio generation complete.');
