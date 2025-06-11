export interface DailyWorkout {
  day: string; // '월', '화', ...
  value: number;
  status: 'complete' | 'incomplete' | 'rest';
  hasStrength: boolean;
  strengthCount: number;
}

export interface Feedback {
  text: string;
  author: string;
  date: string;
}

export interface WeeklyWorkout {
  dailyWorkouts: DailyWorkout[];
  feedback: Feedback;
  label: string; // 예: "06.09-06.15"
  recordId: string;
  requiredSessions: number;
  totalAchievement: number;
  totalSessions: number;
  weekNumber: number;
  workoutTypes: { [key: string]: number }; // 예: { 걷기: 71.5, 달리기: 28.5 }
}
export interface UserData {
  name: string;
  achievement: number;
  weeklyWorkouts: WeeklyWorkout[];
}
