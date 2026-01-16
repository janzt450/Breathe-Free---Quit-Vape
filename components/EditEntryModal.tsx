import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlignLeft, Trash2, Save, Plus, Minus } from 'lucide-react';
import { LogEntry, LogType } from '../types';

interface EditEntryModalProps {
  entry: LogEntry;
  onClose: () => void;
  onSave: (entry: LogEntry) => void;
  onDelete: (id: string) => void;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ entry, onClose, onSave, onDelete }) => {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    const date = new Date(entry.timestamp);
    // Format YYYY-MM-DD
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setDateStr(`${y}-${m}-${d}`);

    // Format HH:MM
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    setTimeStr(`${h}:${min}`);

    setCount(entry.count || 1);
    setNote(entry.note || '');
  }, [entry]);

  const handleSave = () => {
    const newDate = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(newDate.getTime())) return;

    const updatedEntry: LogEntry = {
      ...entry,
      timestamp: newDate.getTime(),
      count: entry.type === LogType.PUFF ? count : undefined,
      note: note.trim() || undefined
    };

    onSave(updatedEntry);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in border border-transparent dark:border-slate-800">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Entry</h2>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
           {/* Date & Time */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <Calendar size={12} /> Date
                </label>
                <input 
                  type="date" 
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <Clock size={12} /> Time
                </label>
                <input 
                  type="time" 
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
           </div>

           {/* Puff Count (Only if PUFF) */}
           {entry.type === LogType.PUFF && (
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide text-center block">Puff Count</label>
                <div className="flex items-center justify-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <button onClick={() => setCount(Math.max(1, count - 1))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><Minus size={16} /></button>
                    <span className="font-mono text-xl font-bold w-8 text-center">{count}</span>
                    <button onClick={() => setCount(count + 1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><Plus size={16} /></button>
                </div>
             </div>
           )}

           {/* Note */}
           <div className="space-y-1">
             <label className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wide">
                <AlignLeft size={12} /> Note / Title
             </label>
             <textarea 
               value={note}
               onChange={(e) => setNote(e.target.value)}
               placeholder="Add a thought..."
               rows={3}
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
             />
           </div>
        </div>

        <div className="flex gap-3 mt-8">
            <button
                onClick={() => onDelete(entry.id)}
                className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Delete Entry"
            >
                <Trash2 size={20} />
            </button>
            <button
                onClick={handleSave}
                className="flex-1 bg-slate-800 dark:bg-slate-700 text-white font-bold py-4 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <Save size={18} />
                Save Changes
            </button>
        </div>

      </div>
    </div>
  );
};

export default EditEntryModal;