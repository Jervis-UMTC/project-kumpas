export const geminiTtsConfig = {
  provider: 'google-gemini-tts',
  endpoint:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent',
  model: 'gemini-3.1-flash-tts-preview',
  targetLanguageCode: 'ceb',
  voice: 'Iapetus',
  container: 'WAV',
  sampleRateHz: 24000,
  channels: 1,
  bitsPerSample: 16,
  stylePrompt:
    'Say the following exactly in Cebuano Bisaya for adult learners in the Philippines. Use a warm, slow, very clear adult voice, natural Cebuano pronunciation, and slight pauses between phrases. Do not sound childish. Do not translate or add extra words.',
};

export const voicePrompts = {
  'login.user': {
    text: 'Kinsa ang mogamit karon? Pindota ang imong litrato.',
    fallbackText: 'Kinsa ang mogamit karon? Pindota ang imong litrato.',
    src: '/audio/ceb/login-user.wav',
  },
  'menu.start': {
    text: 'Maayong adlaw! Pindota ang libro para sa alpabeto, ang kilat para sa kuryente, ang tambal para sa reseta, o ang cellphone para sa text scam.',
    fallbackText: 'Maayong adlaw! Pindota ang libro para sa alpabeto, ang kilat para sa kuryente, ang tambal para sa reseta, o ang cellphone para sa text scam.',
    src: '/audio/ceb/menu-start.wav',
  },
  'menu.retry': {
    text: 'Pili og usa. Pindota ang kilat, ang tambal, o ang cellphone.',
    fallbackText: 'Pili og usa. Pindota ang kilat, ang tambal, o ang cellphone.',
    src: '/audio/ceb/menu-retry.wav',
  },
  'lesson.bill': {
    text: 'Tan-awa ang bayranan sa kuryente. Ang bayronon kay lima ka gatos ka piso.',
    fallbackText: 'Tan-awa ang bayranan sa kuryente. Ang bayronon kay lima ka gatos ka piso.',
    src: '/audio/ceb/lesson-bill.wav',
  },
  'lesson.medicine': {
    text: 'Tan-awa ang tambal. Pag-inom og usa ka tableta, katulo sa usa ka adlaw.',
    fallbackText: 'Tan-awa ang tambal. Pag-inom og usa ka tableta, katulo sa usa ka adlaw.',
    src: '/audio/ceb/lesson-medicine.wav',
  },
  'lesson.scam': {
    text: 'Tan-awa ang text. Pagbantay, kini usa ka scam. Ayaw ihatag ang imong password.',
    fallbackText: 'Tan-awa ang text. Pagbantay, kini usa ka scam. Ayaw ihatag ang imong password.',
    src: '/audio/ceb/lesson-scam.wav',
  },
  'test.medicine': {
    text: 'Pila ka tableta ang imnon sa usa ka adlaw?',
    fallbackText: 'Pila ka tableta ang imnon sa usa ka adlaw?',
    src: '/audio/ceb/test-medicine.wav',
  },
  'test.scam': {
    text: 'Angay ba nimo ihatag ang imong password sa nag-text?',
    fallbackText: 'Angay ba nimo ihatag ang imong password sa nag-text?',
    src: '/audio/ceb/test-scam.wav',
  },
  'test.bill': {
    text: 'Pila ang bayronon sa kuryente?',
    fallbackText: 'Pila ang bayronon sa kuryente?',
    src: '/audio/ceb/test-bill.wav',
  },
  'test.wrong': {
    text: 'Sipyat. Sulayi usab.',
    fallbackText: 'Sipyat. Sulayi usab.',
    src: '/audio/ceb/test-wrong.wav',
  },
  'test1.medicine': {
    text: 'Hain ang tambal?',
    fallbackText: 'Hain ang tambal?',
    src: '/audio/ceb/test1-medicine.wav',
  },
  'test1.scam': {
    text: 'Asa ang cellphone?',
    fallbackText: 'Asa ang cellphone?',
    src: '/audio/ceb/test1-scam.wav',
  },
  'test1.bill': {
    text: 'Asa ang bayranan sa kuryente?',
    fallbackText: 'Asa ang bayranan sa kuryente?',
    src: '/audio/ceb/test1-bill.wav',
  },
  'voice.read': {
    text: 'Karon, ikaw na. Basaha ang nakasulat.',
    fallbackText: 'Karon, ikaw na. Basaha ang nakasulat.',
    src: '/audio/ceb/voice-read.wav',
  },
  'success.good': {
    text: 'Maayo kaayo!',
    fallbackText: 'Maayo kaayo!',
    src: '/audio/ceb/success-good.wav',
  },
  'lesson.literacy': {
    text: 'Kini ang letrang M. Ang tingog niini kay mmm. Sama sa Mata.',
    fallbackText: 'Kini ang letrang M. Ang tingog niini kay mmm. Sama sa Mata.',
    src: '/audio/ceb/lesson-literacy.wav',
  },
  'test1.literacy': {
    text: 'Asa ang letrang M?',
    fallbackText: 'Asa ang letrang M?',
    src: '/audio/ceb/test1-literacy.wav',
  },
  'test.literacy': {
    text: 'Asa niini ang nagsugod sa letrang M?',
    fallbackText: 'Asa niini ang nagsugod sa letrang M?',
    src: '/audio/ceb/test-literacy.wav',
  },
  'voice.literacy': {
    text: 'Karon, ikaw na. Isulti ang tingog sa letrang M.',
    fallbackText: 'Karon, ikaw na. Isulti ang tingog sa letrang M.',
    src: '/audio/ceb/voice-literacy.wav',
  },
};

export const voicePromptIds = Object.keys(voicePrompts);
export const voicePromptAssets = voicePromptIds.map((id) => voicePrompts[id].src);
