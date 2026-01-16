import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck, Wind, Gem, Trophy, Zap } from 'lucide-react';
import { LogType } from '../types';

interface RewardFeedbackProps {
  type: LogType;
  onAnimationComplete: () => void;
  gamificationEnabled: boolean;
}

const RewardFeedback: React.FC<RewardFeedbackProps> = ({ type, onAnimationComplete, gamificationEnabled }) => {
  const [isExiting, setIsExiting] = useState(false);
  
  // Use a ref to ensure we call the latest callback without resetting the timer on prop changes
  const onCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    // Start exit animation before unmounting
    const exitTimer = setTimeout(() => {
        setIsExiting(true);
    }, 2200);

    // Unmount
    const completeTimer = setTimeout(() => {
        onCompleteRef.current();
    }, 2500);

    return () => {
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
    };
  }, []);

  const isResist = type === LogType.RESIST;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm rounded-[2rem] p-4 text-center ${isExiting ? 'animate-out fade-out duration-300 fill-mode-forwards' : 'animate-in fade-in duration-200'}`}>
        
        {/* Icon Blob */}
        <div className={`relative p-4 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] ${isResist ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30' : 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/30'} mb-3`}>
           {isResist ? <ShieldCheck size={36} className="text-white drop-shadow-md" /> : <Wind size={36} className="text-white drop-shadow-md" />}
           
           {/* Particles (CSS only simple effect) */}
           <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-20"></div>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
          {isResist ? 'Victory!' : 'Setback'}
        </h2>
        
        {gamificationEnabled && (
            <div className="flex items-center justify-center gap-2 w-full mt-2">
                {isResist ? (
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 animate-in slide-in-from-left-4 delay-150 fill-mode-both duration-500">
                            <Gem size={14} className="text-cyan-400" />
                            <span className="text-white font-mono font-bold text-sm">+5</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 animate-in slide-in-from-right-4 delay-300 fill-mode-both duration-500">
                            <Trophy size={14} className="text-indigo-400" />
                            <span className="text-white font-mono font-bold text-sm">+1 XP</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-orange-400 bg-orange-950/30 px-3 py-1.5 rounded-xl border border-orange-900/50">
                        <Zap size={14} />
                        <span className="text-xs font-bold">Streak Reset</span>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default RewardFeedback;