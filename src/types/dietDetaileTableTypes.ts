export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'supplement'
  | 'water';

export interface User {
  id: string;
  name: string;
  username: string;
}

export interface Challenges {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  challenge_participants: ChallengeParticipant[];
}

export interface ChallengeParticipant {
  id: string;
  service_user_id: string;
  challenges: Challenges;
  users: User;
  daily_records: DailyRecords[];
}

export interface Feedbacks {
  id: string;
  ai_feedback?: string;
  coach_feedback?: string | null;
  coach_id?: string;
  coach_memo?: string | null;
  daily_record_id: string;
  updated_at: string;
  created_at: string;
}

export interface Photo {
  id: string;
  url: string;
}

export interface Meal {
  id: string;
  description: string;
  meal_time: string;
  meal_photos?: Photo[];
}

export interface DailyRecords {
  id: string;
  record_date: string;
  feedback: Feedbacks | null;
  meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snack: Meal[];
    supplement: Meal[];
    water: Meal[];
  };
  updated_at: string;
  created_at: string;
}

export interface ProcessedMeal {
  challenge_id: string;
  challenges: Challenges;
  user: {
    id: string;
    username: string;
    name: string;
  };
  daily_records: DailyRecords;
  record_date: string;
}

export interface DietDetailTableProps {
  dietDetailItems: ProcessedMeal[];
  selectedDate: string;
  loading?: boolean;
  onLoadMore?: (page: number) => void;
  hasMore?: boolean;
}

export interface WorkoutTableProps {
  dietDetailItems?: ProcessedMeal[];
  selectedDate?: string;
  loading?: boolean;
  onLoadMore?: (page: number) => void;
  hasMore?: boolean;
}

export interface MobildDieDetailTableProps {
  dietDetailItems: ProcessedMeal[];
  selectedDate: string;
  loading?: boolean;
}
