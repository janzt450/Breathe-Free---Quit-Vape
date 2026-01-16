import React, { useMemo, useState } from 'react';
import { LogEntry, LogType } from '../types';
import { ShieldCheck, Wind, Trash2, Clock, Pencil, FileText, Calendar, List, LayoutList, AlignLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface LogHistoryProps {
  entries: LogEntry[];
  selectedDate: Date;
  onDelete: (id: string) => void;
  onEdit: (entry: LogEntry) => void;
}

const LogHistory: React.FC<LogHistoryProps> = ({ entries, selectedDate, onDelete, onEdit }) => {
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Filter entries for the selected date and sort descending (newest first)
  const dayEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return (
        entryDate.getFullYear() === selectedDate.getFullYear() &&
        entryDate.getMonth() === selectedDate.getMonth() &&
        entryDate.getDate() === selectedDate.getDate()
      );
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, selectedDate]);

  const formatDateTitle = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
      
      {/* Header */}
      <div 
        className="flex flex-row items-center justify-between gap-4 cursor-pointer group"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Clock size={24} />
          </div>
          <div>
             <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 transition-colors">Day Timeline</h3>
             <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Your activity log</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {!isCollapsed && (
                <>
                    {/* View Mode Toggle */}
                    <div 
                        className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setViewMode('detailed')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-slate-600 text-indigo-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="Detailed View"
                        >
                            <LayoutList size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('compact')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'compact' ? 'bg-white dark:bg-slate-600 text-indigo-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="Compact View"
                        >
                            <List size={16} />
                        </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {formatDateTitle(selectedDate)}
                        </span>
                    </div>
                </>
            )}

            <button 
                className="p-2 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
        </div>
      </div>

      {/* Feed Container */}
      {!isCollapsed && (
        <div className="relative mt-6 animate-scale-in origin-top">
            {dayEntries.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <Clock size={24} className="opacity-50" />
                </div>
                <p className="font-bold text-base text-slate-500 dark:text-slate-400">No activity yet</p>
                <p className="text-xs mt-1">Logs for this day will appear here</p>
            </div>
            ) : (
            /* Scrollable Area */
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                <div className="space-y-0">
                {dayEntries.map((entry, index) => {
                    const isResist = entry.type === LogType.RESIST;
                    const date = new Date(entry.timestamp);
                    const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                    const isFirst = index === 0;
                    const isLast = index === dayEntries.length - 1;

                    // --- COMPACT VIEW ---
                    if (viewMode === 'compact') {
                        return (
                            <div key={entry.id} className="flex gap-3 group items-center relative py-1.5">
                                {/* Line */}
                                {dayEntries.length > 1 && (
                                    <div 
                                    className="absolute left-3 w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2"
                                    style={{
                                        top: isFirst ? '50%' : '0',
                                        bottom: isLast ? '50%' : '0',
                                    }}
                                    ></div>
                                )}

                                {/* Dot */}
                                <div className={`relative z-10 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shrink-0 ml-[4.5px] ${
                                    isResist ? 'bg-emerald-500' : 'bg-orange-500'
                                }`}></div>

                                {/* Row Content */}
                                <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors flex items-center gap-3">
                                    <span className="text-xs font-mono text-slate-400 shrink-0 w-16">{timeString}</span>
                                    
                                    <div className={`flex items-center gap-2 font-bold text-sm truncate flex-1 ${isResist ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                        {isResist ? <ShieldCheck size={14} /> : <Wind size={14} />}
                                        <span className="truncate">{isResist ? 'Resisted' : `${entry.count} Puff${entry.count !== 1 ? 's' : ''}`}</span>
                                    </div>

                                    {entry.note && (
                                        <div className="shrink-0 text-slate-400" title={entry.note}>
                                            <AlignLeft size={14} />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onEdit(entry)}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-500 transition-colors"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(entry.id)}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // --- DETAILED VIEW ---
                    return (
                    <div key={entry.id} className="flex gap-4 sm:gap-6 group">
                        {/* Left Column: Timeline Graphic */}
                        <div className="relative flex flex-col items-center w-8 sm:w-10 shrink-0">
                            {/* Line */}
                            {dayEntries.length > 1 && (
                            <div 
                                className="absolute w-0.5 bg-slate-200 dark:bg-slate-800 left-1/2 -translate-x-1/2"
                                style={{
                                top: isFirst ? '28px' : '0',
                                bottom: isLast ? 'auto' : '0',
                                height: isLast ? '28px' : 'auto'
                                }}
                            ></div>
                            )}
                            
                            {/* Dot */}
                            <div className={`relative z-10 w-4 h-4 rounded-full mt-5 border-[3px] border-white dark:border-slate-900 shadow-sm ${
                            isResist ? 'bg-emerald-500' : 'bg-orange-500'
                            }`}></div>
                        </div>

                        {/* Right Column: Content Card */}
                        <div className="flex-1 pb-4 min-w-0">
                            <div className="bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300">
                                
                                <div className="flex items-start justify-between gap-3">
                                {/* Icon & Main Text */}
                                <div className="flex items-start gap-3 sm:gap-4 overflow-hidden">
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                        isResist 
                                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                                        : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                    }`}>
                                        {isResist ? <ShieldCheck size={18} /> : <Wind size={18} />}
                                    </div>
                                    
                                    <div className="min-w-0">
                                        <h4 className={`font-bold text-sm sm:text-base truncate ${isResist ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                            {isResist ? 'Resisted Craving' : `${entry.count} Puff${entry.count !== 1 ? 's' : ''}`}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Clock size={10} /> {timeString}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => onEdit(entry)}
                                        className="p-2 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm hover:text-indigo-500 hover:border-indigo-200 transition-all"
                                        title="Edit"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button 
                                        onClick={() => onDelete(entry.id)}
                                        className="p-2 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm hover:text-red-500 hover:border-red-200 transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                </div>

                                {/* Note Section */}
                                {entry.note && (
                                <div className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <FileText size={12} className="mt-0.5 shrink-0 text-slate-400" />
                                    <p className="leading-relaxed text-xs">{entry.note}</p>
                                </div>
                                )}

                            </div>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default LogHistory;