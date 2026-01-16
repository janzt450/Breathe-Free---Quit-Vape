import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Settings, TrendingUp, Calculator, Calendar, ChevronDown, ChevronUp, Target, Plus, Minus } from 'lucide-react';
import { FinancialConfig } from '../types';

interface FinancialCardProps {
  config: FinancialConfig | null;
  onSaveConfig: (config: FinancialConfig) => void;
  lastPuffTime: number | null;
  startDate: number; // Fallback if no puffs recorded
  currentTimestamp: number;
  onDiscover: (id: string) => void;
}

const PRESETS = [
  { label: '1 Month', days: 30 },
  { label: '6 Months', days: 182.5 },
  { label: '1 Year', days: 365 },
  { label: '5 Years', days: 365 * 5 },
  { label: '10 Years', days: 365 * 10 },
  { label: '20 Years', days: 365 * 20 },
  { label: '50 Years', days: 365 * 50 },
];

const FinancialCard: React.FC<FinancialCardProps> = ({ config, onSaveConfig, lastPuffTime, startDate, currentTimestamp, onDiscover }) => {
  const [isEditing, setIsEditing] = useState(!config);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Edit State
  const [costInput, setCostInput] = useState(config?.costPerUnit.toString() || '20');
  const [daysInput, setDaysInput] = useState(config?.daysPerUnit.toString() || '4');
  const [currency, setCurrency] = useState(config?.currencySymbol || '$');

  // Simulator State
  const [simValue, setSimValue] = useState(1);
  const [simUnit, setSimUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('years');

  // Goal Calculator State
  const [goalInput, setGoalInput] = useState('');

  // Sync state with props (Handles Imports and Clear Data)
  useEffect(() => {
    if (config) {
      setCostInput(config.costPerUnit.toString());
      setDaysInput(config.daysPerUnit.toString());
      setCurrency(config.currencySymbol);
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setCostInput('20');
      setDaysInput('4');
      setCurrency('$');
    }
  }, [config]);

  const toggleCollapse = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (!nextState) {
        onDiscover('financial_expanded');
    }
  };

  // Calculate Daily Cost
  const dailyCost = useMemo(() => {
    if (!config) return 0;
    return config.costPerUnit / Math.max(0.1, config.daysPerUnit);
  }, [config]);

  // Calculate Current Savings
  const currentSavings = useMemo(() => {
    if (!config) return 0;
    const start = lastPuffTime || startDate;
    const now = currentTimestamp;
    const daysElapsed = Math.max(0, (now - start) / (1000 * 60 * 60 * 24));
    return daysElapsed * dailyCost;
  }, [config, lastPuffTime, startDate, dailyCost, currentTimestamp]);

  // Calculate Simulated Value
  const simulatedSavings = useMemo(() => {
    let days = 0;
    switch (simUnit) {
      case 'days': days = simValue; break;
      case 'weeks': days = simValue * 7; break;
      case 'months': days = simValue * 30.44; break;
      case 'years': days = simValue * 365.25; break;
    }
    return days * dailyCost;
  }, [simValue, simUnit, dailyCost]);

  // Calculate Time to Goal
  const timeToGoal = useMemo(() => {
    const goal = parseFloat(goalInput);
    if (isNaN(goal) || goal <= 0 || dailyCost <= 0) return null;
    return Math.ceil(goal / dailyCost);
  }, [goalInput, dailyCost]);

  const handleSave = () => {
    const cost = parseFloat(costInput);
    const days = parseFloat(daysInput);
    if (!isNaN(cost) && !isNaN(days) && days > 0) {
      onSaveConfig({
        costPerUnit: cost,
        daysPerUnit: days,
        currencySymbol: currency
      });
      setIsEditing(false);
    }
  };

  if (isEditing || !config) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6 cursor-pointer group" onClick={toggleCollapse}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-500">
              <DollarSign size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Financial Setup</h3>
          </div>
          <button 
             onClick={toggleCollapse}
             className="p-2 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
             {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="animate-scale-in origin-top">
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
              Track how much money you save by quitting. Tell us about your previous habits to generate your personalized financial timeline.
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cost per Unit/Pack</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.substring(0, 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 text-center bg-slate-100 dark:bg-slate-800 rounded font-bold text-slate-500 border-none focus:ring-0 cursor-pointer"
                      title="Change Currency Symbol"
                    />
                    <input
                      type="number"
                      value={costInput}
                      onChange={(e) => setCostInput(e.target.value)}
                      className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-lg font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                      placeholder="20.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">How long did one unit last?</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={daysInput}
                      onChange={(e) => setDaysInput(e.target.value)}
                      className="w-full pl-4 pr-16 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-lg font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                      placeholder="3"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Days</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Calculator size={18} />
                Start Tracking Savings
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div 
        className={`flex justify-between items-start ${isCollapsed ? '' : 'mb-8'} cursor-pointer group`} 
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-500 shadow-inner">
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Financial Freedom</h3>
            {isCollapsed ? (
               <p className="text-sm font-bold text-amber-500 dark:text-amber-400 mt-1 animate-scale-in">
                  {config.currencySymbol}{currentSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} saved
               </p>
            ) : (
               <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Based on {config.currencySymbol}{dailyCost.toFixed(2)}/day habit</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isCollapsed && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-2 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
            >
              <Settings size={20} />
            </button>
          )}
          <button 
            onClick={toggleCollapse}
            className="p-2 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
          >
             {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="animate-scale-in origin-top">
          {/* Main Savings Display */}
          <div className="mb-10 text-center py-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Saved So Far</span>
            <div className="text-6xl md:text-7xl font-black text-amber-500 dark:text-amber-400 mt-2 tracking-tight flex items-start justify-center gap-1 font-mono">
              <span className="text-3xl mt-2 opacity-50">{config.currencySymbol}</span>
              {currentSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
              <TrendingUp size={12} />
              <span>Keep it growing!</span>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="space-y-8">
            
            {/* 1. Future Milestones */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-amber-500" />
                Future Milestones
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {PRESETS.map((preset) => {
                  const amount = preset.days * dailyCost;
                  return (
                    <div key={preset.label} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl flex flex-col items-center justify-center text-center group hover:border-amber-200 dark:hover:border-amber-900 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{preset.label}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-amber-100 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {config.currencySymbol}{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2. Custom Simulator (Time -> Money) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Calculator size={16} className="text-amber-500" />
                  Savings Simulator
                </h4>
                
                <div className="space-y-6 flex-1">
                  <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        {(['days', 'weeks', 'months', 'years'] as const).map((u) => (
                          <button
                            key={u}
                            onClick={() => {
                              setSimUnit(u);
                              setSimValue(1); 
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                              simUnit === u 
                                ? 'bg-amber-500 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                  </div>

                  {/* Replaced Slider with Input Field */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button 
                      onClick={() => setSimValue(Math.max(1, simValue - 1))}
                      className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                        type="number"
                        min="1"
                        value={simValue}
                        onChange={(e) => setSimValue(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-transparent text-center font-mono text-3xl font-bold text-slate-800 dark:text-white outline-none"
                    />
                    <button 
                      onClick={() => setSimValue(simValue + 1)}
                      className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center mt-auto">
                    <span className="text-xs font-bold text-slate-400 mb-1">Projected Savings</span>
                    <span className="text-3xl font-black text-amber-500 dark:text-amber-400 font-mono">
                      {config.currencySymbol}{simulatedSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Goal Calculator (Money -> Time) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Target size={16} className="text-amber-500" />
                  Goal Calculator
                </h4>
                
                <div className="space-y-6 flex-1 flex flex-col">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{config.currencySymbol}</span>
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="Enter amount (e.g. 500)"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-lg font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center mt-auto flex-1 min-h-[100px]">
                    <span className="text-xs font-bold text-slate-400 mb-1">Time to Reach Goal</span>
                    {timeToGoal ? (
                       <span className="text-3xl font-black text-amber-500 dark:text-amber-400 font-mono">
                         {timeToGoal} <span className="text-lg text-slate-400 font-bold">days</span>
                       </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400 italic">
                        Enter an amount above
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialCard;