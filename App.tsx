import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, X, Wind, ShieldCheck, Settings, Trash2, AlertTriangle, Calendar, Download, Upload, Clock, GripHorizontal, Gem, Bug, Layout, Gamepad2, ToggleLeft, ToggleRight, Trophy, Github, Edit2, PlayCircle, RefreshCw, Share2, Shield, Lock, FileCode, CheckCircle2, Info, Bot, Sparkles, Leaf, Map } from 'lucide-react';
import { LogEntry, LogType, FinancialConfig, InventoryItem } from './types';
import { APP_STORAGE_KEY, REMIND_ME_STORAGE_KEY, INVENTORY_STORAGE_KEY, WALLET_STORAGE_KEY, SETTINGS_STORAGE_KEY, QUIT_DATE_STORAGE_KEY } from './constants';
import LogHistory from './components/LogHistory';
import StatsChart from './components/StatsChart';
import FinancialCard from './components/FinancialCard';
import WhyQuitCard from './components/WhyQuitCard';
import GamificationCard from './components/GamificationCard';
import RemindMeCard from './components/RemindMeCard';
import EditEntryModal from './components/EditEntryModal';
import RewardFeedback from './components/RewardFeedback';
import CivicActionCard from './components/CivicActionCard';

const FINANCIAL_STORAGE_KEY = 'breathfree_financial_v1';
const CARD_ORDER_STORAGE_KEY = 'breathfree_card_order_v1';

// Helper to calculate time difference formatted
const getTimeDifference = (timestamp: number | null, now: number) => {
  if (!timestamp) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = now - timestamp;
  if (diff < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }; 
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPuffModal, setShowPuffModal] = useState(false);
  const [puffCount, setPuffCount] = useState(1);
  const [quitTimestamp, setQuitTimestamp] = useState<number | null>(null);
  
  // Master Time State
  const [now, setNow] = useState(Date.now());
  const [timer, setTimer] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [enableGamification, setEnableGamification] = useState(true);

  // Modal States
  const [showAbout, setShowAbout] = useState(false);
  const [showOpenSource, setShowOpenSource] = useState(false);
  const [showAITransparency, setShowAITransparency] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  // Edit/Past Entry State
  const [showPastModal, setShowPastModal] = useState(false);
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);

  // Initializing with local date to prevent timezone issues (e.g. late night defaults to tomorrow UTC)
  const [pastDate, setPastDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [pastTime, setPastTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [pastType, setPastType] = useState<LogType>(LogType.RESIST);
  const [pastPuffs, setPastPuffs] = useState(1);
  
  // Feedback State
  const [rewardFeedback, setRewardFeedback] = useState<{show: boolean, type: LogType} | null>(null);
  
  // Inventory & Wallet State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [walletState, setWalletState] = useState<{ spent: number; debug: number; earned: number; xp: number; discovered: string[] }>({ 
      spent: 0, 
      debug: 0, 
      earned: 0, 
      xp: 0,
      discovered: []
  });

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default selected date to today
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Card Reordering State
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(CARD_ORDER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const defaultKeys = ['financial', 'stats', 'history', 'remind', 'why', 'gamification', 'civic'];
        const merged = [...new Set([...parsed, ...defaultKeys])];
        return merged;
      } catch (e) {
        console.error("Failed to parse card order", e);
      }
    }
    return ['financial', 'stats', 'history', 'remind', 'why', 'gamification', 'civic'];
  });

  // Refs for card scrolling
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  // Trigger state for sharing
  const [shareTrigger, setShareTrigger] = useState(0);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Helper function to calculate latest puff time from entries
  const calculateLastPuffTime = (currentEntries: LogEntry[]) => {
    const puffEntries = currentEntries.filter(e => e.type === LogType.PUFF);
    if (puffEntries.length > 0) {
      const latest = puffEntries.sort((a, b) => b.timestamp - a.timestamp)[0];
      return latest.timestamp;
    }
    return null;
  };

  // Load data on mount
  useEffect(() => {
    const storedLogs = localStorage.getItem(APP_STORAGE_KEY);
    const storedFinance = localStorage.getItem(FINANCIAL_STORAGE_KEY);
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    const storedWallet = localStorage.getItem(WALLET_STORAGE_KEY);
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const storedQuitDate = localStorage.getItem(QUIT_DATE_STORAGE_KEY);

    let parsedEntries: LogEntry[] = [];

    if (storedLogs) {
      try {
        const parsed = JSON.parse(storedLogs);
        if (Array.isArray(parsed)) {
          parsedEntries = parsed;
          setEntries(parsed);
        }
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }

    if (storedQuitDate) {
        setQuitTimestamp(parseInt(storedQuitDate));
    } else {
        // Fallback for existing users: Use last puff time if it exists
        const lastPuff = calculateLastPuffTime(parsedEntries);
        if (lastPuff) {
            setQuitTimestamp(lastPuff);
            localStorage.setItem(QUIT_DATE_STORAGE_KEY, lastPuff.toString());
        }
    }

    if (storedFinance) {
      try {
        setFinancialConfig(JSON.parse(storedFinance));
      } catch (e) {
        console.error("Failed to parse financial config", e);
      }
    }

    if (storedInventory) {
      try {
        const parsed = JSON.parse(storedInventory);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            const migrated = parsed.map((id: string) => ({ id, purchasedAt: Date.now() }));
            setInventory(migrated);
            localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(migrated));
        } else {
            setInventory(parsed);
        }
      } catch(e) { console.error(e); }
    }

    if (storedWallet) {
      try {
        const parsed = JSON.parse(storedWallet);
        setWalletState({
            spent: parsed.spent || 0,
            debug: parsed.debug || 0,
            earned: parsed.earned || 0,
            xp: parsed.xp || 0,
            discovered: Array.isArray(parsed.discovered) ? parsed.discovered : []
        });
      } catch(e) { console.error(e); }
    }

    if (storedSettings) {
        try {
            const parsed = JSON.parse(storedSettings);
            if (typeof parsed.enableGamification !== 'undefined') {
                setEnableGamification(parsed.enableGamification);
            }
        } catch(e) { console.error(e); }
    }

    setIsLoaded(true);
    // Immediately calculate time once data is loaded to prevent "00:00:00" flash on reopening
    setNow(Date.now());
  }, []);

  // Save data on change - ONLY if loaded
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  // Save Settings
  useEffect(() => {
      if (isLoaded) {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ enableGamification }));
      }
  }, [enableGamification, isLoaded]);

  const saveFinancialConfig = (config: FinancialConfig) => {
    setFinancialConfig(config);
    localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(config));
  };

  const updateQuitTimestamp = (ts: number | null) => {
      setQuitTimestamp(ts);
      if (ts) {
          localStorage.setItem(QUIT_DATE_STORAGE_KEY, ts.toString());
      } else {
          localStorage.removeItem(QUIT_DATE_STORAGE_KEY);
      }
  };

  // Master Time Loop & Re-synchronization Logic
  useEffect(() => {
    const updateTime = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      setTimer(getTimeDifference(quitTimestamp, currentTime));
    };

    // 1. Regular interval for UI updates
    const interval = setInterval(updateTime, 1000); 
    
    // 2. Initial call to set state immediately
    updateTime(); 

    // 3. Handle App Resume/Wake (Crucial for offline time calculation)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App just came to foreground or computer woke up
        // Immediate recalculation of elapsed time
        updateTime();
      }
    };
    
    // 4. Handle Window Focus (Extra redundancy for Desktop App)
    const handleFocus = () => {
        updateTime();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [quitTimestamp]);

  const handleStartTimer = () => {
      const now = Date.now();
      updateQuitTimestamp(now);
      setNow(now);
  };

  const handleOpenShare = () => {
    setShareTrigger(Date.now());
    const civicCard = cardRefs.current['civic'];
    if (civicCard) {
        civicCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAddEntry = useCallback(async (type: LogType, count?: number, timestamp?: number) => {
    // 1. Clamp time to prevent future-date bugs (Timer appearing stopped)
    let ts = timestamp || Date.now();
    if (ts > Date.now()) ts = Date.now();

    const newEntry: LogEntry = {
      id: crypto.randomUUID(),
      type,
      timestamp: ts,
      count: type === LogType.PUFF ? count : undefined,
    };

    // 2. Add and Sort entries immediately
    setEntries(prev => {
        const updated = [newEntry, ...prev].sort((a, b) => b.timestamp - a.timestamp);
        return updated;
    });

    setShowPuffModal(false);
    setShowPastModal(false);
    setPuffCount(1);
    
    setSelectedDate(new Date(ts));
    
    // 3. Robust Quit Time Update using Functional State
    // This fixes the issue where retroactive puffs wouldn't update the timer because of stale closure
    if (type === LogType.PUFF) {
        setQuitTimestamp(currentQuitTs => {
            // Update if no current time, or if new puff is MORE RECENT than current quit time
            // This handles the "Relapse" logic correctly even for retroactive puffs
            if (!currentQuitTs || ts >= currentQuitTs) {
                localStorage.setItem(QUIT_DATE_STORAGE_KEY, ts.toString());
                return ts;
            }
            return currentQuitTs;
        });
    }
    
    // Force a time update
    setNow(Date.now());

    // Show Reward Feedback if it's a real-time entry (not past)
    if (!timestamp) {
        setRewardFeedback({ show: true, type });
    }
  }, []); // Removed quitTimestamp dependency

  const handleUpdateEntry = useCallback((updatedEntry: LogEntry) => {
    setEntries(prev => {
        const newEntries = prev.map(e => e.id === updatedEntry.id ? updatedEntry : e);
        return newEntries.sort((a, b) => b.timestamp - a.timestamp);
    });
    setEditingEntry(null);
    setNow(Date.now());
  }, []);

  const handlePastSubmit = () => {
    const dateObj = new Date(`${pastDate}T${pastTime}`);
    if (isNaN(dateObj.getTime())) return;
    handleAddEntry(pastType, pastType === LogType.PUFF ? pastPuffs : undefined, dateObj.getTime());
  };

  const handleManualDateChange = () => {
      const dateObj = new Date(`${pastDate}T${pastTime}`);
      if (!isNaN(dateObj.getTime())) {
          updateQuitTimestamp(dateObj.getTime());
          setShowEditDateModal(false);
      }
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (editingEntry?.id === id) {
        setEditingEntry(null);
    }
  };

  const handleClearAllData = () => {
    setEntries([]);
    setFinancialConfig(null);
    setInventory([]);
    setWalletState({ spent: 0, debug: 0, earned: 0, xp: 0, discovered: [] });
    setQuitTimestamp(null);
    
    localStorage.removeItem(APP_STORAGE_KEY);
    localStorage.removeItem(FINANCIAL_STORAGE_KEY);
    localStorage.removeItem(REMIND_ME_STORAGE_KEY);
    localStorage.removeItem(CARD_ORDER_STORAGE_KEY);
    localStorage.removeItem(INVENTORY_STORAGE_KEY);
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    localStorage.removeItem(QUIT_DATE_STORAGE_KEY);
    
    setShowClearConfirm(false);
    setShowSettings(false);
    window.location.reload();
  };

  const handleExport = () => {
    const remindMeData = localStorage.getItem(REMIND_ME_STORAGE_KEY);
    const orderData = localStorage.getItem(CARD_ORDER_STORAGE_KEY);
    const backupData = {
      meta: {
        version: 1,
        createdAt: new Date().toISOString(),
        appName: "BreathFree"
      },
      payload: {
        entries,
        financialConfig,
        remindMe: remindMeData ? JSON.parse(remindMeData) : null,
        cardOrder: orderData ? JSON.parse(orderData) : null,
        inventory,
        walletState,
        settings: { enableGamification },
        quitTimestamp
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `breathfree-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (!data.payload) throw new Error('Invalid backup file format');

        const { 
          entries: importedEntries, 
          financialConfig: importedFinance, 
          remindMe: importedRemindMe, 
          cardOrder: importedOrder,
          inventory: importedInventory, 
          walletState: importedWallet,
          settings: importedSettings,
          quitTimestamp: importedQuitTimestamp
        } = data.payload;

        if (Array.isArray(importedEntries)) {
          setEntries(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newUniqueEntries = importedEntries.filter((item: LogEntry) => !existingIds.has(item.id));
            return [...newUniqueEntries, ...prev].sort((a, b) => b.timestamp - a.timestamp);
          });
        }

        if (importedFinance) {
          setFinancialConfig(importedFinance);
          localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(importedFinance));
        }

        if (importedRemindMe) {
            localStorage.setItem(REMIND_ME_STORAGE_KEY, JSON.stringify(importedRemindMe));
        }

        if (importedOrder) {
            localStorage.setItem(CARD_ORDER_STORAGE_KEY, JSON.stringify(importedOrder));
            setCardOrder(importedOrder);
        }

        if (importedInventory) {
            let cleanInventory = importedInventory;
            if (Array.isArray(importedInventory) && importedInventory.length > 0 && typeof importedInventory[0] === 'string') {
               cleanInventory = importedInventory.map((id: string) => ({ id, purchasedAt: Date.now() }));
            }
            setInventory(cleanInventory);
            localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(cleanInventory));
        }

        if (importedWallet) {
            localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(importedWallet));
            setWalletState(importedWallet);
        }

        if (importedSettings) {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(importedSettings));
            setEnableGamification(importedSettings.enableGamification);
        }

        if (importedQuitTimestamp) {
            updateQuitTimestamp(importedQuitTimestamp);
        } else {
            // Re-calculate if missing in import
            const lastPuff = calculateLastPuffTime(importedEntries || []);
            if (lastPuff) updateQuitTimestamp(lastPuff);
        }

        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import backup. Please ensure the file is valid.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const openPastModal = () => {
    // Keep date/time as current user selection or default to now if never set
    // But usually opening modal implies "new entry", so let's default to today's date
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setPastDate(`${year}-${month}-${day}`);
    setPastTime(d.toTimeString().slice(0, 5));
    
    setPastPuffs(1);
    setPastType(LogType.RESIST);
    setShowPastModal(true);
  };

  const openEditDateModal = () => {
      const date = quitTimestamp ? new Date(quitTimestamp) : new Date();
      // Ensure we format local YYYY-MM-DD correctly
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      setPastDate(`${year}-${month}-${day}`);
      setPastTime(date.toTimeString().slice(0, 5));
      setShowEditDateModal(true);
  };

  const savingsStartDate = entries.length > 0 
    ? entries[entries.length - 1].timestamp 
    : Date.now();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isRearrangeMode) return;
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (!isRearrangeMode) return;
    if (dragItem.current === null) return;
    if (dragItem.current === index) return;

    const newOrder = [...cardOrder];
    const draggedItemContent = newOrder[dragItem.current];
    newOrder.splice(dragItem.current, 1);
    newOrder.splice(index, 0, draggedItemContent);

    dragItem.current = index;
    setCardOrder(newOrder);
  };

  const handleDragEnd = () => {
    if (!isRearrangeMode) return;
    dragItem.current = null;
    dragOverItem.current = null;
    localStorage.setItem(CARD_ORDER_STORAGE_KEY, JSON.stringify(cardOrder));
  };

  // --- XP & Currency Calculation ---

  // Calculated Activity XP (Not stored, derived)
  const activityXP = useMemo(() => {
      const resistCount = entries.filter(e => e.type === LogType.RESIST).length;
      const daysClean = Math.max(0, timer.days);
      return (resistCount * 50) + (daysClean * 100);
  }, [entries, timer.days]);

  // Total XP = Derived + Stored Bonus XP
  const totalXP = activityXP + (walletState.xp || 0);

  const totalEarnedCredits = useMemo(() => {
    if (!financialConfig || (!quitTimestamp && entries.length === 0)) return 0;
    const start = quitTimestamp || savingsStartDate;
    const daysElapsed = Math.max(0, (now - start) / (1000 * 60 * 60 * 24));
    const dailyCost = financialConfig.costPerUnit / Math.max(0.1, financialConfig.daysPerUnit);
    const moneySaved = daysElapsed * dailyCost;
    const timeCredits = Math.floor(daysElapsed) * 10;
    const resistCount = entries.filter(e => e.type === LogType.RESIST).length;
    const resistCredits = resistCount * 5;

    return Math.floor(moneySaved + timeCredits + resistCredits);
  }, [entries, financialConfig, quitTimestamp, now, savingsStartDate]);

  const availableCredits = totalEarnedCredits + walletState.debug + (walletState.earned || 0) - walletState.spent;

  // --- Actions ---

  const handlePurchase = (id: string, cost: number) => {
    if (availableCredits >= cost && !inventory.some(i => i.id === id)) {
        const newItem: InventoryItem = { id, purchasedAt: Date.now() };
        const newInventory = [...inventory, newItem];
        setInventory(newInventory);
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(newInventory));

        const newWallet = { ...walletState, spent: walletState.spent + cost };
        setWalletState(newWallet);
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(newWallet));
    }
  };

  const handleEarn = (amount: number) => {
    const newWallet = { ...walletState, earned: (walletState.earned || 0) + amount };
    setWalletState(newWallet);
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(newWallet));
  };

  // Discovery / First Time Reward Logic
  const handleDiscover = (id: string) => {
    if (!enableGamification) return;
    if (walletState.discovered.includes(id)) return;

    // Grant 10 Credits and 50 XP
    const newWallet = {
        ...walletState,
        earned: (walletState.earned || 0) + 10,
        xp: (walletState.xp || 0) + 50,
        discovered: [...walletState.discovered, id]
    };
    
    setWalletState(newWallet);
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(newWallet));
  };

  // Handle CTA Rewards
  const handleCtaAction = (type: 'checkbox' | 'link') => {
      const id = `cta_${type}`;
      if (walletState.discovered.includes(id)) return;

      let credits = 0;
      let xp = 0;

      if (type === 'checkbox') {
          credits = 300;
          xp = 200;
      } else {
          credits = 300;
          xp = 100;
      }

      const newWallet = {
          ...walletState,
          earned: (walletState.earned || 0) + credits,
          xp: (walletState.xp || 0) + xp,
          discovered: [...walletState.discovered, id]
      };
      
      setWalletState(newWallet);
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(newWallet));
  };

  const renderCard = (id: string) => {
    if (id === 'gamification' && !enableGamification) return null;

    switch (id) {
        case 'financial':
            return <FinancialCard 
               config={financialConfig}
               onSaveConfig={saveFinancialConfig}
               lastPuffTime={quitTimestamp}
               startDate={savingsStartDate}
               currentTimestamp={now}
               onDiscover={handleDiscover}
            />;
        case 'stats':
            return <StatsChart 
                  entries={entries} 
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />;
        case 'history':
            return <LogHistory 
                  entries={entries} 
                  selectedDate={selectedDate}
                  onDelete={handleDeleteEntry}
                  onEdit={setEditingEntry}
                />;
        case 'remind':
            return <RemindMeCard onDiscover={handleDiscover} />;
        case 'why':
            return <WhyQuitCard onDiscover={handleDiscover} />;
        case 'gamification':
            return <GamificationCard 
                entries={entries} 
                config={financialConfig} 
                lastPuffTime={quitTimestamp} 
                startDate={savingsStartDate} 
                currentTimestamp={now}
                balance={availableCredits}
                inventory={inventory}
                totalXP={totalXP}
                onPurchase={handlePurchase}
                onEarn={handleEarn}
                onDiscover={handleDiscover}
            />;
        case 'civic':
            return <CivicActionCard 
                onAction={() => handleCtaAction('link')}
                isCompleted={walletState.discovered.includes('cta_link')}
                triggerShare={shareTrigger}
            />;
        default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans text-slate-100 transition-colors duration-300 relative">
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12 animate-scale-in">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20 text-white transform rotate-3">
                 <Wind size={24} />
              </div>
              <div>
                 <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Breathe Free</h1>
                 <p className="text-sm font-medium text-slate-400 mt-1">Nicotine Quit Tracker</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
               {enableGamification && (
                   <>
                        {/* XP Badge */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 shadow-sm hidden sm:flex" title="Total XP">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                <Trophy size={14} />
                            </div>
                            <span className="text-indigo-400 font-bold font-mono tracking-tight">{totalXP.toLocaleString()} XP</span>
                        </div>
                        {/* Credits Badge */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 shadow-sm mr-2 hidden sm:flex" title="Credits Available">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                                <Gem size={14} />
                            </div>
                            <span className="text-cyan-400 font-bold font-mono tracking-tight">{availableCredits.toLocaleString()} Credits</span>
                        </div>
                   </>
               )}

               <button 
                  onClick={() => setIsRearrangeMode(!isRearrangeMode)}
                  className={`p-3 transition-colors rounded-2xl border shadow-sm hover:shadow-md active:scale-95 ${
                    isRearrangeMode 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-900/20' 
                        : 'bg-slate-900 text-slate-500 hover:text-slate-300 border-slate-800'
                  }`}
                  title={isRearrangeMode ? "Save Layout" : "Edit Layout"}
               >
                  <Layout size={20} />
               </button>

               <button 
                  onClick={() => setShowSettings(true)}
                  className="p-3 bg-slate-900 text-slate-500 hover:text-slate-300 transition-colors rounded-2xl border border-slate-800 shadow-sm hover:shadow-md active:scale-95"
                  title="Settings"
               >
                  <Settings size={20} />
               </button>
           </div>
        </header>

        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative overflow-hidden bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-800 transition-colors duration-300 flex flex-col items-center justify-center min-h-[260px] text-center">
                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
                    <div className="w-64 h-64 rounded-full border-4 border-emerald-500"></div>
                 </div>

                 <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-8 bg-slate-800 px-6 py-2.5 rounded-2xl border border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                      <h2 className="text-slate-300 font-bold uppercase tracking-widest text-sm">Amount of Time Nicotine Free</h2>
                    </div>
                    
                    {quitTimestamp ? (
                      <div className="flex flex-col items-center animate-fade-in">
                         <div className="flex items-baseline gap-2 sm:gap-4 text-slate-100">
                           <div className="flex flex-col items-center">
                             <span className="text-4xl sm:text-6xl font-black font-mono tracking-tighter">{timer.days}</span>
                             <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 uppercase">Days</span>
                           </div>
                           <span className="text-3xl sm:text-5xl font-light text-slate-700 -mt-4">:</span>
                           <div className="flex flex-col items-center">
                             <span className="text-4xl sm:text-6xl font-black font-mono tracking-tighter">{timer.hours}</span>
                             <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 uppercase">Hrs</span>
                           </div>
                           <span className="text-3xl sm:text-5xl font-light text-slate-700 -mt-4">:</span>
                           <div className="flex flex-col items-center">
                             <span className="text-4xl sm:text-6xl font-black font-mono tracking-tighter">{String(timer.minutes).padStart(2, '0')}</span>
                             <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 uppercase">Mins</span>
                           </div>
                           <span className="text-3xl sm:text-5xl font-light text-slate-700 -mt-4">:</span>
                           <div className="flex flex-col items-center">
                             <span className="text-4xl sm:text-6xl font-black font-mono tracking-tighter text-emerald-400">{String(timer.seconds).padStart(2, '0')}</span>
                             <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 uppercase">Secs</span>
                           </div>
                         </div>
                         
                         <div className="mt-8 flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-800/50 px-3 py-1 rounded-lg">
                                <Clock size={14} />
                                <span>Since {new Date(quitTimestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <button 
                                onClick={openEditDateModal}
                                className="p-1.5 text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Edit Start Date"
                            >
                                <Edit2 size={12} />
                            </button>
                         </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center animate-fade-in">
                        <span className="text-3xl sm:text-4xl font-bold text-slate-200 block mb-2">Ready to start?</span>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">Your journey to freedom begins with the first step.</p>
                        <button 
                            onClick={handleStartTimer}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 mx-auto transition-all active:scale-[0.98]"
                        >
                            <PlayCircle size={20} /> Start Quit Timer
                        </button>
                      </div>
                    )}
                 </div>
              </div>

              <div className="relative overflow-hidden bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-800 transition-colors duration-300 flex flex-col justify-center gap-4">
                
                {rewardFeedback && (
                    <RewardFeedback 
                        type={rewardFeedback.type} 
                        onAnimationComplete={() => setRewardFeedback(null)} 
                        gamificationEnabled={enableGamification}
                    />
                )}

                <div className="grid grid-cols-2 gap-4 w-full h-full min-h-[140px]">
                   <button
                    onClick={() => handleAddEntry(LogType.RESIST)}
                    className="group relative overflow-hidden bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-3 text-lg"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                       <ShieldCheck size={64} />
                    </div>
                    <ShieldCheck size={32} className="relative z-10" />
                    <span className="relative z-10">I Resisted</span>
                  </button>
                  
                  <button
                    onClick={() => setShowPuffModal(true)}
                    className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-3 text-lg"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                       <Wind size={64} />
                    </div>
                    <Wind size={32} className="relative z-10" />
                    <span className="relative z-10">I Vaped</span>
                  </button>
                </div>
                
                <button 
                  onClick={openPastModal}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors py-4 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800"
                >
                  <Calendar size={16} />
                  Log past activity
                </button>
              </div>
            </div>

            <div className="space-y-8 pb-6">
               {cardOrder.map((id, index) => {
                  const cardContent = renderCard(id);
                  if (!cardContent) return null;

                  return (
                    <div
                        key={id}
                        ref={(el) => (cardRefs.current[id] = el)}
                        draggable={isRearrangeMode}
                        onDragStart={(e) => isRearrangeMode && handleDragStart(e, index)}
                        onDragEnter={(e) => isRearrangeMode && handleDragEnter(e, index)}
                        onDragEnd={isRearrangeMode ? handleDragEnd : undefined}
                        onDragOver={(e) => isRearrangeMode && e.preventDefault()}
                        className={`transition-all duration-300 ${
                            isRearrangeMode 
                                ? 'cursor-move ring-2 ring-indigo-500/30 rounded-[2.5rem] bg-slate-900/30 border-dashed border-2 border-indigo-500/20 p-2 scale-[0.98]' 
                                : ''
                        }`}
                    >
                        {isRearrangeMode && (
                            <div className="w-full h-8 flex justify-center items-center text-indigo-400 animate-fade-in mb-2">
                                <GripHorizontal size={24} />
                                <span className="ml-2 text-xs font-bold uppercase tracking-wider text-indigo-500">Drag to move</span>
                            </div>
                        )}
                        
                        <div className={isRearrangeMode ? 'pointer-events-none opacity-90 grayscale-[0.5]' : ''}>
                            {cardContent}
                        </div>
                    </div>
                  );
               })}
            </div>
            
            <div className="flex justify-center mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                    <Leaf size={14} className="text-slate-600" />
                </div>
            </div>
            
            {/* Footer with Privacy Notice & About Link */}
            <footer className="mb-8 text-center space-y-4">
                <p className="text-[10px] text-slate-600 max-w-md mx-auto leading-relaxed">
                    Breathe Free app is open source, privacy focused, and never tracks your interactions inside or outside of the app.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button 
                        onClick={handleOpenShare}
                        className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
                    >
                        <Share2 size={12} /> Share App
                    </button>
                    <a
                        href="https://github.com/janzt450/Breathe-Free---Quit-Vape" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
                    >
                        <Github size={12} /> View Source Code
                    </a>
                    <button 
                        onClick={() => setShowAbout(true)}
                        className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
                    >
                        <Info size={12} /> About Breathe Free
                    </button>
                    <button 
                        onClick={() => setShowOpenSource(true)}
                        className="text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                        <Shield size={12} /> Why Open Source?
                    </button>
                    <button 
                        onClick={() => setShowAITransparency(true)}
                        className="text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors flex items-center gap-1"
                    >
                        <Bot size={12} /> AI Transparency
                    </button>
                    <button 
                        onClick={() => setShowRoadmap(true)}
                        className="text-xs font-bold text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                        <Map size={12} /> Project Roadmap
                    </button>
                </div>
            </footer>

        </div>
      </div>

      {editingEntry && (
        <EditEntryModal 
           entry={editingEntry}
           onClose={() => setEditingEntry(null)}
           onSave={handleUpdateEntry}
           onDelete={handleDeleteEntry}
        />
      )}

      {showEditDateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Start Date</h2>
              <button 
                onClick={() => setShowEditDateModal(false)}
                className="p-2 bg-slate-800 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-6">
                Manually adjust when you started your quit journey.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Date</label>
                 <input 
                   type="date" 
                   value={pastDate}
                   onChange={(e) => setPastDate(e.target.value)}
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Time</label>
                 <input 
                   type="time" 
                   value={pastTime}
                   onChange={(e) => setPastTime(e.target.value)}
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 />
               </div>
            </div>

            <button
              onClick={handleManualDateChange}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all text-lg"
            >
              Update Timer
            </button>
          </div>
        </div>
      )}

      {showPuffModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Log Activity</h2>
              <button 
                onClick={() => setShowPuffModal(false)}
                className="p-2 bg-slate-800 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-400 mb-6 text-center uppercase tracking-wide">
                Puffs Taken
              </label>
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={() => setPuffCount(Math.max(1, puffCount - 1))}
                  className="w-14 h-14 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-800 text-2xl font-bold transition-colors"
                >
                  -
                </button>
                <span className="text-5xl font-black text-white w-20 text-center font-mono">
                  {puffCount}
                </span>
                <button
                  onClick={() => setPuffCount(puffCount + 1)}
                  className="w-14 h-14 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 text-2xl font-bold shadow-md transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <button
              onClick={() => handleAddEntry(LogType.PUFF, puffCount)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-900/20 active:scale-[0.98] transition-all text-lg"
            >
              Confirm Log
            </button>
          </div>
        </div>
      )}

      {showPastModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Log Past Activity</h2>
              <button 
                onClick={() => setShowPastModal(false)}
                className="p-2 bg-slate-800 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-xl mb-6">
               <button 
                 onClick={() => setPastType(LogType.RESIST)}
                 className={`py-2 rounded-lg text-sm font-bold transition-all ${
                   pastType === LogType.RESIST 
                     ? 'bg-slate-700 shadow-sm text-emerald-400' 
                     : 'text-slate-400 hover:bg-slate-700/50'
                 }`}
               >
                 Resisted
               </button>
               <button 
                 onClick={() => setPastType(LogType.PUFF)}
                 className={`py-2 rounded-lg text-sm font-bold transition-all ${
                   pastType === LogType.PUFF 
                     ? 'bg-slate-700 shadow-sm text-orange-400' 
                     : 'text-slate-400 hover:bg-slate-700/50'
                 }`}
               >
                 Vaped
               </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Date</label>
                 <input 
                   type="date" 
                   value={pastDate}
                   onChange={(e) => setPastDate(e.target.value)}
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Time</label>
                 <input 
                   type="time" 
                   value={pastTime}
                   onChange={(e) => setPastTime(e.target.value)}
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 />
               </div>
            </div>

            {pastType === LogType.PUFF && (
              <div className="mb-6 animate-fade-in">
                <label className="block text-xs font-bold text-slate-400 mb-3 text-center uppercase tracking-wide">
                  Puffs Taken
                </label>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setPastPuffs(Math.max(1, pastPuffs - 1))}
                    className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-3xl font-black text-white w-12 text-center font-mono">
                    {pastPuffs}
                  </span>
                  <button
                    onClick={() => setPastPuffs(pastPuffs + 1)}
                    className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 shadow-md transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handlePastSubmit}
              className={`w-full text-white font-bold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all text-lg ${
                pastType === LogType.RESIST 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/20' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-900/20'
              }`}
            >
              Save Past Entry
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
           <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings size={24} className="text-slate-400" />
                  Settings
                </h2>
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    setShowClearConfirm(false);
                  }}
                  className="p-2 bg-slate-800 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {!showClearConfirm ? (
                 <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">Preferences</h3>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${enableGamification ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                    <Gamepad2 size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-200">Gamification</p>
                                    <p className="text-xs text-slate-500">XP, Credits, and Shop</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setEnableGamification(!enableGamification)}
                                className={`text-2xl transition-colors ${enableGamification ? 'text-indigo-500' : 'text-slate-600'}`}
                            >
                                {enableGamification ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Data Management</h3>
                      <div className="flex gap-3 mb-3">
                         <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-bold hover:bg-slate-700/50 transition-colors">
                           <Download size={18} /> Export
                         </button>
                         <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-bold hover:bg-slate-700/50 transition-colors">
                           <Upload size={18} /> Import
                         </button>
                         <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
                      </div>
                      <button onClick={() => setShowClearConfirm(true)} className="w-full flex items-center justify-between p-3 text-left bg-slate-800 border border-slate-700 rounded-xl text-red-500 hover:bg-red-900/20 hover:border-red-900/30 transition-all group">
                         <span className="font-medium">Clear All Data</span>
                         <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>

                    <div className="text-center text-xs text-slate-400 mt-4">Breathe Free v1.5</div>
                 </div>
              ) : (
                <div className="animate-scale-in">
                   <div className="flex flex-col items-center text-center p-4 bg-red-900/10 rounded-2xl border border-red-900/30 mb-6">
                      <div className="w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-3">
                        <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-red-400 font-bold text-lg">Are you sure?</h3>
                      <p className="text-red-400/80 text-sm mt-1">This will permanently delete all your logs and resistance history. This action cannot be undone.</p>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 px-4 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                      <button onClick={handleClearAllData} className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-none transition-colors">Yes, Delete All</button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {showAbout && (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
            onClick={() => setShowAbout(false)}
        >
            <div 
                className="bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-800 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={() => setShowAbout(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
                >
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20 text-white transform rotate-3 mb-4">
                        <Wind size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Breathe Free</h2>
                    <p className="text-sm font-medium text-slate-400">Open Source Quit Tracker</p>
                </div>

                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                    <p>
                        Breathe Free was built to empower individuals to reclaim their health from nicotine addiction without selling their data.
                    </p>
                    <p>
                        Unlike many health apps, this one was designed with the specific intent and belief that your journey is private. All data is stored locally on your device. This app does not, has never, and will never make use of user analytics, tracking pixels, external servers for data storage, or other privacy infringing features.
                    </p>
                    
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mt-4">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            Privacy Promise
                        </h3>
                        <ul className="space-y-2 text-xs text-slate-400">
                            <li className="flex gap-2">
                                <span className="text-emerald-500">•</span> No Account Required
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-500">•</span> Local Storage Only
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-500">•</span> No Ad Tracking
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-500">•</span> Open Source Code
                            </li>
                        </ul>
                    </div>

                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <p className="text-xs font-bold text-red-400">
                            This app is never intended to be sold, bartered, or traded. Free forever, free for life.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-600">
                        Version 1.5.0 • Built with React & Tailwind
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1 font-bold">
                        Made in the USA 🇺🇸
                    </p>
                </div>
            </div>
        </div>
      )}

      {showOpenSource && (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
            onClick={() => setShowOpenSource(false)}
        >
            <div 
                className="bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-800 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={() => setShowOpenSource(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
                >
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-4 bg-emerald-900/30 rounded-2xl text-emerald-400 mb-4 border border-emerald-900/50">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Why Open Source?</h2>
                    <p className="text-sm font-medium text-slate-400">Transparency is Trust</p>
                </div>

                <div className="space-y-6 text-sm text-slate-300">
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 font-bold text-white">
                            <FileCode size={16} className="text-blue-400" />
                            Auditability
                        </h4>
                        <p className="text-xs leading-relaxed text-slate-400">
                            "Open Source" means the code is publicly available. Anyone can inspect it to ensure there are no hidden trackers, spyware, or malicious algorithms designed to sell your habits.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 font-bold text-white">
                            <Lock size={16} className="text-orange-400" />
                            Data Sovereignty
                        </h4>
                        <p className="text-xs leading-relaxed text-slate-400">
                            Breathe Free is "Local Only". Your health data lives on your device, not on some company or independent and unaccountable entities server. This app never attempts to contact outside servers to provide telemetry or marketing data. You own your recovery journey.
                        </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-2">Supported By Principles From:</p>
                        <ul className="space-y-2">
                            <li>
                                <a href="https://www.fsf.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white group">
                                    Free Software Foundation
                                    <CheckCircle2 size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </li>
                            <li>
                                <a href="https://opensource.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white group">
                                    Open Source Initiative
                                    <CheckCircle2 size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </li>
                             <li>
                                <a href="https://www.eff.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white group">
                                    Electronic Frontier Foundation
                                    <CheckCircle2 size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showAITransparency && (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
            onClick={() => setShowAITransparency(false)}
        >
            <div 
                className="bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-800 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={() => setShowAITransparency(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
                >
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-4 bg-purple-900/30 rounded-2xl text-purple-400 mb-4 border border-purple-900/50">
                        <Bot size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">AI Transparency Statement</h2>
                    <p className="text-sm font-medium text-slate-400">Created with Human Vision & Machine Intelligence</p>
                </div>

                <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-white mb-2">
                            <Sparkles size={16} className="text-yellow-400" />
                            A Historical Artifact
                        </h4>
                        <p className="text-xs">
                            This app serves as a historical artifact of the 'vibecoding' era—a time when natural language became a programming language. It was generated as an intentional exercise in UX design, bridging the gap between concept and reality through Large Language Models.
                        </p>
                        <div className="mt-3 bg-emerald-900/20 border border-emerald-500/20 p-2 rounded-lg">
                            <p className="text-[10px] font-bold text-emerald-400 text-center">
                                "Originally created with Gemini 3 Pro Preview using Google AI Studio - January 2026"
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-white mb-2">
                            <Bot size={16} className="text-purple-400" />
                            The Human Element
                        </h4>
                        <p className="text-xs">
                            Created as a meaningful distraction from nicotine cravings, this project proves that building software can be a pleasant, revolutionary experience. It empowers those with a vision for product design and information systems to build freely, regardless of their coding fluency.
                        </p>
                    </div>

                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-white mb-2">
                            <Shield size={16} className="text-blue-400" />
                            Our Responsibility
                        </h4>
                        <p className="text-xs">
                            With AI now woven into our reality, the responsibility falls on humans to guide it with wisdom. Despite the challenges ahead, there is immense hope. We have the power to use these tools to find truth, uplift one another, and understand the world we live in.
                        </p>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl text-center">
                        <p className="text-xs font-bold text-white">
                            This app was created 100% with AI <span className="text-purple-400">*AND*</span> HUMANS. 
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                            Now that AI is truly here, we must now work together to unlock the secrets of our universe.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showRoadmap && (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
            onClick={() => setShowRoadmap(false)}
        >
            <div 
                className="bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-800 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={() => setShowRoadmap(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
                >
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-4 bg-amber-900/30 rounded-2xl text-amber-400 mb-4 border border-amber-900/50">
                        <Map size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Project Roadmap</h2>
                    <p className="text-sm font-medium text-slate-400">Future Visions & Historical Echoes</p>
                </div>

                <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-white mb-2">
                            <Gamepad2 size={16} className="text-indigo-400" />
                            Gamification Evolution
                        </h4>
                        <p className="text-xs text-slate-400">
                            The current "Shop" and "Games" are just the foundation. Future iterations could explore deeper RPG elements, customizable avatars, and more complex puzzle mechanics to distract from cravings—all while keeping the economy strictly local and offline.
                        </p>
                    </div>

                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-white mb-2">
                            <Clock size={16} className="text-emerald-400" />
                            A Digital Artifact
                        </h4>
                        <p className="text-xs text-slate-400">
                            Beyond its utility, this project serves as a point of historical interest. It represents a specific moment in time where open-source philosophy met the capabilities of early 2026 AI. It stands as a single data point in a much larger set of human-driven, AI-assisted creation.
                        </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-2">The Path Forward</p>
                        <p className="text-xs text-slate-400">
                            This roadmap is not fixed. As an open-source tool, its destiny lies with the community. Fork it, mod it, and make it your own.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;