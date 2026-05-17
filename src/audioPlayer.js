import { voicePrompts } from './audioPrompts.js';

let currentAudio;
const listeners = new Set();
let state = { isPlaying: false, isPaused: false };

function setState(newState) {
  state = { ...state, ...newState };
  listeners.forEach((listener) => listener(state));
}

export function subscribeAudioState(listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function stopPrompt() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio.load();
    currentAudio = undefined;
  }
  stopSpeech();
  setState({ isPlaying: false, isPaused: false });
}

export function pausePrompt() {
  if (currentAudio) {
    currentAudio.pause();
    setState({ isPlaying: false, isPaused: true });
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
    setState({ isPlaying: false, isPaused: true });
  }
}

export function resumePrompt() {
  if (currentAudio) {
    currentAudio.play();
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
    setState({ isPlaying: true, isPaused: false });
  }
}

function playSpeechFallback(text) {
  if (!('speechSynthesis' in window) || !text) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ceb-PH';
  utterance.rate = 0.78;
  utterance.pitch = 1;

  utterance.onstart = () => setState({ isPlaying: true, isPaused: false });
  utterance.onend = () => setState({ isPlaying: false, isPaused: false });
  utterance.onerror = () => setState({ isPlaying: false, isPaused: false });

  window.speechSynthesis.speak(utterance);
}

export function playPrompt(promptId) {
  const prompt = voicePrompts[promptId];

  if (!prompt) {
    return;
  }

  stopPrompt();

  const audio = new Audio(prompt.src);
  currentAudio = audio;
  audio.preload = 'auto';
  audio.volume = 1;

  audio.onplay = () => setState({ isPlaying: true, isPaused: false });
  audio.onpause = () => {
    // Only set to paused if it hasn't ended.
    if (!audio.ended) {
      setState({ isPlaying: false, isPaused: true });
    }
  };
  audio.onended = () => {
    setState({ isPlaying: false, isPaused: false });
    currentAudio = undefined;
  };

  const fallback = () => {
    if (currentAudio === audio) {
      currentAudio = undefined;
      playSpeechFallback(prompt.fallbackText);
    }
  };

  audio.addEventListener('error', fallback, { once: true });
  audio.play().catch(fallback);
}
