export type MeasureType = "STATE" | "NUMERIC";

export interface Wig {
  id: number;
  title: string;
  fromX: string;
  toY: string;
  byWhen: string;
  measureType: MeasureType;
  unit?: string | null;
}

export interface LeadMeasure {
  id: number;
  name: string;
  dailyTarget: number;
  weeklyTarget: number;
  unit: string;
  wigId: number;
}

export interface Milestone {
  id: number;
  name: string;
  completed: boolean;
  orderIndex: number;
  wigId: number;
}

export interface Commitment {
  id: number;
  text: string;
  week: string;
  completed: boolean;
  wigId: number;
}

export interface WeeklyData {
  id: number;
  week: string;
  milestoneProgress?: number | null;
  actual?: number | null;
  target?: number | null;
  lead1?: number | null;
  lead2?: number | null;
  wigId: number;
}

export interface DailyData {
  id: number;
  date: string;
  week: string;
  dayOfWeek: string;
  lead1?: number | null;
  lead2?: number | null;
  wigId: number;
}

export interface MilestoneProgress {
  total: number;
  completed: number;
  progressRate: number;
}

export interface CommitmentRate {
  total: number;
  completed: number;
  completionRate: number;
}
