import { writeFile, stat, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import googleTTS from 'google-tts-api';
import { voicePrompts } from '../src/audioPrompts.js';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

async function generateMissing() {
  for (const [id, prompt] of Object.entries(voicePrompts)) {
    const outputPath = join(rootDir, 'public', prompt.src.replace(/^\//, ''));
    
    try {
      const existing = await stat(outputPath);
      if (existing.size > 0) {
        console.log(`Skipping ${id}: already exists`);
        continue;
      }
    } catch {
      // Missing file
    }

    console.log(`Generating fallback for ${id}...`);
    try {
      await mkdir(dirname(outputPath), { recursive: true });
      const base64Audio = await googleTTS.getAudioBase64(prompt.text, {
        lang: 'tl',
        slow: false,
        host: 'https://translate.google.com',
      });
      const buffer = Buffer.from(base64Audio, 'base64');
      await writeFile(outputPath, buffer);
      console.log(`Success: ${id}`);
    } catch (e) {
      console.error(`Failed to generate ${id}:`, e.message);
    }
  }
}

generateMissing().then(() => console.log('Done!'));
