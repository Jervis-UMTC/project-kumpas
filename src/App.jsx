import { useEffect, useMemo, useState } from 'react';
import {
  Apple,
  ArrowRight,
  BookOpen,
  BusFront,
  Check,
  CheckCircle,
  Dog,
  Droplet,
  Eye,
  Home,
  Loader2,
  Mic,
  Pause,
  Play,
  Pill,
  Smartphone,
  Sun,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { playPrompt, stopPrompt, pausePrompt, resumePrompt, subscribeAudioState } from './audioPlayer.js';
import logoUrl from '../kumpas-logo.png';

const SCREENS = {
  SPLASH: 'splash',
  LOGIN: 'login',
  MENU: 'menu',
  LESSON: 'lesson',
  QUIZ1: 'quiz1',
  QUIZ2: 'quiz2',
  LISTENING: 'listening',
  SUCCESS: 'success',
};

const MODULES = {
  LITERACY: 'literacy',
  BILL: 'bill',
  MEDICINE: 'medicine',
  SCAM: 'scam',
};

const avatarChoices = [
  { id: 'apple', Icon: Apple, color: 'text-kumpas-red' },
  { id: 'dog', Icon: Dog, color: 'text-kumpas-amber' },
  { id: 'sun', Icon: Sun, color: 'text-kumpas-yellow' },
  { id: 'jeep', Icon: BusFront, color: 'text-kumpas-blue' },
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
  useEffect(() => {
    return subscribeAudioState(setAudioState);
  }, []);
  return audioState;
}

function IconButton({ children, className = '', onClick, ariaLabel, dataTestId, disabled = false }) {
  return (
    <button
      aria-label={ariaLabel}
      data-testid={dataTestId}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`grid place-items-center rounded-3xl border border-white/10 outline-none transition-all duration-300 hover:bg-white/10 hover:border-white/20 active:scale-95 focus-visible:ring-4 focus-visible:ring-white/30 disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
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
      className={`absolute right-4 top-4 z-20 h-14 w-14 rounded-full backdrop-blur-xl sm:right-6 sm:top-6 sm:h-16 sm:w-16 ${isPlaying ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-white/5 text-white/80'}`}
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

function ProgressDots({ currentStep }) {
  const steps = 4;
  return (
    <div className="absolute top-4 sm:top-6 left-0 w-full flex justify-center gap-2 sm:gap-3 z-50 pointer-events-none">
      {Array.from({ length: steps }).map((_, i) => (
        <div 
          key={i} 
          className={`h-2.5 rounded-full transition-all duration-500 ${i < currentStep ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : i === currentStep ? 'w-8 bg-white/40' : 'w-2.5 bg-white/10'}`} 
        />
      ))}
    </div>
  );
}

function SplashScreen({ onComplete }) {
  const handleStart = () => {
    // Unlock browser audio context on first user interaction
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      ctx.resume().catch(() => {});
    }
    onComplete();
  };

  return (
    <section 
      className="page-transition flex h-full w-full flex-col items-center justify-center relative z-50 cursor-pointer active:scale-95 transition-transform duration-500"
      onClick={handleStart}
    >
      <div className="absolute inset-0 bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="relative animate-[android-enter_1s_ease-out_both]">
        <img 
          src={logoUrl} 
          alt="Kumpas Logo" 
          className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]" 
        />
      </div>
      <div className="mt-6 sm:mt-8 text-4xl sm:text-5xl font-black tracking-widest text-white/90 uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        Kumpas
      </div>
      <div className="absolute bottom-8 sm:bottom-16 animate-pulse text-white/60 text-xs sm:text-sm tracking-[0.2em] uppercase font-bold">
        Pindota aron magsugod
      </div>
    </section>
  );
}

function AppShell({ children }) {
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#09090b]">
      <div className="bg-mesh" />
      <div className="relative z-10 h-full w-full max-w-md mx-auto shadow-2xl bg-white/[0.02] border-x border-white/5">{children}</div>
    </main>
  );
}

function LoginScreen({ onSelect }) {
  const { isPlaying } = useAudioState();
  
  useEffect(() => {
    playPrompt('login.user');
  }, []);

  return (
    <section className="page-transition flex h-full flex-col px-4 py-6 sm:px-6 sm:py-10 justify-center">
      <PromptReplayButton promptId="login.user" />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full mt-6 sm:mt-10">
        {avatarChoices.map(({ id, Icon, color }) => (
          <IconButton
            disabled={isPlaying}
            ariaLabel={id}
            className="bg-white/5 backdrop-blur-xl flex flex-col items-center justify-center py-8 sm:py-12"
            key={id}
            onClick={() => onSelect(id)}
          >
            <Icon className={`h-20 w-20 sm:h-24 sm:w-24 ${color}`} strokeWidth={1.5} />
          </IconButton>
        ))}
      </div>
    </section>
  );
}

function MenuScreen({ onStart }) {
  const { isPlaying } = useAudioState();

  useEffect(() => {
    playPrompt('menu.start');
  }, []);

  return (
    <section className="page-transition flex h-full flex-col px-4 py-6 sm:px-6 sm:py-10 justify-center">
      <PromptReplayButton promptId="menu.start" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full mt-6 sm:mt-8">
        <IconButton
          disabled={isPlaying}
          ariaLabel="alpabeto"
          className="flex-col bg-green-500/10 backdrop-blur-xl border-green-500/20 hover:bg-green-500/20 py-8 sm:py-10"
          onClick={() => onStart(MODULES.LITERACY)}
        >
          <BookOpen className="h-16 w-16 sm:h-20 sm:w-20 fill-green-500/50 text-green-400" strokeWidth={1.5} />
        </IconButton>
        <IconButton
          disabled={isPlaying}
          ariaLabel="kuryente"
          className="flex-col bg-blue-500/10 backdrop-blur-xl border-blue-500/20 hover:bg-blue-500/20 py-8 sm:py-10"
          onClick={() => onStart(MODULES.BILL)}
        >
          <Zap className="h-16 w-16 sm:h-20 sm:w-20 fill-blue-500/50 text-blue-400" strokeWidth={1.5} />
        </IconButton>
        <IconButton
          disabled={isPlaying}
          ariaLabel="tambal"
          className="flex-col bg-red-500/10 backdrop-blur-xl border-red-500/20 hover:bg-red-500/20 py-8 sm:py-10"
          onClick={() => onStart(MODULES.MEDICINE)}
        >
          <Pill className="h-16 w-16 sm:h-20 sm:w-20 fill-red-500/50 text-red-400" strokeWidth={1.5} />
        </IconButton>
        <IconButton
          disabled={isPlaying}
          ariaLabel="cellphone"
          className="flex-col bg-yellow-500/10 backdrop-blur-xl border-yellow-500/20 hover:bg-yellow-500/20 py-8 sm:py-10"
          onClick={() => onStart(MODULES.SCAM)}
        >
          <Smartphone className="h-16 w-16 sm:h-20 sm:w-20 fill-yellow-500/50 text-yellow-400" strokeWidth={1.5} />
        </IconButton>
      </div>
    </section>
  );
}

function LiteracyMock({ stage = 0 }) {
  return (
    <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center gap-6 sm:gap-8 min-h-[300px] sm:min-h-[360px]">
      <div className="absolute inset-0 bg-green-500/5 blur-[100px]" />
      
      <div className={`relative z-10 transition-all duration-700 ${stage >= 1 ? 'scale-110' : 'scale-100'}`}>
        <div className={`text-[96px] sm:text-[120px] leading-none font-black tracking-tighter ${stage >= 1 ? 'text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.4)]' : 'text-slate-300'}`}>
          M
        </div>
      </div>

      <div className={`relative z-10 transition-all duration-700 transform ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid h-24 w-24 place-items-center rounded-2xl bg-green-500/20 border border-green-500/30">
          <Eye className="h-12 w-12 text-green-400" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

function BillMock({ stage = 0 }) {
  return (
    <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-5 sm:p-6 text-slate-800 shadow-2xl scale-95 sm:scale-100 origin-top">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-2xl font-black tracking-tight text-orange-600">
            MERALCO
          </div>
          <div className="mt-1.5 h-2 w-24 rounded-full bg-slate-200" />
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-orange-100">
          <Zap className="h-6 w-6 text-orange-600" strokeWidth={2} />
        </div>
      </div>

      <div className="mt-6 grid gap-2.5">
        <div className="h-3 w-10/12 rounded-full bg-slate-200" />
        <div className="h-3 w-7/12 rounded-full bg-slate-200" />
        <div className="h-3 w-9/12 rounded-full bg-slate-200" />
      </div>

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 border border-slate-100">
        <div className="h-3 w-8/12 rounded-full bg-slate-200" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="h-10 rounded-lg bg-slate-200" />
          <div className="h-10 rounded-lg bg-slate-200" />
          <div className="h-10 rounded-lg bg-slate-200" />
        </div>
      </div>

      <div
        className="relative mt-8 overflow-hidden rounded-2xl bg-orange-50 p-5 border border-orange-100 shadow-inner"
        data-testid="bill-total"
      >
        <div className="bill-highlight absolute inset-0 origin-left bg-orange-100/50 mix-blend-multiply" />
        <div className="relative z-10 text-xs font-bold uppercase tracking-wider text-orange-600/80">
          Total Amount Due
        </div>
        <div
          className={`relative z-10 mt-1 text-5xl font-black tracking-tight transition-all duration-500 rounded px-2 inline-block ${stage >= 1 ? 'bg-orange-200/80 text-orange-700 scale-105' : 'text-orange-600'}`}
          data-testid="bill-amount"
        >
          ₱500.00
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <div className="h-8 w-full rounded-lg bg-[repeating-linear-gradient(90deg,#cbd5e1_0_4px,transparent_4px_8px)] opacity-40" />
      </div>
    </div>
  );
}

function MedicineMock({ stage = 0 }) {
  return (
    <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-5 sm:p-6 text-slate-800 shadow-2xl scale-95 sm:scale-100 origin-top">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-3xl font-black tracking-tight text-red-600">
            BIOGESIC
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">Paracetamol 500mg</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100">
          <Pill className="h-6 w-6 text-red-600" strokeWidth={2} />
        </div>
      </div>
      
      <div className="mt-6 grid gap-2.5">
        <div className="h-3 w-full rounded-full bg-slate-200" />
        <div className="h-3 w-8/12 rounded-full bg-slate-200" />
      </div>
      
      <div className="relative mt-10 overflow-hidden rounded-2xl bg-red-50 p-5 border border-red-100 shadow-inner">
        <div className="bill-highlight absolute inset-0 origin-left bg-red-100/50 mix-blend-multiply" />
        <div className="relative z-10 text-xs font-bold uppercase tracking-wider text-red-600/80">
          Dosage Instructions
        </div>
        <div className="relative z-10 mt-2 text-4xl font-black tracking-tight text-red-600 leading-tight">
          <span className={`transition-all duration-500 rounded px-2 inline-block ${stage >= 1 ? 'bg-red-200/80 text-red-800 scale-105' : ''}`}>
            1 Tablet
          </span>
          <br/> 
          <span className={`transition-all duration-500 text-2xl rounded px-2 inline-block mt-1 ${stage >= 2 ? 'bg-red-200/80 text-red-700 scale-105' : 'text-red-500'}`}>
            3x a day
          </span>
        </div>
      </div>
    </div>
  );
}

function ScamMock({ stage = 0 }) {
  return (
    <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6 shadow-2xl flex flex-col h-[340px] sm:h-[400px] scale-95 sm:scale-100 origin-top">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-800">
          <Smartphone className="h-5 w-5 text-slate-300" strokeWidth={2} />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-200">+63 912 345 6789</div>
          <div className="text-xs text-slate-500">Text Message</div>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col gap-4 flex-1">
        <div className="relative rounded-2xl rounded-tl-sm bg-slate-800 p-4 border border-slate-700 w-11/12">
          <div className="bill-highlight absolute inset-0 origin-left rounded-2xl bg-red-500/20 mix-blend-screen" />
          <p className="relative z-10 text-sm text-slate-300 leading-relaxed">
            <span className={`transition-colors duration-500 rounded px-1 ${stage >= 1 ? 'bg-slate-700 text-white' : ''}`}>
              CONGRATULATIONS! You won ₱50,000 in our raffle. To claim your prize, send your
            </span>
            {' '}
            <span className={`transition-all duration-500 font-bold rounded px-1 inline-block ${stage >= 2 ? 'bg-red-500/40 text-red-200 scale-105' : 'text-red-400'}`}>
              GCASH PASSWORD
            </span>
            {' '}
            <span className={`transition-colors duration-500 rounded px-1 ${stage >= 1 ? 'bg-slate-700 text-white' : ''}`}>
              to this number immediately!
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function LessonScreen({ selectedModule, onNext }) {
  const [readyForNext, setReadyForNext] = useState(false);
  const [highlightStage, setHighlightStage] = useState(0);
  const { isPlaying } = useAudioState();

  const audioPromptMap = {
    [MODULES.LITERACY]: 'lesson.literacy',
    [MODULES.BILL]: 'lesson.bill',
    [MODULES.MEDICINE]: 'lesson.medicine',
    [MODULES.SCAM]: 'lesson.scam',
  };

  useEffect(() => {
    setReadyForNext(false);
    setHighlightStage(0);
    playPrompt(audioPromptMap[selectedModule]);
    
    let t1, t2, t3;
    if (selectedModule === MODULES.LITERACY) {
      t1 = setTimeout(() => setHighlightStage(1), 1500); 
      t2 = setTimeout(() => setHighlightStage(2), 3500); 
      t3 = setTimeout(() => setReadyForNext(true), 6000);
    } else if (selectedModule === MODULES.BILL) {
      t1 = setTimeout(() => setHighlightStage(1), 3000); 
      t3 = setTimeout(() => setReadyForNext(true), 6500);
    } else if (selectedModule === MODULES.MEDICINE) {
      t1 = setTimeout(() => setHighlightStage(1), 2200); 
      t2 = setTimeout(() => setHighlightStage(2), 4000); 
      t3 = setTimeout(() => setReadyForNext(true), 7000);
    } else if (selectedModule === MODULES.SCAM) {
      t1 = setTimeout(() => setHighlightStage(1), 2200); 
      t2 = setTimeout(() => setHighlightStage(2), 5200); 
      t3 = setTimeout(() => setReadyForNext(true), 8000);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [selectedModule]);

  return (
    <section className="page-transition flex h-full flex-col px-4 py-6 sm:px-6 sm:py-10 justify-center gap-6 sm:gap-10">
      <ProgressDots currentStep={0} />
      <PromptReplayButton promptId={audioPromptMap[selectedModule]} />
      <div className="flex items-center justify-center mt-8 sm:mt-12">
        {selectedModule === MODULES.LITERACY && <LiteracyMock stage={highlightStage} />}
        {selectedModule === MODULES.BILL && <BillMock stage={highlightStage} />}
        {selectedModule === MODULES.MEDICINE && <MedicineMock stage={highlightStage} />}
        {selectedModule === MODULES.SCAM && <ScamMock stage={highlightStage} />}
      </div>
      <div className="grid h-24 sm:h-32 place-items-center">
        {readyForNext ? (
          <IconButton
            disabled={isPlaying}
            ariaLabel="padayon"
            className="h-20 w-20 sm:h-28 sm:w-28 animate-pulse rounded-full bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)] border-none hover:bg-blue-600"
            onClick={onNext}
          >
            <ArrowRight className="h-10 w-10 sm:h-12 sm:w-12 text-white" strokeWidth={2} />
          </IconButton>
        ) : (
          <div aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
        )}
      </div>
    </section>
  );
}

function QuizScreen({ selectedModule, phase, onComplete }) {
  const { isPlaying } = useAudioState();
  const [errorId, setErrorId] = useState(null);

  const testConfig = {
    [MODULES.LITERACY]: {
      audio: phase === 1 ? 'test1.literacy' : 'test.literacy',
      options: phase === 1 ? [
        { id: 'correct', text: 'M', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' },
        { id: 'wrong1', text: 'S', color: 'text-slate-400', bg: 'bg-white/5 border-white/10 hover:bg-white/10' },
      ] : [
        { id: 'wrong1', icon: Dog, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' },
        { id: 'correct', icon: Eye, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' },
      ]
    },
    [MODULES.BILL]: {
      audio: phase === 1 ? 'test1.bill' : 'test.bill',
      options: phase === 1 ? [
        { id: 'wrong1', icon: Droplet, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' },
        { id: 'correct', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' },
      ] : [
        { id: 'wrong1', text: '₱100', color: 'text-slate-400', bg: 'bg-white/5 border-white/10 hover:bg-white/10' },
        { id: 'correct', text: '₱500', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' },
        { id: 'wrong2', text: '₱1000', color: 'text-slate-400', bg: 'bg-white/5 border-white/10 hover:bg-white/10' },
      ]
    },
    [MODULES.MEDICINE]: {
      audio: phase === 1 ? 'test1.medicine' : 'test.medicine',
      options: phase === 1 ? [
        { id: 'wrong1', icon: Apple, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' },
        { id: 'correct', icon: Pill, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' },
      ] : [
        { id: 'wrong1', count: 1, icon: Pill, color: 'text-slate-400', bg: 'bg-white/5 border-white/10 hover:bg-white/10' },
        { id: 'wrong2', count: 2, icon: Pill, color: 'text-slate-400', bg: 'bg-white/5 border-white/10 hover:bg-white/10' },
        { id: 'correct', count: 3, icon: Pill, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' },
      ]
    },
    [MODULES.SCAM]: {
      audio: phase === 1 ? 'test1.scam' : 'test.scam',
      options: phase === 1 ? [
        { id: 'wrong1', icon: Dog, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' },
        { id: 'correct', icon: Smartphone, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20' },
      ] : [
        { id: 'wrong1', icon: Check, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' },
        { id: 'correct', icon: X, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' },
      ]
    }
  };

  const config = testConfig[selectedModule];

  useEffect(() => {
    playPrompt(config.audio);
  }, [config.audio]);

  const handleSelect = (id) => {
    if (id === 'correct') {
      stopPrompt();
      onComplete();
    } else {
      if (phase === 1) {
        // Errorless learning: do nothing on wrong clicks in phase 1
        return;
      }
      setErrorId(id);
      playPrompt('test.wrong');
      setTimeout(() => setErrorId(null), 1000);
    }
  };

  return (
    <section className="page-transition flex h-full flex-col px-4 py-6 sm:px-6 sm:py-10 justify-center">
      <ProgressDots currentStep={phase === 1 ? 1 : 2} />
      <PromptReplayButton promptId={config.audio} />
      <div className="flex w-full flex-col gap-4 sm:gap-6 mt-6 sm:mt-8">
        {config.options.map((opt) => {
          const isCorrectAndGuided = phase === 1 && opt.id === 'correct' && !isPlaying;
          const bgClasses = errorId === opt.id ? 'animate-error-shake !bg-red-500/20 !border-red-500' : opt.bg;
          const guideClasses = isCorrectAndGuided ? 'animate-pulse shadow-[0_0_40px_rgba(255,255,255,0.2)] border-white/50' : '';
          
          return (
            <IconButton
              key={opt.id}
              disabled={isPlaying && errorId !== opt.id}
              className={`flex-row justify-center py-6 sm:py-10 backdrop-blur-xl ${bgClasses} ${guideClasses}`}
              onClick={() => handleSelect(opt.id)}
            >
              {opt.text ? (
                <div className={`text-6xl sm:text-8xl font-black ${opt.color}`}>{opt.text}</div>
              ) : opt.count ? (
                 <div className="flex gap-4">
                   {Array.from({ length: opt.count }).map((_, i) => (
                     <opt.icon key={i} className={`h-10 w-10 sm:h-12 sm:w-12 fill-current ${opt.color}`} strokeWidth={1.5} />
                   ))}
                 </div>
              ) : (
                 <opt.icon className={`h-20 w-20 sm:h-24 sm:w-24 fill-current ${opt.color}`} strokeWidth={1.5} />
              )}
            </IconButton>
          );
        })}
      </div>
    </section>
  );
}

function ListeningScreen({ selectedModule, onComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const audioPrompt = selectedModule === MODULES.LITERACY ? 'voice.literacy' : 'voice.read';

  useEffect(() => {
    playPrompt(audioPrompt);
  }, [audioPrompt]);

  const handleMicClick = () => {
    stopPrompt();
    setIsProcessing(true);
    setTimeout(() => {
      onComplete();
    }, 2500); // AI simulation delay
  };

  return (
    <section className="page-transition flex h-full flex-col items-center justify-between px-4 py-6 sm:px-6 sm:py-10">
      <ProgressDots currentStep={3} />
      <PromptReplayButton promptId={audioPrompt} />
      
      <div className="mt-10 sm:mt-16 w-full flex justify-center scale-[0.80] sm:scale-90 origin-top">
        {selectedModule === MODULES.LITERACY && <LiteracyMock stage={2} />}
        {selectedModule === MODULES.BILL && <BillMock stage={2} />}
        {selectedModule === MODULES.MEDICINE && <MedicineMock stage={2} />}
        {selectedModule === MODULES.SCAM && <ScamMock stage={2} />}
      </div>

      <div className="sound-wave flex items-center justify-center gap-3 sm:gap-4 w-full relative flex-1 min-h-[80px] sm:min-h-[120px] -mt-8 sm:mt-0">
        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        {[40, 80, 140, 80, 40].map((height, index) => (
          <span
            aria-hidden="true"
            className="block w-3 sm:w-6 origin-center rounded-full bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.5)]"
            key={index}
            style={{ height: `${height/2}px` }}
          />
        ))}
      </div>
      
      <IconButton
        disabled={isProcessing}
        ariaLabel="mikropono"
        className={`h-20 w-20 sm:h-28 sm:w-28 rounded-full border-none mb-2 sm:mb-4 transition-all duration-500 ${isProcessing ? 'bg-indigo-600 shadow-[0_0_60px_rgba(79,70,229,0.6)] scale-110' : 'bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:bg-blue-600 animate-pulse'}`}
        onClick={handleMicClick}
      >
        {isProcessing ? (
          <Loader2 className="h-10 w-10 sm:h-14 sm:w-14 text-white animate-spin" strokeWidth={2} />
        ) : (
          <Mic className="h-8 w-8 sm:h-12 sm:w-12 text-white" strokeWidth={2} />
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
    <section className="page-transition flex h-full flex-col px-4 py-6 sm:px-6 sm:py-10 items-center justify-center gap-12 sm:gap-20">
      <PromptReplayButton promptId="success.good" />
      <div className="relative mt-6 sm:mt-10">
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl" />
        <CheckCircle className="relative z-10 h-48 w-48 sm:h-64 sm:w-64 text-green-400 drop-shadow-[0_0_40px_rgba(74,222,128,0.4)]" strokeWidth={1} />
      </div>
      <IconButton
        disabled={isPlaying}
        ariaLabel="balay"
        className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/5 backdrop-blur-xl"
        onClick={onHome}
      >
        <Home className="h-8 w-8 sm:h-10 sm:w-10 text-white/80" strokeWidth={2} />
      </IconButton>
    </section>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.SPLASH);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

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
          onSelect={(userId) => {
            setSelectedUser(userId);
            setCurrentScreen(SCREENS.MENU);
          }}
        />
      )}
      {currentScreen === SCREENS.MENU && (
        <MenuScreen 
          onStart={(module) => {
            setSelectedModule(module);
            setCurrentScreen(SCREENS.LESSON);
          }} 
        />
      )}
      {currentScreen === SCREENS.LESSON && (
        <LessonScreen
          selectedModule={selectedModule}
          onNext={() => {
            stopPrompt();
            setCurrentScreen(SCREENS.QUIZ1);
          }}
        />
      )}
      {currentScreen === SCREENS.QUIZ1 && (
        <QuizScreen
          phase={1}
          selectedModule={selectedModule}
          onComplete={() => {
            setCurrentScreen(SCREENS.QUIZ2);
          }}
        />
      )}
      {currentScreen === SCREENS.QUIZ2 && (
        <QuizScreen
          phase={2}
          selectedModule={selectedModule}
          onComplete={() => {
            primeSuccessDing();
            setCurrentScreen(SCREENS.LISTENING);
          }}
        />
      )}
      {currentScreen === SCREENS.LISTENING && <ListeningScreen selectedModule={selectedModule} onComplete={completeVoiceCheck} />}
      {currentScreen === SCREENS.SUCCESS && (
        <SuccessScreen
          onHome={() => {
            stopPrompt();
            setSelectedModule(null);
            setCurrentScreen(SCREENS.MENU);
          }}
        />
      )}
    </AppShell>
  );
}
