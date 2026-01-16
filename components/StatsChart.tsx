import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import { LogEntry, LogType } from '../types';

interface StatsChartProps {
  entries: LogEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const StatsChart: React.FC<StatsChartProps> = ({ entries, selectedDate, onSelectDate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const data = useMemo(() => {
    // Generate last 7 days based on LOCAL time
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }

    return days.map(dateStr => {
      const dayEntries = entries.filter(e => {
        const entryDate = new Date(e.timestamp);
        const eYear = entryDate.getFullYear();
        const eMonth = String(entryDate.getMonth() + 1).padStart(2, '0');
        const eDay = String(entryDate.getDate()).padStart(2, '0');
        return `${eYear}-${eMonth}-${eDay}` === dateStr;
      });

      const puffs = dayEntries
        .filter(e => e.type === LogType.PUFF)
        .reduce((sum, e) => sum + (e.count || 0), 0);

      const resists = dayEntries
        .filter(e => e.type === LogType.RESIST)
        .length;

      // Parse back for display label
      const [y, m, d] = dateStr.split('-').map(Number);
      const displayDate = new Date(y, m - 1, d);
      
      return {
        dateStr, // Keep original string for comparison
        rawDate: displayDate,
        date: displayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        puffs,
        resists
      };
    });
  }, [entries]);

  // Generate comparison string for selected date
  const selectedDateStr = useMemo(() => {
     const year = selectedDate.getFullYear();
     const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
     const day = String(selectedDate.getDate()).padStart(2, '0');
     return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedData = data.activePayload[0].payload;
      onSelectDate(clickedData.rawDate);
    }
  };

  // Hardcoded Dark Theme Colors
  const colors = {
    grid: '#334155', // slate-700
    text: '#94a3b8', // slate-400
    puffSelected: '#f97316', // orange-500
    puffDefault: '#c2410c', // orange-700
    resistSelected: '#22c55e', // green-500
    resistDefault: '#065f46', // green-800
    tooltipBg: '#1e293b', // slate-800
    tooltipText: '#ffffff'
  };

  if (entries.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-sm bg-slate-900 rounded-2xl border border-slate-800 shadow-sm mb-8 transition-colors duration-300">
        <p>No activity yet.</p>
        <p className="text-xs mt-1">Log your first resist or puff to see data.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 p-6 rounded-[2rem] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-800 mb-8 transition-colors duration-300">
      <div 
        className={`flex justify-between items-center ${isCollapsed ? '' : 'mb-6'} cursor-pointer group`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
          <BarChart2 size={20} className="text-slate-500" />
          Weekly Timeline
        </h3>
        
        <div className="flex items-center gap-4">
            {!isCollapsed && (
                <div className="flex gap-4 text-xs font-medium animate-fade-in">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                        <span className="text-slate-400">Puffs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        <span className="text-slate-400">Resisted</span>
                    </div>
                </div>
            )}
            <button 
                className="p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-full hover:bg-slate-800"
            >
                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="h-64 w-full animate-scale-in origin-top">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                data={data} 
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                onClick={handleBarClick}
                className="cursor-pointer"
                >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: colors.text, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: colors.text }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    cursor={{ fill: '#334155', opacity: 0.5 }}
                    content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                        <div className="bg-slate-800 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700">
                            <p className="font-bold mb-2 text-slate-200">{payload[0].payload.fullDate}</p>
                            <div className="space-y-1">
                            <p className="flex justify-between gap-4">
                                <span className="text-orange-400">Puffs:</span>
                                <span className="font-mono font-bold text-white">{payload[0].value}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                                <span className="text-green-400">Resisted:</span>
                                <span className="font-mono font-bold text-white">{payload[1].value}</span>
                            </p>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-500 italic">Click to view timeline</p>
                        </div>
                        );
                    }
                    return null;
                    }}
                />
                <Bar 
                    dataKey="puffs" 
                    stackId="a" 
                    radius={[0, 0, 4, 4]} 
                    barSize={16}
                    animationDuration={600}
                >
                    {data.map((entry, index) => (
                    <Cell 
                        key={`cell-puff-${index}`} 
                        fill={entry.dateStr === selectedDateStr ? colors.puffSelected : colors.puffDefault} 
                    />
                    ))}
                </Bar>
                <Bar 
                    dataKey="resists" 
                    stackId="a" 
                    radius={[4, 4, 0, 0]} 
                    barSize={16}
                    animationDuration={600}
                >
                    {data.map((entry, index) => (
                    <Cell 
                        key={`cell-resist-${index}`} 
                        fill={entry.dateStr === selectedDateStr ? colors.resistSelected : colors.resistDefault} 
                    />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StatsChart;