import React, { useState } from 'react';
import { AlertCircle, Wind, HeartPulse, ShieldAlert, ChevronDown, ChevronUp, ExternalLink, Brain, Globe, Factory, Zap, Battery, Droplets, Users, Flame, Skull } from 'lucide-react';

type Tab = 'health' | 'environment' | 'society';

interface WhyQuitCardProps {
  onDiscover: (id: string) => void;
  onOpenLink: (url: string) => void;
}

const WhyQuitCard: React.FC<WhyQuitCardProps> = ({ onDiscover, onOpenLink }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('health');

  const handleExpand = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const nextState = !isExpanded;
      setIsExpanded(nextState);
      if (nextState) {
          onDiscover('why_expanded');
      }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="flex justify-between items-start cursor-pointer group" onClick={handleExpand}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-500 shadow-inner">
            <HeartPulse size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Why Quit?</h3>
             <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Health, Environmental & Social Impact</p>
          </div>
        </div>
        <button 
           className="p-2 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
           {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 animate-scale-in origin-top space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveTab('health'); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'health' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <Brain size={14} /> My Health
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveTab('environment'); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'environment' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <Globe size={14} /> The Planet
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveTab('society'); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'society' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <Users size={14} /> Society
            </button>
          </div>

          {/* HEALTH TAB */}
          {activeTab === 'health' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl p-5 border border-rose-100 dark:border-rose-900/20">
                    <div className="flex gap-3">
                        <Brain className="text-rose-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-rose-700 dark:text-rose-400 text-sm mb-1">The Anxiety Loop</h4>
                            <p className="text-xs leading-relaxed text-rose-600/80 dark:text-rose-300/80">
                                Vaping doesn't reduce stress; it creates it. The "relief" you feel is merely the abatement of withdrawal symptoms you wouldn't have without the nicotine. This cycle keeps your body in a chronic state of fight-or-flight.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-orange-500" />
                            Hidden Chemistry
                        </h5>
                        <ul className="space-y-3">
                            <li className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Formaldehyde:</strong> 
                                High-wattage vaping generates this Group 1 carcinogen via thermal degradation of fluids.
                            </li>
                            <li className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Heavy Metals:</strong> 
                                Heating coils leach lead, nickel, and chromium directly into the aerosol you inhale.
                            </li>
                            <li className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Bronchiolitis Obliterans:</strong> 
                                Flavoring agents like diacetyl cause irreversible scarring of the smallest airways ("Popcorn Lung").
                            </li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                         <div>
                            <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                                <HeartPulse size={16} className="text-rose-500" />
                                Cardiovascular Strain
                            </h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Nicotine stiffens your blood vessels (endothelial dysfunction) instantly. This forces your heart to pump harder, increasing risks of hypertension and long-term heart disease.
                            </p>
                         </div>
                         <div className="bg-rose-100 dark:bg-rose-900/20 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-1">Did you know?</p>
                            <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                                Current e-cigarette users have double the odds of a depression diagnosis compared to non-users.
                            </p>
                         </div>
                    </div>
                </div>
            </div>
          )}

          {/* ENVIRONMENT TAB */}
          {activeTab === 'environment' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/20">
                    <div className="flex gap-3">
                        <Battery className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mb-1">The Lithium Drain</h4>
                            <p className="text-xs leading-relaxed text-emerald-600/80 dark:text-emerald-300/80">
                                Disposables are an environmental disaster. In the UK alone, 10 tonnes of lithium are discarded in vapes annually—enough to build batteries for 1,200 electric vehicles. We are throwing away the "white gold" of the energy transition.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                            <Droplets size={16} className="text-blue-500" />
                            Toxic Leaching
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                            When vapes are crushed in landfills, they release a toxic cocktail. Residual nicotine (a pesticide) and battery electrolytes leach into the soil and groundwater.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Plastic casings degrade into microplastics, entering the food web and persisting for centuries.
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                            <Flame size={16} className="text-orange-500" />
                            Explosive Waste
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                            Lithium-ion batteries are volatile. When trash trucks compact waste containing hidden vapes, "thermal runaway" causes fires.
                        </p>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-100 dark:border-orange-900/30">
                             <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">
                                 Fact: Battery fires in waste streams have increased by 71% in recent years.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* SOCIETY TAB */}
          {activeTab === 'society' && (
             <div className="space-y-4 animate-fade-in">
                {/* Hero: Big Tobacco (Merged from Fight Back) */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/20">
                    <div className="flex gap-3">
                        <Skull className="text-indigo-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm mb-1">Tobacco Playbook 2.0</h4>
                            <p className="text-xs leading-relaxed text-indigo-600/80 dark:text-indigo-300/80">
                                Big Tobacco conglomerates (Altria, Philip Morris) have bought major stakes in the vaping industry. They are migrating their user base to a new, loosely regulated platform to sustain their profit margins, repeating history by denying harms while optimizing addiction.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cobalt (Existing) */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                            <Factory size={16} className="text-orange-500" />
                            Human Cost of Cobalt
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Vape batteries rely on cobalt, often mined by children in the DRC exposed to toxic dust. Your "disposable" device has a permanent human cost.
                        </p>
                    </div>

                    {/* Disposable Crisis (Merged from Fight Back) */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-red-500" />
                            The Disposable Crisis
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Flooded with unregulated devices from Shenzhen, the market exploits loopholes using synthetic nicotine. These often contain unlisted heavy metals and nicotine levels far higher than labeled.
                        </p>
                    </div>

                    {/* Environmental Justice (Existing) */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                            <Globe size={16} className="text-emerald-500" />
                            Environmental Justice
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            E-waste is exported to developing nations like Ghana, where burning plastics to recover copper releases dioxins, poisoning local communities.
                        </p>
                    </div>
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-yellow-500" />
                            Engineered Addiction
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            "Nicotine salts" lower pH to allow higher concentrations without irritation, mimicking the rapid arterial spike of cigarettes to rewire adolescent brains.
                        </p>
                    </div>
                </div>
             </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium">Data Sources: CDC, EPA, Amnesty International</span>
            <button 
              onClick={() => onOpenLink("https://www.cdc.gov/tobacco/e-cigarettes/health-effects.html")}
              className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              Verify The Data <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhyQuitCard;