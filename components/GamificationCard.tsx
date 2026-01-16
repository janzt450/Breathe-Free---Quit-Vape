import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Brain, Wind, Wallet, Leaf, Shield, Trophy, ChevronDown, ChevronUp, Beaker, ShoppingBag, Bird, Check, Lock, Dog, Cat, Package, Flame, Sword, Shirt, Turtle, Snail, Egg, PawPrint, Gem, ArrowUpDown, Box, Gamepad2, Sparkles, HelpCircle, Shuffle, Type, GraduationCap, Calculator, Play, Circle, RotateCcw, Volume2, VolumeX, Info, Grid3x3, History, Zap, User, X } from 'lucide-react';
import { FinancialConfig, LogEntry, LogType, InventoryItem } from '../types';

interface GamificationCardProps {
  entries: LogEntry[];
  config: FinancialConfig | null;
  lastPuffTime: number | null;
  startDate: number;
  currentTimestamp: number;
  balance: number;
  inventory: InventoryItem[];
  totalXP: number; 
  onPurchase: (id: string, cost: number) => void;
  onEarn: (amount: number) => void;
  onDiscover: (id: string) => void; 
}

interface Skill {
  id: string;
  name: string;
  icon: React.ReactNode;
  level: number;
  progress: number; // 0 to 100
  currentXP: string;
  nextLevelXP: string;
  color: string;
  bg: string;
  description: string;
  realityCheck: string;
}

interface ShopItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  cost: number;
  description: string;
  color: string;
  locked?: boolean;
}

type SortOption = 'price_asc' | 'price_desc' | 'name';
type Tab = 'journey' | 'inventory' | 'shop' | 'games';
type ZenPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'success';
type CCDifficulty = 'Easy' | 'Medium' | 'Hard';

const GAME_PROGRESS_KEY = 'breathfree_games_v1';

