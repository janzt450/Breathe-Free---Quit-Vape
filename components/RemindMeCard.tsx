import React, { useState, useEffect } from 'react';
import { BookHeart, Target, Zap, PenLine, Save, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { REMIND_ME_STORAGE_KEY } from '../constants';

interface RemindMeData {
  motivation: string;
  strategies: string;
  benefits: string;
  journal: string;
  isSetup: boolean;
}

const DEFAULT_DATA: RemindMeData = {
  motivation: '',
  strategies: '',
  benefits: '',
  journal: '',
  isSetup: false,
};

interface RemindMeCardProps {
    onDiscover: (id: string) => void;
}

const RemindMeCard: React.FC<RemindMeCardProps> = ({ onDiscover }) => {
  const [data, setData] = useState<RemindMeData>(DEFAULT_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Load data
  useEffect(() => {
    const stored = localStorage.getItem(REMIND_ME_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
        // If not setup, default to expanded so user sees the form initially
        if (!parsed.isSetup) {
             setIsCollapsed(false);
        }
      } catch (e) {
        console.error("Failed to parse remind me data", e);
      }
    } else {
        // First time load
        setIsCollapsed(false);
    }
  }, []);

  const saveData = (newData: RemindMeData) => {
    setData(newData);
    localStorage.setItem(REMIND_ME_STORAGE_KEY, JSON.stringify(newData));
  };

  const handleSetupComplete = () => {
    if (data.motivation.trim()) {
      saveData({ ...data, isSetup: true });
      setIsEditing(false);
      if (onDiscover) onDiscover('remind_setup_complete');
    }
  };

  const handleJournalChange = (text: string) => {
    const newData = { ...data, journal: text };
    setData(newData);
    localStorage.setItem(REMIND_ME_STORAGE_KEY, JSON.stringify(newData));
  };

  const showForm = !data.isSetup || isEditing;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="flex justify-between items-start mb-6 cursor-pointer group" onClick={() => { setIsCollapsed(!isCollapsed); if (isCollapsed && onDiscover) onDiscover('remind_expanded'); }}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-500 shadow-inner">
            <BookHeart size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {showForm ? "Define Your Purpose" : "Remind Me Why"}
            </h3>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {showForm ? "Set your goals" : "Your personal commitment"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            {!showForm && (
                <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsCollapsed(false); }}
                className="p-2 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
                >
                <Edit3 size={20} />
                </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); if (isCollapsed && onDiscover) onDiscover('remind_expanded'); }}
              className="p-2 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
            >
               {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="animate-scale-in origin-top space-y-6">
            
            {showForm ? (
                // SETUP FORM
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <Target size={14} /> I am quitting because...
                        </label>
                        <textarea
                        value={data.motivation}
                        onChange={(e) => setData({ ...data, motivation: e.target.value })}
                        placeholder="e.g., I want to be healthy for my kids, save money, and feel free."
                        className="w-full h-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <Zap size={14} /> When cravings hit, I will...
                        </label>
                        <textarea
                        value={data.strategies}
                        onChange={(e) => setData({ ...data, strategies: e.target.value })}
                        placeholder="e.g., Drink water, take 10 deep breaths, go for a walk."
                        className="w-full h-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <BookHeart size={14} /> The biggest benefit will be...
                        </label>
                        <textarea
                        value={data.benefits}
                        onChange={(e) => setData({ ...data, benefits: e.target.value })}
                        placeholder="e.g., waking up with energy and no cough."
                        className="w-full h-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSetupComplete}
                        disabled={!data.motivation.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        {isEditing ? "Save Changes" : "Commit to Myself"}
                    </button>
                </div>
            ) : (
                // DISPLAY MODE
                <div className="space-y-6">
                    {/* Core Motivation */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Target size={120} />
                        </div>
                        <h4 className="font-bold text-indigo-200 text-xs uppercase tracking-widest mb-2">My Main Goal</h4>
                        <p className="text-xl md:text-2xl font-serif font-medium leading-relaxed italic relative z-10">
                            "{data.motivation}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Strategies */}
                        {data.strategies && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-2 flex items-center gap-2">
                                    <Zap size={16} className="text-amber-500" />
                                    My Strategy
                                </h5>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {data.strategies}
                                </p>
                            </div>
                        )}
                        
                        {/* Benefits */}
                        {data.benefits && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-2 flex items-center gap-2">
                                    <BookHeart size={16} className="text-rose-500" />
                                    The Reward
                                </h5>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {data.benefits}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Free Write Journal */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-3">
                            <PenLine size={14} /> My Journal / Notes
                        </label>
                        <div className="relative group">
                            <textarea
                                value={data.journal}
                                onChange={(e) => handleJournalChange(e.target.value)}
                                placeholder="Write down your thoughts, struggles, or small victories here..."
                                className="w-full min-h-[120px] bg-yellow-50 dark:bg-slate-800/80 border border-yellow-200 dark:border-slate-700 rounded-xl p-4 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 dark:focus:ring-slate-600 resize-y transition-all"
                            />
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400 font-medium bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md pointer-events-none">
                                Auto-saving
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default RemindMeCard;