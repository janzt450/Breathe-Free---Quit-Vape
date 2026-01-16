import React, { useState } from 'react';
import { getPersonalizedCoaching } from '../services/geminiService';
import { LogEntry } from '../types';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';

interface CoachProps {
  entries: LogEntry[];
}

const Coach: React.FC<CoachProps> = ({ entries }) => {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<{ message: string; tip: string } | null>(null);

  const handleGetAdvice = async () => {
    setLoading(true);
    const result = await getPersonalizedCoaching(entries);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-yellow-300" size={20} />
          <h3 className="font-bold text-lg">AI Insight Coach</h3>
        </div>

        {!advice && !loading && (
          <div className="text-indigo-100 mb-4">
            Need a little boost or analysis of your habits? Ask your AI coach for personalized advice.
          </div>
        )}

        {advice && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20 animate-fade-in">
            <p className="font-medium text-lg mb-2">{advice.message}</p>
            <div className="flex items-start gap-2 mt-3 text-sm bg-indigo-900/30 p-2 rounded-lg">
              <Lightbulb className="text-yellow-300 shrink-0 mt-0.5" size={16} />
              <span className="text-indigo-100">{advice.tip}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleGetAdvice}
          disabled={loading}
          className="w-full bg-white text-indigo-600 font-semibold py-3 px-4 rounded-xl shadow-md hover:bg-indigo-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Thinking...
            </>
          ) : (
            <>
              {advice ? 'Get New Insights' : 'Analyze My Progress'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Coach;
