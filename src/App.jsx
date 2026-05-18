import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Home,
  Loader2,
  Mic,
  Moon,
  MousePointerClick,
  Pause,
  Play,
  Sun,
  Sunrise,
  Volume2,
} from 'lucide-react';
import { playPrompt, stopPrompt, pausePrompt, resumePrompt, subscribeAudioState } from './audioPlayer.js';
import logoUrl from '../kumpas-logo.png';

const SCREENS = {
  SPLASH: 'splash',
  LOGIN: 'login',
  MENU: 'menu',
  LABEL_LESSON: 'labelLesson',
  LABEL_QUIZ: 'labelQuiz',
  LESSON: 'lesson',
  QUIZ2: 'quiz2',
  LISTENING: 'listening',
  SUCCESS: 'success',
};

const IMAGE_BASE = '/images/medicine';
const FALLBACK_IMAGE = `${IMAGE_BASE}/fallback.svg`;

const userChoices = [
  { id: 'user-1', src: `${IMAGE_BASE}/user-1.jpg`, tone: 'ring-kumpas-red/70' },
  { id: 'user-2', src: `${IMAGE_BASE}/user-2.jpg`, tone: 'ring-kumpas-blue/70' },
  { id: 'user-3', src: `${IMAGE_BASE}/user-3.jpg`, tone: 'ring-kumpas-yellow/70' },
  { id: 'user-4', src: `${IMAGE_BASE}/user-4.jpg`, tone: 'ring-kumpas-green/70' },
];

const medicineImages = {
  medicine: `${IMAGE_BASE}/medicine.jpg`,
  label: `${IMAGE_BASE}/medicine-label.jpg`,
  tablet: `${IMAGE_BASE}/tablet-hand.jpg`,
  morning: `${IMAGE_BASE}/morning-bright.jpg`,
  noon: `${IMAGE_BASE}/noon.jpg`,
  evening: `${IMAGE_BASE}/evening.jpg`,
  soap: `${IMAGE_BASE}/soap.jpg`,
  phone: `${IMAGE_BASE}/phone.jpg`,
};

const routineImages = [
  { id: 'morning', src: medicineImages.morning },
  { id: 'noon', src: medicineImages.noon },
  { id: 'evening', src: medicineImages.evening },
];

const routineCues = {
  morning: {
    Icon: Sunrise,
    badge: 'bg-amber-300 text-amber-950 ring-amber-50/70',
    wash: 'bg-amber-300/12',
  },
  noon: {
    Icon: Sun,
    badge: 'bg-sky-300 text-sky-950 ring-sky-50/70',
    wash: 'bg-sky-300/12',
  },
  evening: {
    Icon: Moon,
    badge: 'bg-indigo-300 text-indigo-950 ring-indigo-50/70',
    wash: 'bg-indigo-300/12',
  },
};

const moduleChoices = [
  { id: 'literacy', src: userChoices[0].src, enabled: false, tone: 'border-emerald-400/20' },
  { id: 'bill', src: medicineImages.evening, enabled: false, tone: 'border-sky-400/20' },
  { id: 'medicine', src: medicineImages.medicine, enabled: true, tone: 'border-red-400/70' },
  { id: 'scam', src: medicineImages.phone, enabled: false, tone: 'border-yellow-400/20' },
];

let dingAudioContext;

function getDingAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  dingAudioContext ||= new AudioContext();
  if (dingAudioContext.state === 'suspended') {
    dingAudioContext.resume().catch(() => {});
  }
  return dingAudioContext;
}

function primeSuccessDing() {
  getDingAudioContext();
}

function playSuccessDing() {
  const audioContext = getDingAudioContext();
  if (!audioContext) return;
  const gain = audioContext.createGain();
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.24, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.44);

  [784, 1175].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    oscillator.connect(gain);
    oscillator.start(audioContext.currentTime + index * 0.08);
    oscillator.stop(audioContext.currentTime + 0.42 + index * 0.08);
  });
}

function useAudioState() {
  const [audioState, setAudioState] = useState({ isPlaying: false, isPaused: false });
  useEffect(() => subscribeAudioState(setAudioState), []);
  return audioState;
}

