# Project Kumpas

Offline-first, voice-assisted ALS prototype for zero-literacy adult learners.

## Cebuano Voice Assets

The app plays pre-generated Cebuano Bisaya WAV files from `public/audio/ceb/` and falls back to browser speech synthesis only when a file is missing or cannot play.

Generate or refresh the voice files locally:

```bash
GEMINI_API_KEY=your_key npm run generate-audio
```

On Windows PowerShell:

```powershell
$env:GEMINI_API_KEY="your_key"
npm.cmd run generate-audio
```

The TTS script uses Gemini TTS `gemini-3.1-flash-tts-preview` through the Gemini API. The generated WAV files are static PWA assets, so the app remains offline-first at runtime. Do not put an API key in frontend code. If the default `Iapetus` voice is not accepted in native-speaker QA, set `GEMINI_TTS_VOICE` to another Gemini voice and regenerate with `npm.cmd run generate-audio -- --force`.

The generated AI voice should be disclosed in demo notes, and the Cebuano wording/pronunciation should be reviewed by a native speaker before a final demo. Rotate or restrict any API key that has been shared in chat or screen recordings.

Relevant Google documentation:

- Gemini TTS guide and REST request shape: https://ai.google.dev/gemini-api/docs/speech-generation
- Gemini supported voices and Cebuano language support: https://ai.google.dev/gemini-api/docs/speech-generation#voice-options
- Cloud Gemini-TTS model availability: https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
