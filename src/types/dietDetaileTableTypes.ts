export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'supplement';

export interface User {
  name: string;
  display_name: string;
}

export interface Challenges {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

export interface ChallengeParticipant {
  challenges: Challenges;
  users: User;
}

export interface Feedback {
  id: string;
  ai_feedback?: string;
  coach_feedback?: string;
  coach_id: string;
  coach_memo?: string;
  daily_record_id: string;
  updated_at: string;
}

export interface DailyRecord {
  id: string;
  participant_id: string;
  updated_at: string;
  challenge_participants: ChallengeParticipant;
  feedbacks: Feedback;
}

export interface MealData {
  updated_at: string;
  daily_record_id: string;
  daily_records: DailyRecord;
  description: string;
  meal_type: MealType;
}

export interface ProcessedMeal {
  user: {
    display_name: string;
    name: string;
  };
  daily_record: DailyRecord;
  meals: Record<MealType, string>;
  updated_at: string;
}

export interface DietDetailTableProps {
  dietDetailItems: ProcessedMeal[];
}