function IconButton({ children, className = '', onClick, ariaLabel, disabled = false }) {
  return (
    <button
      aria-label={ariaLabel}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`grid place-items-center rounded-3xl border border-white/10 outline-none transition-all duration-300 hover:bg-white/10 hover:border-white/20 active:scale-95 focus-visible:ring-4 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function Photo({ src, alt, className = '', imgClassName = '' }) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <div className={`overflow-hidden bg-white/10 ${className}`}>
      <img
        alt={alt}
        className={`h-full w-full object-cover ${imgClassName}`}
        draggable="false"
        src={currentSrc}
        onError={() => {
          if (currentSrc !== FALLBACK_IMAGE) setCurrentSrc(FALLBACK_IMAGE);
        }}
      />
    </div>
  );
}

function PromptReplayButton({ promptId }) {
  const { isPlaying, isPaused } = useAudioState();

  const handleClick = () => {
    if (isPlaying) {
      pausePrompt();
    } else if (isPaused) {
      resumePrompt();
    } else {
      playPrompt(promptId);
    }
  };

  return (
    <IconButton
      ariaLabel={isPlaying ? 'pause' : 'paminaw'}
      className={`absolute right-4 top-4 z-20 h-14 w-14 rounded-full backdrop-blur-xl sm:right-6 sm:top-6 sm:h-16 sm:w-16 ${isPlaying ? 'border-orange-500/30 bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/80'}`}
      onClick={handleClick}
    >
      {isPlaying ? (
        <Pause className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
      ) : isPaused ? (
        <Play className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
      ) : (
        <Volume2 className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
      )}
    </IconButton>
  );
}

function ProgressDots({ currentStep, totalSteps = 6 }) {
  return (
    <div className="pointer-events-none absolute left-0 top-4 z-50 flex w-full justify-center gap-2 sm:top-6 sm:gap-3">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          aria-hidden="true"
          className={`h-2.5 rounded-full transition-all duration-500 ${
            index < currentStep
              ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
              : index === currentStep
                ? 'w-8 bg-white/40'
                : 'w-2.5 bg-white/10'
          }`}
          key={index}
        />
      ))}
    </div>
  );
}

function SplashScreen({ onComplete }) {
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const { isPlaying } = useAudioState();

  useEffect(() => {
    if (!hasPlayedIntro) return undefined;
    const timer = setTimeout(() => setCanContinue(true), 4400);
    return () => clearTimeout(timer);
  }, [hasPlayedIntro]);

  const handleStart = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      ctx.resume().catch(() => {});
    }

    if (!hasPlayedIntro) {
      setHasPlayedIntro(true);
      setCanContinue(false);
      playPrompt('splash.start');
      return;
    }

    if (isPlaying || !canContinue) return;
    stopPrompt();
    onComplete();
  };

  return (
    <button
      aria-label={hasPlayedIntro ? 'padayon' : 'start'}
      className="page-transition relative z-50 flex h-full w-full cursor-pointer items-center justify-center transition-transform duration-500 active:scale-95"
      onClick={handleStart}
      type="button"
    >
      <div className="pointer-events-none absolute inset-0 bg-blue-500/10 blur-[100px]" />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute h-60 w-60 rounded-full border border-white/10 transition-all duration-500 sm:h-72 sm:w-72 ${
          hasPlayedIntro ? 'scale-105 bg-blue-500/10' : 'animate-pulse bg-white/5'
        }`}
      />
      <img
        alt="Kumpas"
        className="relative h-44 w-44 animate-[android-enter_1s_ease-out_both] object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.5)] sm:h-56 sm:w-56"
        draggable="false"
        src={logoUrl}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-20 grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/10 text-white/80 shadow-2xl backdrop-blur-xl transition-all duration-500 sm:bottom-24 sm:h-16 sm:w-16 ${
          hasPlayedIntro && !canContinue ? 'scale-90 opacity-45' : 'animate-pulse opacity-100'
        }`}
      >
        <MousePointerClick className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
      </div>
    </button>
  );
}

function AppShell({ children }) {
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#09090b]">
      <div className="bg-mesh" />
      <div className="relative z-10 mx-auto h-full w-full max-w-md border-x border-white/5 bg-white/[0.02] shadow-2xl">
        {children}
      </div>
    </main>
  );
}

function LoginScreen({ onSelect }) {
  const { isPlaying } = useAudioState();

  useEffect(() => {
    playPrompt('login.user');
  }, []);

  return (
    <section className="page-transition flex h-full flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
      <PromptReplayButton promptId="login.user" />
      <div className="grid w-full grid-cols-2 gap-4 sm:gap-6">
        {userChoices.map(({ id, src, tone }) => (
          <IconButton
            ariaLabel={id}
            className="aspect-square bg-white/5 p-3 backdrop-blur-xl"
            disabled={isPlaying}
            key={id}
            onClick={() => onSelect(id)}
          >
            <Photo
              alt={id}
              className={`h-full w-full rounded-[1.35rem] ring-4 ${tone}`}
              src={src}
            />
          </IconButton>
        ))}
      </div>
    </section>
  );
}

function MenuScreen({ onStart }) {
  useEffect(() => {
    playPrompt('menu.start');
  }, []);

  return (
    <section className="page-transition flex h-full flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
      <PromptReplayButton promptId="menu.start" />
      <div className="grid w-full grid-cols-2 gap-4 sm:gap-5">
        {moduleChoices.map((choice) => {
          const isActive = choice.enabled;
          return (
            <IconButton
              ariaLabel={choice.id}
              className={`relative aspect-square overflow-hidden p-2 backdrop-blur-xl ${choice.tone} ${
                isActive ? 'animate-pulse bg-red-500/10 shadow-[0_0_42px_rgba(239,68,68,0.22)]' : 'bg-white/5'
              }`}
              disabled={!choice.enabled}
              key={choice.id}
              onClick={onStart}
            >
              <Photo
                alt={choice.id}
                className={`h-full w-full rounded-[1.35rem] transition-all duration-500 ${
                  choice.enabled ? 'opacity-100' : 'opacity-35 grayscale'
                }`}
                src={choice.src}
              />
              {choice.enabled && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2 rounded-[1.35rem] ring-4 ring-red-400/60"
                />
              )}
            </IconButton>
          );
        })}
      </div>
    </section>
  );
}

function RoutineDoseCard({ src, alt, className = '' }) {
  const cueId = routineImages.find((image) => image.src === src)?.id;
  const cue = cueId ? routineCues[cueId] : null;
  const TimeIcon = cue?.Icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/10 ${className}`}>
      <Photo alt={alt} className="absolute inset-0 h-full w-full" src={src} />
      {cue && <div aria-hidden="true" className={`absolute inset-0 ${cue.wash}`} />}
      {TimeIcon && (
        <div
          aria-hidden="true"
          className={`absolute left-2 top-2 grid h-10 w-10 place-items-center rounded-full ring-2 shadow-[0_8px_22px_rgba(0,0,0,0.28)] sm:h-12 sm:w-12 ${cue.badge}`}
        >
          <TimeIcon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.4} />
        </div>
      )}
      <div className="absolute bottom-2 right-2 h-12 w-12 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.32)] sm:h-14 sm:w-14">
        <Photo alt={`${alt}-tablet`} className="h-full w-full" src={medicineImages.tablet} />
      </div>
    </div>
  );
}

