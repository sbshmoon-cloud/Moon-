import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Play, Pause, RotateCcw, Brain, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function FocusZone() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'study') {
        handleSessionEnd();
      } else {
        setMode('study');
        setTimeLeft(25 * 60);
      }
      setIsActive(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const handleSessionEnd = async () => {
    setSessionsCompleted(prev => prev + 1);
    setMode('break');
    setTimeLeft(5 * 60);
    
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'studySessions'), {
          userId: auth.currentUser.uid,
          duration: 25,
          startTime: serverTimestamp(),
          notes: 'Auto-logged from Focus Zone'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'studySessions');
      }
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex-1 overflow-auto bg-[#FBFBFA] flex flex-col items-center justify-center p-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-[48px] shadow-[0_30px_70px_rgba(0,0,0,0.04)] border border-slate-100 p-16 text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-12">
          {(['study', 'break'] as const).map((m) => (
             <button
              key={m}
              onClick={() => {
                setMode(m);
                setTimeLeft(m === 'study' ? 25 * 60 : 5 * 60);
                setIsActive(false);
              }}
              className={cn(
                "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                mode === m ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-900"
              )}
             >
               {m}
             </button>
          ))}
        </div>

        <div className="relative mb-16 h-80 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="140"
              className="stroke-slate-50"
              strokeWidth="8"
              fill="transparent"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="140"
              className={cn("transition-all duration-1000", mode === 'study' ? "stroke-slate-900" : "stroke-indigo-400")}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={880}
              strokeDashoffset={880 * (timeLeft / (mode === 'study' ? 25 * 60 : 5 * 60))}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[100px] font-black tabular-nums tracking-tighter leading-none text-slate-900">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 mt-4">
              Deep Focus Work
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <button
            onClick={resetTimer}
            className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all hover:scale-110"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          <button
            onClick={toggleTimer}
            className={cn(
              "w-24 h-24 rounded-[32px] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-95",
              isActive ? "bg-slate-900" : "bg-slate-900"
            )}
          >
            {isActive ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-2" />}
          </button>

          <button
            className={cn(
              "w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center transition-all",
              sessionsCompleted > 0 ? "text-indigo-500" : "text-slate-200"
            )}
          >
            <Brain className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={cn("w-2 h-2 rounded-full", i < sessionsCompleted ? "bg-slate-900" : "bg-slate-100")} />
            ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {sessionsCompleted}/4 Daily Sessions
          </span>
        </div>
      </motion.div>

      <div className="mt-12 text-center text-slate-400">
        <p className="text-sm font-medium italic opacity-60 italic font-serif">"The secret of getting ahead is getting started."</p>
      </div>
    </div>
  );
}