const GamificationCard: React.FC<GamificationCardProps> = ({ entries, config, lastPuffTime, startDate, currentTimestamp, balance, inventory, totalXP, onPurchase, onEarn, onDiscover }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('journey');
  const [sortOption, setSortOption] = useState<SortOption>('price_asc');
  
  // Games State
  const [solvedGameIds, setSolvedGameIds] = useState<string[]>([]); // Stores IDs for all games
  const [gameInput, setGameInput] = useState('');
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [gameFeedback, setGameFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedGameCategory, setExpandedGameCategory] = useState<string | null>(null);

  // Zen Breather State
  const [zenPhase, setZenPhase] = useState<ZenPhase>('idle');
  const [zenCycle, setZenCycle] = useState(0);
  const [zenIsHolding, setZenIsHolding] = useState(false);
  const [zenMessage, setZenMessage] = useState('Press Start');
  const [zenMuted, setZenMuted] = useState(false);
  const [showZenReward, setShowZenReward] = useState(false);
  
  const zenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Tic-Tac-Toe State
  const [ccBoard, setCcBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [ccIsPlayerTurn, setCcIsPlayerTurn] = useState(true);
  const [ccWinner, setCcWinner] = useState<'player' | 'ai' | 'draw' | null>(null);
  const [ccDifficulty, setCcDifficulty] = useState<CCDifficulty>('Medium');
  const [ccIsThinking, setCcIsThinking] = useState(false);

  // Load Game Progress
  useEffect(() => {
    const saved = localStorage.getItem(GAME_PROGRESS_KEY);
    if (saved) {
        try {
            setSolvedGameIds(JSON.parse(saved));
        } catch(e) { console.error(e); }
    }
  }, []);

  // Pre-load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTabChange = (tab: Tab) => {
      setActiveTab(tab);
      onDiscover(`tab_${tab}`);
  };

  // --- VOICE LOGIC ---
  const speak = (text: string) => {
    if (zenMuted || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Slower rate for calming effect
    utterance.rate = 0.85; 
    // Slightly lower pitch
    utterance.pitch = 0.9;
    utterance.lang = 'en-US'; 
    
    // Attempt to select a better voice
    if (voicesRef.current.length > 0) {
      // Prioritize Google US English or Samantha (common good voices)
      const preferredVoice = voicesRef.current.find(
        v => v.name.includes('Google US English') || v.name.includes('Samantha') || (v.lang === 'en-US' && v.name.includes('Female'))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // --- ZEN BREATHER LOGIC ---
  const startZenGame = () => {
      if (zenPhase !== 'idle' && zenPhase !== 'success') return;
      setZenCycle(0);
      setZenPhase('inhale');
      runZenCycle('inhale');
  };

  const stopZenGame = () => {
      if (zenTimeoutRef.current) clearTimeout(zenTimeoutRef.current);
      // Stop voice
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      
      setZenPhase('idle');
      setZenMessage('Session Stopped');
      setTimeout(() => setZenMessage('Press Start'), 2000);
  };

  const runZenCycle = (phase: ZenPhase) => {
      if (zenTimeoutRef.current) clearTimeout(zenTimeoutRef.current);

      let duration = 0;
      let nextPhase: ZenPhase = 'idle';
      
      switch (phase) {
          case 'inhale':
              speak('Inhale');
              setZenMessage('Inhale deeply...');
              duration = 4000;
              nextPhase = 'hold';
              break;
          case 'hold':
              speak('Hold');
              setZenMessage('Hold your breath...');
              duration = 7000;
              nextPhase = 'exhale';
              break;
          case 'exhale':
              speak('Exhale');
              setZenMessage('Exhale slowly...');
              duration = 8000;
              nextPhase = 'inhale'; // Loop or finish
              break;
      }

      setZenPhase(phase);

      zenTimeoutRef.current = setTimeout(() => {
          if (phase === 'exhale') {
              // End of a cycle
              setZenCycle(prev => {
                  const newCount = prev + 1;
                  if (newCount >= 3) {
                      finishZenSession();
                      return 0; // Reset for logic, but finish func handles UI
                  }
                  runZenCycle(nextPhase);
                  return newCount;
              });
          } else {
              runZenCycle(nextPhase);
          }
      }, duration);
  };

  const finishZenSession = () => {
      setZenPhase('success');
      setZenMessage('Session Complete!');
      speak('Session complete. Well done.');
      onEarn(50); // Reward
      
      setShowZenReward(true);
      setTimeout(() => setShowZenReward(false), 4000);

      setTimeout(() => {
          setZenPhase('idle');
          setZenMessage('Ready again?');
      }, 4000);
  };

  // Clean up timer on unmount
  useEffect(() => {
      return () => {
          if (zenTimeoutRef.current) clearTimeout(zenTimeoutRef.current);
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      };
  }, []);

  // Validation Effect (Visual only, zen mode is forgiving)
  const isZenSyncError = useMemo(() => {
      if (zenPhase === 'idle' || zenPhase === 'success') return false;
      // Inhale/Hold: Should be holding. Exhale: Should be released.
      if ((zenPhase === 'inhale' || zenPhase === 'hold') && !zenIsHolding) return true;
      if (zenPhase === 'exhale' && zenIsHolding) return true;
      return false;
  }, [zenPhase, zenIsHolding]);

  // --- TIC TAC TOE LOGIC ---
  
  const WINNING_COMBOS = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const checkCcWinner = (board: (string | null)[]) => {
      for (let combo of WINNING_COMBOS) {
          const [a, b, c] = combo;
          if (board[a] && board[a] === board[b] && board[a] === board[c]) {
              return board[a] === 'X' ? 'player' : 'ai';
          }
      }
      if (!board.includes(null)) return 'draw';
      return null;
  };

  const handleCcClick = (index: number) => {
      if (ccBoard[index] || ccWinner || !ccIsPlayerTurn || ccIsThinking) return;

      const newBoard = [...ccBoard];
      newBoard[index] = 'X'; // Player is X
      setCcBoard(newBoard);
      
      const winner = checkCcWinner(newBoard);
      if (winner) {
          endCcGame(winner);
      } else {
          setCcIsPlayerTurn(false);
          setCcIsThinking(true);
      }
  };

  const endCcGame = (winner: 'player' | 'ai' | 'draw') => {
      setCcWinner(winner);
      if (winner === 'player') {
          const reward = ccDifficulty === 'Easy' ? 10 : ccDifficulty === 'Medium' ? 25 : 50;
          onEarn(reward);
      }
  };

  const resetCcGame = () => {
      setCcBoard(Array(9).fill(null));
      setCcWinner(null);
      setCcIsPlayerTurn(true);
      setCcIsThinking(false);
  };

  // AI Turn Logic
  useEffect(() => {
      if (!ccIsPlayerTurn && !ccWinner && ccIsThinking) {
          // Artificial delay for realism
          const timer = setTimeout(() => {
              const newBoard = [...ccBoard];
              let moveIndex = -1;

              // Helper: Find empty indices
              const emptyIndices = newBoard.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1);

              if (emptyIndices.length > 0) {
                  // Strategy based on difficulty
                  const shouldMakeRandomMove = () => {
                      if (ccDifficulty === 'Easy') return true;
                      if (ccDifficulty === 'Medium') return Math.random() > 0.6; // 40% optimal
                      if (ccDifficulty === 'Hard') return Math.random() > 0.9; // 10% chance to mess up (Human-like Hard)
                      return false;
                  };

                  if (shouldMakeRandomMove()) {
                      moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                  } else {
                      // Mini-max or simple heuristic for "Best Move"
                      // 1. Can AI win now?
                      moveIndex = findWinningMove(newBoard, 'O');
                      
                      // 2. Must AI block player win?
                      if (moveIndex === -1) {
                          moveIndex = findWinningMove(newBoard, 'X');
                      }

                      // 3. Take center if available
                      if (moveIndex === -1 && newBoard[4] === null) {
                          moveIndex = 4;
                      }

                      // 4. Random available
                      if (moveIndex === -1) {
                          moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                      }
                  }
              }

              if (moveIndex !== -1) {
                  newBoard[moveIndex] = 'O'; // AI is O
                  setCcBoard(newBoard);
                  const winner = checkCcWinner(newBoard);
                  if (winner) {
                      endCcGame(winner);
                  } else {
                      setCcIsPlayerTurn(true);
                  }
              }
              setCcIsThinking(false);
          }, 600); // Delay

          return () => clearTimeout(timer);
      }
  }, [ccIsPlayerTurn, ccWinner, ccIsThinking, ccBoard, ccDifficulty]);

  const findWinningMove = (board: (string | null)[], symbol: string) => {
      for (let combo of WINNING_COMBOS) {
          const [a, b, c] = combo;
          const values = [board[a], board[b], board[c]];
          const symbolCount = values.filter(v => v === symbol).length;
          const nullCount = values.filter(v => v === null).length;
          
          if (symbolCount === 2 && nullCount === 1) {
              if (board[a] === null) return a;
              if (board[b] === null) return b;
              if (board[c] === null) return c;
          }
      }
      return -1;
  };


  // Calculate stats
  const stats = useMemo(() => {
    // ... (Stats calculation code remains the same)
    const start = lastPuffTime || startDate;
    const now = currentTimestamp;
    const hoursElapsed = Math.max(0, (now - start) / (1000 * 60 * 60));
    const daysElapsed = hoursElapsed / 24;

    // 1. NEUROPLASTICITY (Brain/Dopamine)
    const brainLevelData = [
       { hours: 24, label: "Nicotine Flush" },
       { hours: 72, label: "Peak Withdrawal" },
       { hours: 168, label: "Craving Drop" },
       { hours: 504, label: "Receptor Reset" },
       { hours: 2160, label: "Dopamine Restoration" } 
    ];
    let brainLevel = 1;
    let brainProgress = 0;
    let brainNext = brainLevelData[0];
    
    for (let i = 0; i < brainLevelData.length; i++) {
        if (hoursElapsed >= brainLevelData[i].hours) {
            brainLevel = i + 2; 
        } else {
            brainNext = brainLevelData[i];
            const prevHours = i === 0 ? 0 : brainLevelData[i-1].hours;
            brainProgress = ((hoursElapsed - prevHours) / (brainLevelData[i].hours - prevHours)) * 100;
            break;
        }
    }
    if (brainLevel > brainLevelData.length) {
        brainProgress = 100;
        brainNext = { hours: 0, label: "Mastered" };
    }

    // 2. REGENERATION (Lung Health)
    const lungLevelData = [
        { days: 1, label: "CO Normalization" },
        { days: 3, label: "Breathing Ease" },
        { days: 14, label: "Circulation Boost" },
        { days: 30, label: "Lung Cleaning" },
        { days: 90, label: "Infection Immunity" },
        { days: 270, label: "Cilia Regrowth" }
    ];
    let lungLevel = 1;
    let lungProgress = 0;
    let lungNext = lungLevelData[0];

    for (let i = 0; i < lungLevelData.length; i++) {
        if (daysElapsed >= lungLevelData[i].days) {
            lungLevel = i + 2;
        } else {
            lungNext = lungLevelData[i];
            const prevDays = i === 0 ? 0 : lungLevelData[i-1].days;
            lungProgress = ((daysElapsed - prevDays) / (lungLevelData[i].days - prevDays)) * 100;
            break;
        }
    }
    if (lungLevel > lungLevelData.length) {
        lungProgress = 100;
        lungNext = { days: 0, label: "Mastered" };
    }

    // 3. ALCHEMY (Wealth)
    let financeLevel = 1;
    let financeProgress = 0;
    let financeCurrent = 0;
    if (config) {
        const dailyCost = config.costPerUnit / Math.max(0.1, config.daysPerUnit);
        const saved = daysElapsed * dailyCost;
        financeCurrent = saved;
        financeLevel = Math.floor(saved / 50) + 1;
        financeProgress = ((saved % 50) / 50) * 100;
    }
    const financeNextTarget = (Math.floor(financeCurrent / 50) + 1) * 50;

    // 4. RESILIENCE (Willpower)
    const totalResists = entries.filter(e => e.type === LogType.RESIST).length;
    const willpowerLevel = Math.floor(totalResists / 5) + 1;
    const willpowerProgress = ((totalResists % 5) / 5) * 100;
    const willpowerNextTarget = (Math.floor(totalResists / 5) + 1) * 5;

    // 5. CONSERVATION (Nature)
    let envLevel = 1;
    let envProgress = 0;
    let envUnits = 0;
    if (config) {
        envUnits = daysElapsed / config.daysPerUnit;
        envLevel = Math.floor(envUnits) + 1;
        envProgress = (envUnits % 1) * 100;
    }
    const envNextTarget = Math.floor(envUnits) + 1;

    const currency = config?.currencySymbol || '$';

    const skills: Skill[] = [
        {
            id: 'dopamine',
            name: 'Neuroplasticity',
            icon: <Brain size={18} />,
            level: brainLevel,
            progress: brainProgress,
            currentXP: `Current: ${Math.floor(hoursElapsed)}h`,
            nextLevelXP: brainNext.hours > 0 ? `Goal: ${brainNext.hours}h • ${brainNext.label}` : 'Max Level',
            color: 'bg-indigo-500',
            bg: 'bg-indigo-900/30 text-indigo-400',
            description: 'Brain rewiring progress',
            realityCheck: 'Nicotine receptors in your brain take ~3 weeks to downregulate. You are literally physically changing your brain structure back to normal.'
        },
        {
            id: 'lungs',
            name: 'Regeneration',
            icon: <Wind size={18} />,
            level: lungLevel,
            progress: lungProgress,
            currentXP: `Current: ${daysElapsed.toFixed(1)}d`,
            nextLevelXP: lungNext.days > 0 ? `Goal: ${lungNext.days}d • ${lungNext.label}` : 'Max Level',
            color: 'bg-rose-500',
            bg: 'bg-rose-900/30 text-rose-400',
            description: 'Physical tissue repair',
            realityCheck: 'Microscopic hair-like structures called cilia are paralyzed by vapor. They begin regrowing after 1-9 months to clear mucus and protect against infection.'
        },
        {
            id: 'will',
            name: 'Resilience',
            icon: <Shield size={18} />,
            level: willpowerLevel,
            progress: willpowerProgress,
            currentXP: `Resisted: ${totalResists}`,
            nextLevelXP: `Goal: ${willpowerNextTarget}`,
            color: 'bg-blue-500',
            bg: 'bg-blue-900/30 text-blue-400',
            description: 'Prefrontal cortex strength',
            realityCheck: 'Every time you say "No" to a craving, you strengthen the neural pathway for self-control in your prefrontal cortex, making the next refusal physically easier.'
        },
        {
            id: 'finance',
            name: 'Alchemy',
            icon: <Wallet size={18} />,
            level: financeLevel,
            progress: financeProgress,
            currentXP: `Saved: ${currency}${financeCurrent.toFixed(0)}`,
            nextLevelXP: `Goal: ${currency}${financeNextTarget}`,
            color: 'bg-amber-500',
            bg: 'bg-amber-900/30 text-amber-400',
            description: 'Resource accumulation',
            realityCheck: 'Financial freedom is compound interest. The money you save today isn\'t just cash; it\'s future security and freedom from corporate extraction.'
        },
        {
            id: 'env',
            name: 'Conservation',
            icon: <Leaf size={18} />,
            level: envLevel,
            progress: envProgress,
            currentXP: `Diverted: ${envUnits.toFixed(1)}`,
            nextLevelXP: `Goal: ${envNextTarget}`,
            color: 'bg-emerald-500',
            bg: 'bg-emerald-900/30 text-emerald-400',
            description: 'Toxic waste diverted',
            realityCheck: 'Vape batteries leach cobalt and lead. By not buying, you are directly preventing heavy metals from entering the water table and soil.'
        }
    ];

    return skills;
  }, [entries, config, lastPuffTime, startDate, currentTimestamp]);

  // Calculate total level
  const totalLevel = stats.reduce((acc, curr) => acc + curr.level, 0);

  // Shop Items & Game Data ... (Keep all existing shop/game data)
  const shopItems: ShopItem[] = [
    // ANIMALS
    {
        id: 'clever_fox',
        name: 'Clever Fox',
        category: 'ANIMALS',
        icon: <Dog size={24} />, 
        cost: 450,
        description: 'Always finds the hidden loot.',
        color: 'text-orange-500 bg-orange-900/20'
    },
    {
        id: 'patient_turtle',
        name: 'Patient Turtle',
        category: 'ANIMALS',
        icon: <Turtle size={24} />,
        cost: 800,
        description: 'Ancient wisdom wrapped in a shell.',
        color: 'text-green-600 bg-green-900/20'
    },
    {
        id: 'brave_cat',
        name: 'Brave Cat',
        category: 'ANIMALS',
        icon: <Cat size={24} />,
        cost: 1200,
        description: 'Walks where it pleases. Fearless.',
        color: 'text-slate-300 bg-slate-700/50'
    },
    {
        id: 'wise_panda',
        name: 'Wise Panda',
        category: 'ANIMALS',
        icon: <PawPrint size={24} />,
        cost: 2000,
        description: 'Master of inner peace and snacks.',
        color: 'text-zinc-900 bg-white' // Black text on white bg for Panda look
    },
    {
        id: 'mystical_snail',
        name: 'Mystical Snail',
        category: 'ANIMALS',
        icon: <Snail size={24} />,
        cost: 600,
        description: 'Leaves a trail of stardust.',
        color: 'text-purple-400 bg-purple-900/20'
    },
    {
        id: 'mystery_egg',
        name: 'Mystery Egg',
        category: 'ANIMALS',
        icon: <Egg size={24} />,
        cost: 5,
        description: 'A mysterious glow pulses from within.',
        color: 'text-pink-300 bg-pink-900/20'
    },
    // ITEMS
    {
        id: 'torch',
        name: 'Torch',
        category: 'ITEMS',
        icon: <Flame size={24} />,
        cost: 300,
        description: 'Illuminates even the darkest dungeons.',
        color: 'text-orange-500 bg-orange-900/20'
    },
    {
        id: 'shield_item',
        name: 'Shield',
        category: 'ITEMS',
        icon: <Shield size={24} />,
        cost: 650,
        description: 'Deflects incoming damage.',
        color: 'text-emerald-400 bg-emerald-900/20'
    },
    {
        id: 'sword',
        name: 'Sword',
        category: 'ITEMS',
        icon: <Sword size={24} />,
        cost: 1100,
        description: 'A legendary blade for epic battles.',
        color: 'text-slate-200 bg-slate-700/50'
    },
    {
        id: 'armor',
        name: 'Armor',
        category: 'ITEMS',
        icon: <Shirt size={24} />,
        cost: 2500,
        description: 'Grants +50 Defense to the wearer.',
        color: 'text-blue-400 bg-blue-900/20'
    },
  ];

  const hiddenItems: Record<string, ShopItem> = {
      'freedom_eagle': {
          id: 'freedom_eagle',
          name: 'Freedom Eagle',
          category: 'ANIMALS',
          icon: <Bird size={24} />,
          cost: 0,
          description: 'Soars above all obstacles with ease.',
          color: 'text-amber-400 bg-amber-900/20'
      }
  };

  const riddles = [
    {
      id: 'riddle_1',
      difficulty: 'Easy',
      question: "What has hands but cannot clap?",
      answer: "Clock",
      reward: 20
    },
    {
      id: 'riddle_2',
      difficulty: 'Medium',
      question: "What has many keys but can't open a single lock?",
      answer: "Piano",
      reward: 50
    },
    {
      id: 'riddle_3',
      difficulty: 'Hard',
      question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
      answer: "M",
      reward: 100
    },
    {
      id: 'riddle_4',
      difficulty: 'Expert',
      question: "I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?",
      answer: "Fire",
      reward: 250
    },
    {
      id: 'riddle_5',
      difficulty: 'Master',
      question: "What walks on four legs in the morning, two legs at noon, and three legs in the evening?",
      answer: "Man", // Accepting Man or Human
      reward: 500
    }
  ];

  const scrambles = [
    {
      id: 'scramble_1',
      difficulty: 'Level 1',
      scrambled: 'MIST',
      answer: 'MIST', 
      display: 'STIM',
      reward: 20
    },
    {
      id: 'scramble_2',
      difficulty: 'Level 2',
      scrambled: 'DETOX',
      answer: 'DETOX',
      display: 'XODTE',
      reward: 50
    },
    {
      id: 'scramble_3',
      difficulty: 'Level 3',
      scrambled: 'OXYGEN',
      answer: 'OXYGEN',
      display: 'GEXYON',
      reward: 100
    },
    {
      id: 'scramble_4',
      difficulty: 'Level 4',
      scrambled: 'BREATHE',
      answer: 'BREATHE',
      display: 'EEHBAR T',
      reward: 250
    },
    {
      id: 'scramble_5',
      difficulty: 'Level 5',
      scrambled: 'VICTORY',
      answer: 'VICTORY',
      display: 'YROTCIV',
      reward: 500
    }
  ];

  const trivia = [
      {
          id: 'trivia_1',
          difficulty: 'Fact 1',
          question: "What toxic metal is commonly found in heated vape coils?",
          answer: "Lead",
          options: ["Gold", "Lead", "Silver", "Platinum"],
          reward: 30
      },
      {
          id: 'trivia_2',
          difficulty: 'Fact 2',
          question: "Nicotine reaches the brain within how many seconds of inhaling?",
          answer: "10 Seconds",
          options: ["10 Seconds", "2 Minutes", "5 Minutes", "1 Hour"],
          reward: 60
      },
      {
          id: 'trivia_3',
          difficulty: 'Fact 3',
          question: "Which chemical used in vape flavoring is linked to 'Popcorn Lung'?",
          answer: "Diacetyl",
          options: ["Formaldehyde", "Diacetyl", "Glycerin", "Propylene"],
          reward: 120
      },
      {
          id: 'trivia_4',
          difficulty: 'Fact 4',
          question: "How long does it take for your heart rate to drop after quitting?",
          answer: "20 Minutes",
          options: ["20 Minutes", "24 Hours", "1 Week", "1 Month"],
          reward: 200
      },
      {
          id: 'trivia_5',
          difficulty: 'Fact 5',
          question: "E-cigarette waste (batteries) contains which valuable resource?",
          answer: "Lithium",
          options: ["Diamond", "Lithium", "Uranium", "Titanium"],
          reward: 400
      }
  ];

  const mathProblems = [
      { id: 'math_1', difficulty: 'Level 1', question: "15 + 7 = ?", answer: "22", reward: 15 },
      { id: 'math_2', difficulty: 'Level 2', question: "8 x 4 = ?", answer: "32", reward: 30 },
      { id: 'math_3', difficulty: 'Level 3', question: "50 - 18 = ?", answer: "32", reward: 60 },
      { id: 'math_4', difficulty: 'Level 4', question: "144 / 12 = ?", answer: "12", reward: 120 },
      { id: 'math_5', difficulty: 'Level 5', question: "7 x 7 + 10 = ?", answer: "59", reward: 250 },
  ];

  // Generic Answer Handler
  const handleSubmitAnswer = (id: string, correctAnswer: string, reward: number) => {
      const cleanAnswer = gameInput.trim().toLowerCase();
      const cleanCorrect = correctAnswer.trim().toLowerCase();
      
      let isCorrect = cleanAnswer === cleanCorrect;
      
      // Special cases
      if (cleanCorrect === 'man' && (cleanAnswer === 'human' || cleanAnswer === 'person')) isCorrect = true;
      if (cleanCorrect === 'm' && (cleanAnswer === 'the letter m' || cleanAnswer === 'letter m')) isCorrect = true;

      if (isCorrect) {
          setGameFeedback('success');
          setTimeout(() => {
              const newSolved = [...solvedGameIds, id];
              setSolvedGameIds(newSolved);
              localStorage.setItem(GAME_PROGRESS_KEY, JSON.stringify(newSolved));
              onEarn(reward);
              setGameFeedback('idle');
              // BUG FIX: Only collapse if the solved level is still the active one
              setActiveLevelId(prev => prev === id ? null : prev);
              setGameInput('');
          }, 1500);
      } else {
          setGameFeedback('error');
          setTimeout(() => setGameFeedback('idle'), 2000);
      }
  };

  // Multiple Choice Handler
  const handleOptionSelect = (id: string, selectedOption: string, correctAnswer: string, reward: number) => {
      if (selectedOption === correctAnswer) {
          setGameFeedback('success');
          setTimeout(() => {
              const newSolved = [...solvedGameIds, id];
              setSolvedGameIds(newSolved);
              localStorage.setItem(GAME_PROGRESS_KEY, JSON.stringify(newSolved));
              onEarn(reward);
              setGameFeedback('idle');
              // BUG FIX: Only collapse if the solved level is still the active one
              setActiveLevelId(prev => prev === id ? null : prev);
          }, 1500);
      } else {
          setGameFeedback('error');
          setTimeout(() => setGameFeedback('idle'), 2000);
      }
  }

  const toggleGameCategory = (category: string) => {
      onDiscover(`game_cat_${category}`);
      if (expandedGameCategory === category) {
          setExpandedGameCategory(null);
      } else {
          setExpandedGameCategory(category);
      }
  };

  // Sorting Logic
  const sortedShopItems = useMemo(() => {
    return [...shopItems].sort((a, b) => {
      if (sortOption === 'price_asc') return a.cost - b.cost;
      if (sortOption === 'price_desc') return b.cost - a.cost;
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [shopItems, sortOption]);

  const categories = ['ANIMALS', 'ITEMS'];

  // Inventory Logic with Evolution
  const inventoryDisplayItems = useMemo(() => {
      return inventory.map(item => {
          let details = shopItems.find(s => s.id === item.id) || hiddenItems[item.id];
          
          // EGG EVOLUTION LOGIC
          if (item.id === 'mystery_egg') {
              const daysOwned = (Date.now() - item.purchasedAt) / (1000 * 60 * 60 * 24);
              if (daysOwned >= 30) {
                  // Evolved!
                  details = hiddenItems['freedom_eagle'];
                  return { ...details, uniqueId: item.id, purchasedAt: item.purchasedAt, isEvolved: true };
              }
              return { ...details, uniqueId: item.id, purchasedAt: item.purchasedAt, isEvolved: false, daysOwned };
          }

          if (!details) return null;
          return { ...details, uniqueId: item.id, purchasedAt: item.purchasedAt };
      }).filter(Boolean) as (ShopItem & { uniqueId: string, purchasedAt: number, isEvolved?: boolean, daysOwned?: number })[];
  }, [inventory, shopItems]);

  return (
    <div className="w-full bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-800 transition-colors duration-300">
      <div className="flex justify-between items-start mb-6 cursor-pointer group" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-900/30 rounded-xl text-indigo-400 shadow-inner">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Adventure</h3>
             <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded-md">Lvl {totalLevel}</span>
             </div>
          </div>
        </div>
        <button 
           onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
           className="p-2 text-slate-600 hover:text-slate-400 transition-colors rounded-full hover:bg-slate-800"
        >
           {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="animate-scale-in origin-top">
            
            {/* Tab Navigation */}
            <div className="flex p-1 bg-slate-800 rounded-xl mb-6 overflow-x-auto custom-scrollbar">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleTabChange('journey'); }}
                  className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'journey' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Trophy size={14} /> My Journey
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleTabChange('inventory'); }}
                  className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Box size={14} /> Inventory
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleTabChange('games'); }}
                  className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'games' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Gamepad2 size={14} /> Games
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleTabChange('shop'); }}
                  className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'shop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <ShoppingBag size={14} /> Shop
                </button>
            </div>

            {/* TAB CONTENT */}

            {/* 1. JOURNEY */}
            {activeTab === 'journey' && (
                <div className="grid gap-6 animate-fade-in">
                    
                    {/* XP HERO BANNER */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-center border border-indigo-500/50 shadow-lg shadow-indigo-900/30">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Trophy size={100} />
                        </div>
                        <h4 className="font-bold text-indigo-200 text-xs uppercase tracking-widest mb-1 relative z-10">Total Experience</h4>
                        <div className="text-4xl font-black text-white tracking-tight relative z-10 font-mono">
                            {totalXP.toLocaleString()} <span className="text-lg font-bold text-indigo-300">XP</span>
                        </div>
                        <div className="mt-3 flex justify-center gap-2 relative z-10">
                             <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] text-indigo-100 font-bold backdrop-blur-sm border border-white/10">
                                 Resists = 50 XP
                             </div>
                             <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] text-indigo-100 font-bold backdrop-blur-sm border border-white/10">
                                 Clean Days = 100 XP
                             </div>
                             <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] text-indigo-100 font-bold backdrop-blur-sm border border-white/10">
                                 Discoveries = 50 XP
                             </div>
                        </div>
                    </div>

                    {stats.map((skill) => (
                        <div key={skill.id} className="relative group">
                            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-transparent bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 transition-all">
                                
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${skill.bg}`}>
                                        {skill.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                                            {skill.name}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Lvl {skill.level}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                            <div 
                                                className={`h-full ${skill.color} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)]`} 
                                                style={{ width: `${skill.progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] text-slate-400 font-mono font-bold">{skill.currentXP}</span>
                                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide text-right">{skill.nextLevelXP}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 pt-3 border-t border-slate-700/50 flex gap-2">
                                     <Beaker size={14} className="text-slate-500 shrink-0 mt-0.5" />
                                     <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                         {skill.realityCheck}
                                     </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 2. INVENTORY */}
            {activeTab === 'inventory' && (
                <div className="animate-fade-in">
                    {inventoryDisplayItems.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                             <Box size={32} className="text-slate-700 mx-auto mb-3" />
                             <p className="text-slate-500 font-bold text-sm">Your inventory is empty</p>
                             <p className="text-slate-600 text-xs mt-1">Visit the shop to buy items</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {inventoryDisplayItems.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center relative overflow-hidden group">
                                     {item.isEvolved && (
                                         <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl shadow-lg">
                                             HATCHED
                                         </div>
                                     )}
                                     
                                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${item.color ? item.color.split(' ')[1] : 'bg-slate-700'} ${item.color ? item.color.split(' ')[0] : 'text-slate-200'}`}>
                                          {item.icon}
                                     </div>
                                     <h4 className="font-bold text-slate-200 text-sm mb-1">{item.name}</h4>
                                     <p className="text-[10px] text-slate-400 leading-tight mb-2 h-8 line-clamp-2">{item.description}</p>
                                     
                                     {/* Evolution Progress Bar for Egg */}
                                     {item.id === 'mystery_egg' && !item.isEvolved && item.daysOwned !== undefined && (
                                         <div className="w-full mt-2">
                                             <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase mb-1">
                                                <span>Incubating</span>
                                                <span>{Math.floor(item.daysOwned)}/30 Days</span>
                                             </div>
                                             <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                                 <div 
                                                     className="h-full bg-pink-500 rounded-full transition-all duration-500"
                                                     style={{ width: `${Math.min(100, (item.daysOwned / 30) * 100)}%` }}
                                                 ></div>
                                             </div>
                                         </div>
                                     )}

                                     <div className="mt-auto pt-2 text-[10px] text-slate-600 font-mono">
                                         Acquired: {new Date(item.purchasedAt).toLocaleDateString()}
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 3. GAMES */}
            {activeTab === 'games' && (
                <div className="animate-fade-in space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 mb-6 flex flex-col items-center text-center">
                        <Gamepad2 size={32} className="text-indigo-400 mb-2" />
                        <h4 className="text-lg font-bold text-slate-200">Brain Training</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">Distract your mind from cravings. Solve riddles and puzzles to earn credits.</p>
                    </div>

                    {/* ZEN BREATHER SECTION */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/30 overflow-hidden relative">
                        <div 
                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                           onClick={() => toggleGameCategory('zen_breather')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                                    <Wind size={20} />
                                </div>
                                <h4 className="font-bold text-slate-200 text-sm">4-7-8 Technique</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    Interactive Pacer
                                </span>
                                {expandedGameCategory === 'zen_breather' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                            </div>
                        </div>

                        {expandedGameCategory === 'zen_breather' && (
                            <div className="p-6 pt-2 animate-scale-in origin-top flex flex-col items-center relative">
                                
                                {/* Mute Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setZenMuted(!zenMuted); }}
                                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-300 transition-colors rounded-full hover:bg-slate-800/50"
                                    title={zenMuted ? "Unmute Voice" : "Mute Voice"}
                                >
                                    {zenMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>

                                <p className="text-xs text-slate-400 text-center mb-6 max-w-xs">
                                    Click and hold the circle to sync your breathing. The voice will guide you.
                                    <br/>
                                    <span className="text-cyan-400 font-bold">Inhale (4s)</span> • <span className="text-indigo-400 font-bold">Hold (7s)</span> • <span className="text-emerald-400 font-bold">Exhale (8s)</span>
                                </p>

                                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                                    {/* Pulse Rings */}
                                    {zenPhase !== 'idle' && zenPhase !== 'success' && (
                                        <div className={`absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping ${zenPhase === 'hold' ? 'animation-pause' : ''}`}></div>
                                    )}
                                    
                                    {/* Reward Notification */}
                                    {showZenReward && (
                                        <div className="absolute -top-10 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                            <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                                                <Gem size={12} /> +50 Credits
                                            </div>
                                        </div>
                                    )}

                                    {/* Main Interaction Circle */}
                                    <button
                                        onMouseDown={() => setZenIsHolding(true)}
                                        onMouseUp={() => setZenIsHolding(false)}
                                        onMouseLeave={() => setZenIsHolding(false)}
                                        onTouchStart={(e) => { e.preventDefault(); setZenIsHolding(true); }}
                                        onTouchEnd={(e) => { e.preventDefault(); setZenIsHolding(false); }}
                                        onClick={zenPhase === 'idle' || zenPhase === 'success' ? startZenGame : undefined}
                                        disabled={zenPhase === 'success'}
                                        className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-[4000ms] select-none touch-none ${
                                            zenPhase === 'idle' ? 'bg-slate-700 scale-100 hover:bg-slate-600 cursor-pointer' :
                                            zenPhase === 'inhale' ? 'bg-cyan-500 scale-150 shadow-[0_0_50px_rgba(6,182,212,0.5)]' :
                                            zenPhase === 'hold' ? 'bg-indigo-500 scale-150 shadow-[0_0_50px_rgba(99,102,241,0.5)] duration-100' :
                                            zenPhase === 'exhale' ? 'bg-emerald-500 scale-100 shadow-none duration-[8000ms]' :
                                            'bg-amber-500 scale-110 shadow-[0_0_50px_rgba(245,158,11,0.5)] cursor-default'
                                        } ${isZenSyncError ? 'ring-4 ring-red-500 ring-offset-4 ring-offset-slate-900 animate-pulse' : ''}`}
                                    >
                                        {zenPhase === 'idle' && <Play size={32} className="text-white ml-1" />}
                                        {zenPhase === 'success' && <Check size={32} className="text-white" />}
                                        {zenPhase !== 'idle' && zenPhase !== 'success' && (
                                            <div className="text-center pointer-events-none">
                                                <span className="block text-xs font-bold text-white/80 uppercase tracking-widest mb-1">{zenPhase}</span>
                                                {isZenSyncError && (
                                                    <span className="block text-[10px] font-bold text-red-100 bg-red-500/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                        {(zenPhase === 'inhale' || zenPhase === 'hold') ? 'HOLD ME!' : 'RELEASE!'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                </div>

                                <div className="text-center space-y-2 h-16">
                                    <h3 className={`text-xl font-bold transition-colors ${
                                        zenPhase === 'inhale' ? 'text-cyan-400' :
                                        zenPhase === 'hold' ? 'text-indigo-400' :
                                        zenPhase === 'exhale' ? 'text-emerald-400' :
                                        zenPhase === 'success' ? 'text-amber-400' :
                                        'text-slate-200'
                                    }`}>
                                        {zenMessage}
                                    </h3>
                                    {zenPhase !== 'idle' && zenPhase !== 'success' && (
                                        <p className="text-xs text-slate-500 font-mono">
                                            Cycle {zenCycle + 1}/3
                                        </p>
                                    )}
                                </div>

                                {zenPhase !== 'idle' && zenPhase !== 'success' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); stopZenGame(); }}
                                        className="mt-4 p-2 text-slate-500 hover:text-red-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                                    >
                                        <RotateCcw size={14} /> Stop
                                    </button>
                                )}

                                {/* Information Section */}
                                <div className="mt-8 w-full max-w-sm bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                                    <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700/50">
                                        <Info size={16} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">About the 4-7-8 Technique</span>
                                    </div>
                                    <div className="p-5 space-y-4 text-xs text-slate-400">
                                        <div className="flex gap-3">
                                            <div className="p-2 bg-amber-500/10 rounded-lg h-fit shrink-0">
                                                <User size={16} className="text-amber-400" />
                                            </div>
                                            <div>
                                                <strong className="text-amber-400 block mb-1 uppercase text-[10px] tracking-wider">Proper Form</strong>
                                                <p className="leading-relaxed">Place the tip of your tongue against the ridge of tissue just behind your upper front teeth and keep it there. Exhale completely through your mouth, making a whoosh sound.</p>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-800/80 w-full"></div>

                                        <div className="flex gap-3">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg h-fit shrink-0">
                                                <History size={16} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <strong className="text-indigo-400 block mb-1 uppercase text-[10px] tracking-wider">Origin</strong>
                                                <p className="leading-relaxed">Popularized by Dr. Andrew Weil, this ancient yogic technique (pranayama) acts as a natural tranquilizer for the nervous system.</p>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-800/80 w-full"></div>

                                        <div className="flex gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg h-fit shrink-0">
                                                <Zap size={16} className="text-emerald-400" />
                                            </div>
                                            <div>
                                                <strong className="text-emerald-400 block mb-1 uppercase text-[10px] tracking-wider">Why it works</strong>
                                                <p className="leading-relaxed">Extending the exhale to 8 seconds stimulates the Vagus nerve, forcing your body to switch from "fight or flight" (sympathetic) to "rest and digest" (parasympathetic) mode.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TIC TAC TOE */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/30 overflow-hidden relative">
                        <div 
                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                           onClick={() => toggleGameCategory('craving_crusher')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                                    <Grid3x3 size={20} />
                                </div>
                                <h4 className="font-bold text-slate-200 text-sm">Tic-Tac-Toe</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    Classic Game
                                </span>
                                {expandedGameCategory === 'craving_crusher' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                            </div>
                        </div>

                        {expandedGameCategory === 'craving_crusher' && (
                            <div className="p-6 pt-2 animate-scale-in origin-top">
                                <div className="flex flex-col items-center">
                                    <p className="text-xs text-slate-400 text-center mb-6 max-w-xs">
                                        Beat the AI to earn credits. You are <span className="text-indigo-400 font-bold">X</span>.
                                    </p>

                                    {/* Difficulty Selector */}
                                    <div className="flex bg-slate-900 rounded-lg p-1 mb-6">
                                        {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                                            <button
                                                key={diff}
                                                onClick={() => !ccBoard.some(c => c !== null) && setCcDifficulty(diff)}
                                                disabled={ccBoard.some(c => c !== null)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                                    ccDifficulty === diff 
                                                    ? 'bg-rose-600 text-white shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-300 disabled:opacity-50'
                                                }`}
                                            >
                                                {diff}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Game Board */}
                                    <div className="grid grid-cols-3 gap-2 bg-slate-800 p-2 rounded-2xl mb-6">
                                        {ccBoard.map((cell, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleCcClick(idx)}
                                                disabled={!!cell || !!ccWinner || !ccIsPlayerTurn || ccIsThinking}
                                                className={`w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-xl flex items-center justify-center text-2xl transition-all ${
                                                    !cell && !ccWinner && ccIsPlayerTurn ? 'hover:bg-slate-800' : ''
                                                } ${
                                                    cell === 'X' ? 'border-2 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 
                                                    cell === 'O' ? 'border-2 border-rose-500/30' : ''
                                                }`}
                                            >
                                                {cell === 'X' && <X size={40} className="text-indigo-400 animate-scale-in" />}
                                                {cell === 'O' && <Circle size={32} className="text-rose-400 animate-scale-in" />}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Status Message */}
                                    <div className="h-12 flex flex-col items-center justify-center">
                                        {ccWinner ? (
                                            <div className="animate-scale-in text-center">
                                                <h3 className={`text-lg font-bold ${
                                                    ccWinner === 'player' ? 'text-emerald-400' :
                                                    ccWinner === 'ai' ? 'text-rose-400' : 'text-slate-400'
                                                }`}>
                                                    {ccWinner === 'player' ? 'Victory! +Reward' : 
                                                     ccWinner === 'ai' ? 'AI Won...' : 'It\'s a Draw'}
                                                </h3>
                                                <button 
                                                    onClick={resetCcGame}
                                                    className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                                >
                                                    <RotateCcw size={12} /> Play Again
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                                {ccIsThinking ? (
                                                    <>
                                                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                                                        AI Thinking...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                        Your Turn
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIDDLES SECTION */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/30 overflow-hidden">
                        <div 
                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                           onClick={() => toggleGameCategory('riddles')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                    <HelpCircle size={20} />
                                </div>
                                <h4 className="font-bold text-slate-200 text-sm">Riddles</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    {riddles.filter(r => solvedGameIds.includes(r.id)).length}/{riddles.length} Solved
                                </span>
                                {expandedGameCategory === 'riddles' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                            </div>
                        </div>

                        {expandedGameCategory === 'riddles' && (
                            <div className="p-3 pt-0 space-y-3 animate-scale-in origin-top">
                                <div className="h-px bg-slate-800 mb-3"></div>
                                {riddles.map((riddle) => {
                                    const isSolved = solvedGameIds.includes(riddle.id);
                                    const isActive = activeLevelId === riddle.id;

                                    return (
                                        <div key={riddle.id} className={`rounded-xl border transition-all ${
                                            isSolved 
                                                ? 'bg-emerald-900/10 border-emerald-900/20' 
                                                : isActive 
                                                    ? 'bg-slate-800 border-indigo-500/50' 
                                                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                                        }`}>
                                            <button 
                                                onClick={() => !isSolved && setActiveLevelId(isActive ? null : riddle.id)}
                                                disabled={isSolved}
                                                className="w-full flex items-center justify-between p-4 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                        isSolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                                                    }`}>
                                                        {isSolved ? <Check size={16} /> : <HelpCircle size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-sm text-slate-200">Level {riddle.id.split('_')[1]}</span>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                                riddle.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                                riddle.difficulty === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                                                                riddle.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-purple-500/20 text-purple-400'
                                                            }`}>{riddle.difficulty}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                                            <Gem size={10} className="text-indigo-400" />
                                                            <span className="text-indigo-400">+{riddle.reward} Credits</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isSolved && (
                                                    <div className="text-slate-500">
                                                        {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                )}
                                            </button>

                                            {isActive && !isSolved && (
                                                <div className="px-4 pb-4 animate-scale-in origin-top">
                                                    <p className="text-sm text-slate-300 italic mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                                        "{riddle.question}"
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={gameInput}
                                                            onChange={(e) => setGameInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer(riddle.id, riddle.answer, riddle.reward)}
                                                            placeholder="Type answer..."
                                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 text-sm"
                                                        />
                                                        <button 
                                                            onClick={() => handleSubmitAnswer(riddle.id, riddle.answer, riddle.reward)}
                                                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                                                gameFeedback === 'success' ? 'bg-emerald-500 text-white' :
                                                                gameFeedback === 'error' ? 'bg-red-500 text-white' :
                                                                'bg-indigo-600 text-white hover:bg-indigo-700'
                                                            }`}
                                                        >
                                                            {gameFeedback === 'success' ? <Check size={18} /> : 
                                                            gameFeedback === 'error' ? 'Wrong' : 'Solve'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* WORD SCRAMBLE SECTION */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/30 overflow-hidden">
                        <div 
                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                           onClick={() => toggleGameCategory('scramble')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                                    <Shuffle size={20} />
                                </div>
                                <h4 className="font-bold text-slate-200 text-sm">Word Scramble</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    {scrambles.filter(s => solvedGameIds.includes(s.id)).length}/{scrambles.length} Solved
                                </span>
                                {expandedGameCategory === 'scramble' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                            </div>
                        </div>

                        {expandedGameCategory === 'scramble' && (
                            <div className="p-3 pt-0 space-y-3 animate-scale-in origin-top">
                                <div className="h-px bg-slate-800 mb-3"></div>
                                {scrambles.map((scramble) => {
                                    const isSolved = solvedGameIds.includes(scramble.id);
                                    const isActive = activeLevelId === scramble.id;

                                    return (
                                        <div key={scramble.id} className={`rounded-xl border transition-all ${
                                            isSolved 
                                                ? 'bg-emerald-900/10 border-emerald-900/20' 
                                                : isActive 
                                                    ? 'bg-slate-800 border-pink-500/50' 
                                                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                                        }`}>
                                            <button 
                                                onClick={() => !isSolved && setActiveLevelId(isActive ? null : scramble.id)}
                                                disabled={isSolved}
                                                className="w-full flex items-center justify-between p-4 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                        isSolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                                                    }`}>
                                                        {isSolved ? <Check size={16} /> : <Type size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-sm text-slate-200">{scramble.difficulty}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                                            <Gem size={10} className="text-indigo-400" />
                                                            <span className="text-indigo-400">+{scramble.reward} Credits</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isSolved && (
                                                    <div className="text-slate-500">
                                                        {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                )}
                                            </button>

                                            {isActive && !isSolved && (
                                                <div className="px-4 pb-4 animate-scale-in origin-top">
                                                    <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
                                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Unscramble This</p>
                                                        <p className="text-2xl font-black text-white tracking-widest font-mono">{scramble.display}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={gameInput}
                                                            onChange={(e) => setGameInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer(scramble.id, scramble.answer, scramble.reward)}
                                                            placeholder="Answer"
                                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 text-sm font-mono text-center"
                                                        />
                                                        <button 
                                                            onClick={() => handleSubmitAnswer(scramble.id, scramble.answer, scramble.reward)}
                                                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                                                gameFeedback === 'success' ? 'bg-emerald-500 text-white' :
                                                                gameFeedback === 'error' ? 'bg-red-500 text-white' :
                                                                'bg-pink-600 text-white hover:bg-pink-700'
                                                            }`}
                                                        >
                                                            {gameFeedback === 'success' ? <Check size={18} /> : 
                                                            gameFeedback === 'error' ? 'Wrong' : 'Solve'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* HEALTH TRIVIA SECTION */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/30 overflow-hidden">
                        <div 
                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                           onClick={() => toggleGameCategory('trivia')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                    <GraduationCap size={20} />
                                </div>
                                <h4 className="font-bold text-slate-200 text-sm">Health Trivia</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    {trivia.filter(t => solvedGameIds.includes(t.id)).length}/{trivia.length} Solved
                                </span>
                                {expandedGameCategory === 'trivia' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                            </div>
                        </div>

                        {expandedGameCategory === 'trivia' && (
                            <div className="p-3 pt-0 space-y-3 animate-scale-in origin-top">
                                <div className="h-px bg-slate-800 mb-3"></div>
                                {trivia.map((item) => {
                                    const isSolved = solvedGameIds.includes(item.id);
                                    const isActive = activeLevelId === item.id;

                                    return (
                                        <div key={item.id} className={`rounded-xl border transition-all ${
                                            isSolved 
                                                ? 'bg-emerald-900/10 border-emerald-900/20' 
                                                : isActive 
                                                    ? 'bg-slate-800 border-emerald-500/50' 
                                                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                                        }`}>
                                            <button 
                                                onClick={() => !isSolved && setActiveLevelId(isActive ? null : item.id)}
                                                disabled={isSolved}
                                                className="w-full flex items-center justify-between p-4 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                        isSolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                                                    }`}>
                                                        {isSolved ? <Check size={16} /> : <GraduationCap size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-sm text-slate-200">{item.difficulty}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                                            <Gem size={10} className="text-indigo-400" />
                                                            <span className="text-indigo-400">+{item.reward} Credits</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isSolved && (
                                                    <div className="text-slate-500">
                                                        {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                )}
                                            </button>

                                            {isActive && !isSolved && (
                                                <div className="px-4 pb-4 animate-scale-in origin-top">
                                                    <p className="text-sm text-slate-200 font-bold mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                                        {item.question}
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {item.options.map((option) => (
                                                            <button 
                                                                key={option}
                                                                onClick={() => handleOptionSelect(item.id, option, item.answer, item.reward)}
                                                                className="py-3 px-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all hover:scale-[0.98] active:scale-95 border border-slate-700 hover:border-emerald-500/30"
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {gameFeedback === 'error' && (
                                                         <p className="text-xs text-red-400 font-bold text-center mt-3 animate-pulse">Incorrect, try again!</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* QUICK MATH SECTION */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/30 overflow-hidden">
                        <div 
                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                           onClick={() => toggleGameCategory('math')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                                    <Calculator size={20} />
                                </div>
                                <h4 className="font-bold text-slate-200 text-sm">Quick Math</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    {mathProblems.filter(m => solvedGameIds.includes(m.id)).length}/{mathProblems.length} Solved
                                </span>
                                {expandedGameCategory === 'math' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                            </div>
                        </div>

                        {expandedGameCategory === 'math' && (
                            <div className="p-3 pt-0 space-y-3 animate-scale-in origin-top">
                                <div className="h-px bg-slate-800 mb-3"></div>
                                {mathProblems.map((problem) => {
                                    const isSolved = solvedGameIds.includes(problem.id);
                                    const isActive = activeLevelId === problem.id;

                                    return (
                                        <div key={problem.id} className={`rounded-xl border transition-all ${
                                            isSolved 
                                                ? 'bg-emerald-900/10 border-emerald-900/20' 
                                                : isActive 
                                                    ? 'bg-slate-800 border-amber-500/50' 
                                                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                                        }`}>
                                            <button 
                                                onClick={() => !isSolved && setActiveLevelId(isActive ? null : problem.id)}
                                                disabled={isSolved}
                                                className="w-full flex items-center justify-between p-4 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                        isSolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                                                    }`}>
                                                        {isSolved ? <Check size={16} /> : <Calculator size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-sm text-slate-200">{problem.difficulty}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                                            <Gem size={10} className="text-indigo-400" />
                                                            <span className="text-indigo-400">+{problem.reward} Credits</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isSolved && (
                                                    <div className="text-slate-500">
                                                        {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                )}
                                            </button>

                                            {isActive && !isSolved && (
                                                <div className="px-4 pb-4 animate-scale-in origin-top">
                                                    <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
                                                        <p className="text-3xl font-black text-white tracking-widest font-mono">{problem.question}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={gameInput}
                                                            onChange={(e) => setGameInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer(problem.id, problem.answer, problem.reward)}
                                                            placeholder="Answer"
                                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 text-sm font-mono text-center"
                                                        />
                                                        <button 
                                                            onClick={() => handleSubmitAnswer(problem.id, problem.answer, problem.reward)}
                                                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                                                gameFeedback === 'success' ? 'bg-emerald-500 text-white' :
                                                                gameFeedback === 'error' ? 'bg-red-500 text-white' :
                                                                'bg-amber-600 text-white hover:bg-amber-700'
                                                            }`}
                                                        >
                                                            {gameFeedback === 'success' ? <Check size={18} /> : 
                                                            gameFeedback === 'error' ? 'Wrong' : 'Solve'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* 4. SHOP */}
            {activeTab === 'shop' && (
                <div className="animate-fade-in">
                    
                    {/* Compact Credits UI */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-800/80 px-6 py-2 rounded-full border border-slate-700 flex items-center gap-3 shadow-sm hover:bg-slate-800 transition-colors cursor-default">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Credits</span>
                             <div className="h-4 w-px bg-slate-700"></div>
                             <div className="flex items-center gap-1.5 text-indigo-400">
                                <Gem size={14} />
                                <span className="text-lg font-bold font-mono tracking-tight">{balance.toLocaleString()}</span>
                             </div>
                        </div>
                    </div>

                    {/* Sorting Controls */}
                    <div className="flex justify-end mb-2">
                        <div className="relative group">
                            <ArrowUpDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="appearance-none bg-slate-800/50 text-xs font-bold text-slate-400 border border-slate-700 rounded-lg py-2 pl-8 pr-8 focus:ring-0 focus:border-indigo-500/50 hover:bg-slate-800 cursor-pointer outline-none transition-colors"
                            >
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="name">Name</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-8">
                      {categories.map((category) => {
                        const itemsInCategory = sortedShopItems.filter(i => i.category === category);
                        if (itemsInCategory.length === 0) return null;

                        return (
                          <div key={category}>
                            <h4 className="text-xs font-bold text-slate-500 mb-3 px-1 tracking-wider">{category}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {itemsInCategory.map((item) => {
                                    // Check if owned (ignoring duplicates for now, but usually unique)
                                    const isOwned = !item.locked && inventory.some(i => i.id === item.id);
                                    const canAfford = balance >= item.cost;

                                    return (
                                        <div key={item.id} className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                                            item.locked 
                                              ? 'bg-slate-800/20 border-slate-800 opacity-50' 
                                              : isOwned 
                                                ? 'bg-indigo-900/20 border-indigo-500/30'
                                                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                        }`}>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                                                item.locked ? 'bg-slate-800 text-slate-600' : (item.color ? item.color.split(' ')[1] : 'bg-slate-700') // Extracts bg class or fallback
                                            } ${item.color ? item.color.split(' ')[0] : 'text-slate-200'}`}>
                                                {item.locked ? <Lock size={20} /> : item.icon}
                                            </div>
                                            <h4 className="font-bold text-slate-200 text-sm mb-1">{item.name}</h4>
                                            
                                            {!item.locked && (
                                                <p className="text-[10px] text-slate-400 mb-4 h-8 leading-tight line-clamp-2">{item.description}</p>
                                            )}

                                            {item.locked ? (
                                                <div className="mt-auto pt-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Locked</span>
                                                </div>
                                            ) : isOwned ? (
                                                <div className="mt-auto w-full py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                                    <Check size={14} /> Owned
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => onPurchase(item.id, item.cost)}
                                                    disabled={!canAfford}
                                                    className={`mt-auto w-full py-2 rounded-lg text-xs font-bold transition-all ${
                                                        canAfford 
                                                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20' 
                                                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Buy for {item.cost} Credits
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
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

export default GamificationCard;