function LessonPhotoStack({ stage = 0 }) {
  return (
    <div className="relative mx-auto flex w-full max-w-[340px] flex-col gap-4">
      <div className="relative aspect-[1.18] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
        <Photo
          alt="medicine"
          className="absolute inset-0 h-full w-full"
          imgClassName={`transition-all duration-700 ${stage === 0 ? 'scale-105 opacity-100' : 'scale-110 opacity-0'}`}
          src={medicineImages.medicine}
        />
        <Photo
          alt="tablet"
          className="absolute inset-0 h-full w-full"
          imgClassName={`transition-all duration-700 ${stage === 1 ? 'scale-105 opacity-100' : 'scale-110 opacity-0'}`}
          src={medicineImages.tablet}
        />
        <div
          className={`absolute inset-0 grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 transition-all duration-700 ${
            stage >= 2 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {routineImages.map((image) => (
            <RoutineDoseCard alt={image.id} className="h-full" key={image.id} src={image.src} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
      </div>
      <div className="flex justify-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            className={`h-2.5 rounded-full transition-all duration-500 ${
              stage === index ? 'w-8 bg-white/70' : 'w-2.5 bg-white/20'
            }`}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

function LabelLessonScreen({ onNext }) {
  const [readyForNext, setReadyForNext] = useState(false);
  const { isPlaying } = useAudioState();

  useEffect(() => {
    setReadyForNext(false);
    playPrompt('lesson.label');

    const timer = setTimeout(() => setReadyForNext(true), 11600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="page-transition flex h-full flex-col justify-center gap-6 px-4 py-6 sm:gap-10 sm:px-6 sm:py-10">
      <ProgressDots currentStep={0} />
      <PromptReplayButton promptId="lesson.label" />
      <div className="mt-8 flex items-center justify-center sm:mt-12">
        <div className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <Photo
            alt="medicine-label"
            className="absolute inset-0 h-full w-full"
            imgClassName="scale-105"
            src={medicineImages.label}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 rounded-[1.35rem] ring-4 ring-red-400/75 shadow-[inset_0_0_44px_rgba(248,113,113,0.32)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 right-4 h-16 w-16 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
          >
            <Photo alt="label-tablet" className="h-full w-full" src={medicineImages.tablet} />
          </div>
        </div>
      </div>
      <div className="grid h-24 place-items-center sm:h-32">
        {readyForNext ? (
          <IconButton
            ariaLabel="padayon"
            className="h-20 w-20 animate-pulse rounded-full border-none bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:bg-blue-600 sm:h-28 sm:w-28"
            disabled={isPlaying}
            onClick={onNext}
          >
            <ArrowRight className="h-10 w-10 text-white sm:h-12 sm:w-12" strokeWidth={2} />
          </IconButton>
        ) : (
          <div aria-hidden="true" className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500 sm:h-16 sm:w-16" />
        )}
      </div>
    </section>
  );
}

function LessonScreen({ onNext }) {
  const [readyForNext, setReadyForNext] = useState(false);
  const [stage, setStage] = useState(0);
  const { isPlaying } = useAudioState();

  useEffect(() => {
    setReadyForNext(false);
    setStage(0);
    playPrompt('lesson.medicine');

    const t1 = setTimeout(() => setStage(1), 5200);
    const t2 = setTimeout(() => setStage(2), 11200);
    const t3 = setTimeout(() => setReadyForNext(true), 19800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <section className="page-transition flex h-full flex-col justify-center gap-6 px-4 py-6 sm:gap-10 sm:px-6 sm:py-10">
      <ProgressDots currentStep={stage >= 2 ? 3 : 2} />
      <PromptReplayButton promptId="lesson.medicine" />
      <div className="mt-8 flex items-center justify-center sm:mt-12">
        <LessonPhotoStack stage={stage} />
      </div>
      <div className="grid h-24 place-items-center sm:h-32">
        {readyForNext ? (
          <IconButton
            ariaLabel="padayon"
            className="h-20 w-20 animate-pulse rounded-full border-none bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:bg-blue-600 sm:h-28 sm:w-28"
            disabled={isPlaying}
            onClick={onNext}
          >
            <ArrowRight className="h-10 w-10 text-white sm:h-12 sm:w-12" strokeWidth={2} />
          </IconButton>
        ) : (
          <div aria-hidden="true" className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500 sm:h-16 sm:w-16" />
        )}
      </div>
    </section>
  );
}

function PhotoOption({ option, onSelect, disabled, isGuided, isError }) {
  return (
    <IconButton
      ariaLabel={option.id}
      className={`relative min-h-[124px] overflow-hidden bg-white/5 p-2 backdrop-blur-xl sm:min-h-[150px] ${
        isGuided ? 'animate-pulse border-white/60 shadow-[0_0_44px_rgba(255,255,255,0.2)]' : ''
      } ${isError ? 'animate-error-shake !border-red-500 !bg-red-500/20' : ''}`}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
    >
      {option.kind === 'routine' ? (
        <div className={`grid h-full w-full gap-1.5 ${option.images.length === 1 ? 'grid-cols-1' : option.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {option.images.map((image, index) => (
            <RoutineDoseCard alt={`${option.id}-${index}`} className="h-full" key={`${option.id}-${image}`} src={image} />
          ))}
        </div>
      ) : (
        <Photo alt={option.id} className="h-full w-full rounded-2xl" src={option.src} />
      )}
    </IconButton>
  );
}

