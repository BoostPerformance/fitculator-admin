// 타입 정의
export interface WorkoutTypes {
  [key: string]: number;
}

export interface DailyWorkout {
  day: string;
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
  weekNumber: number;
  label: string;
  totalAchievement: number;
  workoutTypes: WorkoutTypes;
  dailyWorkouts: DailyWorkout[];
  totalSessions: number;
  requiredSessions: number;
  feedback: Feedback;
  recordId?: string;
}

export interface UserData {
  name: string;
  achievement: number;
  weeklyWorkouts: WeeklyWorkout[];
}

// API 응답 타입
export interface CoachInfo {
  id: string;
  name: string;
  profile_image_url?: string;
}

export interface FeedbackData {
  id: string;
  ai_feedback?: string;
  coach_feedback?: string;
  coach_memo?: string;
  coach_id?: string;
  created_at: string;
}

export interface WeeklyRecord {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  cardio_points_total: number;
  strength_sessions_count: number;
  created_at: string;
  updated_at: string;
  weekNumber?: number;
  feedback?: FeedbackData | null;
  coach?: CoachInfo | null;
}

export interface UserInfo {
  id: string;
  name: string;
  displayName?: string;
}

export interface ApiStats {
  totalWeeks: number;
  totalCardioPoints: number;
  totalStrengthSessions: number;
}

export interface ApiResponse {
  user: UserInfo;
  weeklyRecords: WeeklyRecord[];
  stats: ApiStats;
  recentWorkouts?: any[];
}
