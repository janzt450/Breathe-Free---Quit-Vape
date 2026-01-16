export enum LogType {
  PUFF = 'PUFF',
  RESIST = 'RESIST',
}

export interface LogEntry {
  id: string;
  type: LogType;
  timestamp: number;
  count?: number; // Only for PUFF (number of puffs)
  note?: string; // Optional user note
}

export interface UserStats {
  totalPuffs: number;
  totalResists: number;
  lastPuffTimestamp: number | null;
  longestStreakMs: number;
}

export interface FinancialConfig {
  costPerUnit: number;
  daysPerUnit: number;
  currencySymbol: string;
}

export interface InventoryItem {
  id: string;
  purchasedAt: number;
}