function LabelQuizScreen({ onComplete }) {
  const { isPlaying } = useAudioState();
  const [errorId, setErrorId] = useState(null);
  const options = [
    { id: 'label', src: medicineImages.label },
    { id: 'breakfast', src: medicineImages.morning },
    { id: 'lunch', src: medicineImages.noon },
    { id: 'bedtime', src: medicineImages.evening },
  ];

  useEffect(() => {
    playPrompt('test.label');
  }, []);

  const handleSelect = (id) => {
    if (id === 'label') {
      stopPrompt();
      onComplete();
      return;
    }

    setErrorId(id);
    setTimeout(() => setErrorId(null), 900);
  };

  return (
    <section className="page-transition flex h-full flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
      <ProgressDots currentStep={1} />
      <PromptReplayButton promptId="test.label" />
      <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
        {options.map((option) => (
          <PhotoOption
            disabled={isPlaying && errorId !== option.id}
            isError={errorId === option.id}
            isGuided={option.id === 'label' && !isPlaying}
            key={option.id}
            onSelect={handleSelect}
            option={option}
          />
        ))}
      </div>
    </section>
  );
}

function QuizScreen({ onComplete }) {
  const { isPlaying } = useAudioState();
  const [errorId, setErrorId] = useState(null);

  const config = {
    audio: 'test.medicine',
    options: [
      { id: 'one', kind: 'routine', images: [medicineImages.morning] },
      { id: 'three', kind: 'routine', images: [medicineImages.morning, medicineImages.noon, medicineImages.evening] },
      { id: 'two', kind: 'routine', images: [medicineImages.morning, medicineImages.evening] },
    ],
    correctId: 'three',
  };

  useEffect(() => {
    playPrompt(config.audio);
  }, [config.audio]);

  const handleSelect = (id) => {
    if (id === config.correctId) {
      stopPrompt();
      onComplete();
      return;
    }

    setErrorId(id);
    setTimeout(() => setErrorId(null), 900);
  };

  return (
    <section className="page-transition flex h-full flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
      <ProgressDots currentStep={4} />
      <PromptReplayButton promptId={config.audio} />
      <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:mt-8 sm:gap-4">
        {config.options.map((option) => {
          return (
            <PhotoOption
              disabled={isPlaying && errorId !== option.id}
              isError={errorId === option.id}
              isGuided={option.id === config.correctId && !isPlaying}
              key={option.id}
              onSelect={handleSelect}
              option={option}
            />
          );
        })}
      </div>
    </section>
  );
}

function ListeningScreen({ onComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    playPrompt('voice.read');
  }, []);

  const handleMicClick = () => {
    stopPrompt();
    setIsProcessing(true);
    setTimeout(() => {
      onComplete();
    }, 2500);
  };

  return (
    <section className="page-transition flex h-full flex-col items-center justify-between px-4 py-6 sm:px-6 sm:py-10">
      <ProgressDots currentStep={5} />
      <PromptReplayButton promptId="voice.read" />

      <div className="mt-14 grid w-full grid-cols-3 gap-2 sm:mt-20 sm:gap-3">
        {routineImages.map((image) => (
          <RoutineDoseCard
            alt={image.id}
            className="aspect-[0.72] rounded-3xl border border-white/10 shadow-2xl"
            key={image.id}
            src={image.src}
          />
        ))}
      </div>

      <div className="sound-wave relative flex min-h-[90px] w-full flex-1 items-center justify-center gap-3 sm:min-h-[130px] sm:gap-4">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-blue-500/10 blur-3xl" />
        {[40, 80, 140, 80, 40].map((height, index) => (
          <span
            aria-hidden="true"
            className="block w-3 origin-center rounded-full bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.5)] sm:w-6"
            key={index}
            style={{ height: `${height / 2}px` }}
          />
        ))}
      </div>

      <IconButton
        ariaLabel="mikropono"
        className={`mb-2 h-20 w-20 rounded-full border-none transition-all duration-500 sm:mb-4 sm:h-28 sm:w-28 ${
          isProcessing
            ? 'scale-110 bg-indigo-600 shadow-[0_0_60px_rgba(79,70,229,0.6)]'
            : 'animate-pulse bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:bg-blue-600'
        }`}
        disabled={isProcessing}
        onClick={handleMicClick}
      >
        {isProcessing ? (
          <Loader2 className="h-10 w-10 animate-spin text-white sm:h-14 sm:w-14" strokeWidth={2} />
        ) : (
          <Mic className="h-8 w-8 text-white sm:h-12 sm:w-12" strokeWidth={2} />
        )}
      </IconButton>
    </section>
  );
}

