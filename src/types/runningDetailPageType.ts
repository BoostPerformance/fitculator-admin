export interface RunningTypes {
  [key: string]: number;
}

export interface DailyRunning {
  day: string;
  value: number;
  status: 'complete' | 'incomplete' | 'rest';
  hasStrength: boolean;
  strengthCount: number;
}
