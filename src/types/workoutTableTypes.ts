// workoutTableTypes.ts
export interface WorkoutData {
  id: string;
  user: {
    username: string;
    name: string;
  };
  workout_records: {
    id: string;
    weeks: {
      week1: {
        completion_rate: number;
        sessions: number;
      };
      week2: {
        completion_rate: number;
        sessions: number;
      };
      week3: {
        completion_rate: number;
        sessions: number;
      };
      week4: {
        completion_rate: number;
        sessions: number;
      };
      week5: {
        completion_rate: number;
        sessions: number;
      };
      week6: {
        completion_rate: number;
        sessions: number;
      };
      week7: {
        completion_rate: number;
        sessions: number;
      };
    };
  };
  center_name: string;
}

export interface WorkoutStatistics {
  total_workouts: number;
  active_users_today: number;
  total_users_today: number;
  weekly_participation_rate: number;
}

export interface WeekLabel {
  label: string;
  startDate: Date;
  endDate: Date;
  weekNumber?: number;
}

export interface WeeklyChartData {
  cardio: {
    userId: string;
    x: string;
    y: number;
    user: string;
    date: string;
    dayLabel: string;
  }[];
  strength: {
    userId: string;
    x: string;
    y: number;
    user: string;
    date: string;
    dayLabel: string;
  }[];
  users: {
    id: string;
    name: string;
    strengthWorkoutCount: number;
  }[];
  weeks: {
    label: string;
  }[];
  challengePeriod: {
    startDate: string;
    endDate: string;
  };
}

export interface LeaderboardEntry {
  user_id: string;
  user: {
    name: string;
    strengthWorkoutCount: number;
  };
  points: number;
}

export interface TodayCountData {
  count: number;
  total: number;
}

export interface WeekInfo {
  label: string;
  startDate: Date;
  endDate: Date;
  weekNumber: number;
}

export interface WeeklyData {
  weekNumber: number;
  startDate: string; // MM.DD
  endDate: string; // MM.DD
  aerobicPercentage: number; // 0~100
  strengthSessions: number;
}

export interface WorkoutWeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  aerobicPercentage: number;
  strengthSessions: number;
  actualPercentage: number;
  cardio_points_total?: number;
  label: string;
}

export interface WorkoutItem {
  id: string;
  challenge_id: string;
  userId: string;
  userName: string;
  name: string;
  weeklyData: WorkoutWeekData[];
  hasUploaded: boolean;
  activeThisWeek?: boolean;
  actualPercentage?: number;
  totalAchievements?: number;
  label?: string;
  startDate?: Date;
  endDate?: Date;
}


export interface WorkoutTableProps {
  challengeId?: string;
}

export interface MobileWorkoutProps {
  challengeId?: string;
}