function SuccessScreen({ onHome }) {
  const { isPlaying } = useAudioState();

  useEffect(() => {
    playPrompt('success.good');
  }, []);

  return (
    <section className="page-transition flex h-full flex-col items-center justify-center gap-12 px-4 py-6 sm:gap-20 sm:px-6 sm:py-10">
      <PromptReplayButton promptId="success.good" />
      <div className="relative mt-6 sm:mt-10">
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl" />
        <CheckCircle className="relative z-10 h-48 w-48 text-green-400 drop-shadow-[0_0_40px_rgba(74,222,128,0.4)] sm:h-64 sm:w-64" strokeWidth={1} />
      </div>
      <IconButton
        ariaLabel="balay"
        className="h-20 w-20 rounded-full bg-white/5 backdrop-blur-xl sm:h-24 sm:w-24"
        disabled={isPlaying}
        onClick={onHome}
      >
        <Home className="h-8 w-8 text-white/80 sm:h-10 sm:w-10" strokeWidth={2} />
      </IconButton>
    </section>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.SPLASH);

  const completeVoiceCheck = useMemo(
    () => () => {
      stopPrompt();
      playSuccessDing();
      setCurrentScreen(SCREENS.SUCCESS);
    },
    [],
  );

  return (
    <AppShell>
      {currentScreen === SCREENS.SPLASH && (
        <SplashScreen onComplete={() => setCurrentScreen(SCREENS.LOGIN)} />
      )}
      {currentScreen === SCREENS.LOGIN && (
        <LoginScreen
          onSelect={() => {
            setCurrentScreen(SCREENS.MENU);
          }}
        />
      )}
      {currentScreen === SCREENS.MENU && (
        <MenuScreen
          onStart={() => {
            stopPrompt();
            setCurrentScreen(SCREENS.LABEL_LESSON);
          }}
        />
      )}
      {currentScreen === SCREENS.LABEL_LESSON && (
        <LabelLessonScreen
          onNext={() => {
            stopPrompt();
            setCurrentScreen(SCREENS.LABEL_QUIZ);
          }}
        />
      )}
      {currentScreen === SCREENS.LABEL_QUIZ && (
        <LabelQuizScreen
          onComplete={() => {
            setCurrentScreen(SCREENS.LESSON);
          }}
        />
      )}
      {currentScreen === SCREENS.LESSON && (
        <LessonScreen
          onNext={() => {
            stopPrompt();
            setCurrentScreen(SCREENS.QUIZ2);
          }}
        />
      )}
      {currentScreen === SCREENS.QUIZ2 && (
        <QuizScreen
          onComplete={() => {
            primeSuccessDing();
            setCurrentScreen(SCREENS.LISTENING);
          }}
        />
      )}
      {currentScreen === SCREENS.LISTENING && <ListeningScreen onComplete={completeVoiceCheck} />}
      {currentScreen === SCREENS.SUCCESS && (
        <SuccessScreen
          onHome={() => {
            stopPrompt();
            setCurrentScreen(SCREENS.MENU);
          }}
        />
      )}
    </AppShell>
  );
}
