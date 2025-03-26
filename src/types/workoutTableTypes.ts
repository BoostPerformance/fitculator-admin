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

export interface WorkoutTableProps {
  workoutItems?: WorkoutData[];
  selectedDate?: string;
  loading?: boolean;
  onLoadMore?: (page: number) => void;
  hasMore?: boolean;
}

export interface WorkoutStatistics {
  total_workouts: number;
  active_users_today: number;
  total_users_today: number;
  weekly_participation_rate: number;
}
