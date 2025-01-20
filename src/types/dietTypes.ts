export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  description: string;
  updated_at: string;
  image_url_1: string;
  image_url_2: string;
  image_url_3: string;
  image_url_4: string;
}

export interface User {
  id: string;
  name: string;
}

export interface Feedback {
  user_id: string;
  date: string;
  ai_feedback_text?: string;
  feedback_text?: string;
}

export interface TableTitleData {
  id: string;
  name: string;
  discordId?: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  date: string;
  updateTime: string;
  aiFeedbackText: string;
  coachFeedbackText: string;
  feedback: Feedback | null;
}

// export interface CombinedData extends Meal {
//   id: string;
//   name: string;
//   discordId?: string;
//   breakfast: string;
//   lunch: string;
//   dinner: string;
//   snack: string;
//   date: string;
//   updateTime: string;
//   aiFeedbackText: string;
//   coachFeedbackText: string;
//   feedback: Feedback | null;
// }
export interface CombinedData {
  nickname: string;
  name: string;
  meals: number[];
  exercise_point: string; // 운동포인트
  exercise_weight: number;
  coach_memo: string | null; // 코치미팅
  feedback_counts: string;
}

export interface GroupedMeals {
  user_id: string;
  name: string | null;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snack: string | null;
  updateTime: string;
  date: string;
}

export interface Member {
  nickname: string;
  name: string;
  meals: number[];
  exercise_point: string; // 운동포인트
  exercise_weight: number;
  coach_memo: string | null; // 코치미팅
  feedback_counts: string;
}

export type DietTableMockDataType = Member[];
