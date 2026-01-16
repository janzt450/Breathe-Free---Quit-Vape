import React, { useState } from 'react';
import { Megaphone, AlertTriangle, ChevronDown, ChevronUp, Globe, Factory, Skull } from 'lucide-react';

interface CallToActionCardProps {
  onAction: () => void;
  isCompleted: boolean;
}

const CallToActionCard: React.FC<CallToActionCardProps> = ({ onAction, isCompleted }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-red-900/30 transition-colors duration-300 relative overflow-hidden group">
      {/* Background Pulse Effect */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <AlertTriangle size={120} className="text-red-500" />
      </div>

      <div className="flex justify-between items-start cursor-pointer relative z-10" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-900/20 rounded-xl text-red-500 shadow-inner">
            <Megaphone size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200 group-hover:text-red-400 transition-colors">Fight Back!</h3>
             <p className="text-xs font-medium text-slate-500">Know Your Enemy</p>
          </div>
        </div>
        <button 
           className="p-2 text-slate-500 hover:text-slate-300 transition-colors rounded-full hover:bg-slate-800"
        >
           {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 animate-scale-in origin-top space-y-6 relative z-10">
          
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <h4 className="flex items-center gap-2 font-bold text-slate-100 mb-2">
                    <Skull size={16} className="text-slate-400" /> 
                    Tobacco Playbook 2.0
                </h4>
                <p className="mb-3">
                    For decades, Big Tobacco denied that cigarettes caused cancer while internally optimizing nicotine delivery for maximum addiction. Today, those same conglomerates (Altria, Philip Morris) have bought major stakes in the vaping industry. They aren't helping you quit; they are migrating their user base to a new, loosely regulated platform to sustain their profit margins.
                </p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <h4 className="flex items-center gap-2 font-bold text-slate-100 mb-2">
                    <Factory size={16} className="text-slate-400" /> 
                    The Disposable Crisis
                </h4>
                <p className="mb-3">
                    The market is currently flooded with disposable vapes, primarily manufactured in unregulated facilities in Shenzhen, China. These devices exploit loopholes in FDA enforcement by using synthetic nicotine.
                </p>
                <p>
                    Investigations have found these devices often contain nicotine levels far higher than labeled, along with unlisted heavy metals leached from cheap heating elements. You are essentially inhaling aerosolized chemistry experiments from a supply chain with zero accountability.
                </p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <h4 className="flex items-center gap-2 font-bold text-slate-100 mb-2">
                    <Globe size={16} className="text-slate-400" /> 
                    Environmental Negligence
                </h4>
                <p>
                    Every disposable vape contains a lithium-ion battery and plastic casing. Millions are discarded every week, leaching toxic battery acid into soil and water tables. This is a manufactured environmental disaster designed solely for recurring revenue.
                </p>
            </div>

            <div className="px-2 pt-2 pb-4">
                <p className="text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                    SOURCES: <br/>
                    1. Truth Initiative, "Tobacco Industry Marketing" <br/>
                    2. Bureau of Investigative Journalism, "The lighter that never goes out" <br/>
                    3. CDC, "E-cigarette Use Among Youth"
                </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CallToActionCard;