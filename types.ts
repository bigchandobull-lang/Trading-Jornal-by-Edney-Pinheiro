import { TFunction } from 'i18next';

export interface TradeTags {
  strategy?: string[];
  trigger?: string[];
  session?: string[];
  mistakes?: string[];
  confidence?: string;
  emotions?: string[];
  custom?: string[];
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  pair: string;
  pnl: number;
  type?: 'long' | 'short';
  notes?: string;
  photos?: string[]; // Array of base64 strings
  tags?: TradeTags;
  rating?: number; // 1-5 star rating
}

export interface DailySummary {
  totalPnl: number;
  tradeCount: number;
}

export interface TradesByDay extends DailySummary {
  trades: Trade[];
}

export interface Streak {
  type: 'win' | 'loss';
  length: number;
}

export interface TagStat {
  tag: string;
  totalPnl: number;
  tradeCount: number;
  winRate: number;
}

export interface ActionableInsight {
  pattern: string;
  recommendation: string;
  relatedTags: string[];
  topic?: 'performance' | 'opportunity' | 'risk' | 'strategy' | 'timing' | 'default';
}

export interface KeyObservation {
  text: string;
  topic?: 'consistency' | 'risk' | 'general' | 'performance' | 'strategy' | 'timing';
}

export interface PerformanceGrade {
    grade: 'A' | 'B' | 'C' | 'D';
    summary: string;
}

export interface AIAnalysisResult {
  overallSummary: string;
  strengths: string[];
  weaknesses: string[];
  actionableInsights: ActionableInsight[];
  keyObservations: KeyObservation[];
  performanceGrade: PerformanceGrade;
  keyMetrics: {
    consistencyScore: number; // Score from 1-10
    profitFactor: number;
    winRate: number;
    totalPnl: number;
    tradeCount: number;
    avgWin: number;
    avgLoss: number;
  };
  tagPerformance?: {
    profitable: TagStat[];
    unprofitable: TagStat[];
  };
}

export type OfflineAnalysisFunction = (trades: Trade[], t: TFunction) => AIAnalysisResult;