export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'supplement';

export interface User {
  id: string;
  name: string;
  display_name: string;
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
  coach_feedback?: string;
  coach_id: string;
  coach_memo?: string;
  daily_record_id: string;
  updated_at: string;
}

export interface DailyRecords {
  id: string;
  record_date: string;
  meals: Meals[];
  feedbacks: Feedbacks;
  updated_at: string;
}

export interface Meals {
  id: string;
  updated_at: string;
  description: string;
  meal_type: MealType;
}

export interface ProcessedMeal {
  challenge_id: string;
  challenges: Challenges;
  user: {
    id: string;
    display_name: string;
    name: string;
  };
  daily_record: DailyRecords;
  meals: Record<MealType, string>;
  record_date: string;
}

export interface DietDetailTableProps {
  dietDetailItems: ProcessedMeal[];
  selectedDate: string;
}

export interface MobildDieDetailTableProps {
  dietDetailItems: ProcessedMeal[];
  selectedDate: string;
}
