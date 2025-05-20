// created_at, updated_at, date 는 ISO 8601 형식: YYYY-MM-DDTHH:MM:SS

export interface Meal {
  meal_id: string;
  user_id: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'WATER';
  date: string;
  image_url_1?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  image_url_4?: string | null;
  description: string;
  additional_comments: string;
  created_at: string;
  updated_at: string;
}

// Coaches 테이블 타입 정의
export interface Coach {
  coach_id: string;
  name: string;
  email: string;
  specialization?: string;
  created_at: string;
  updated_at: string;
}

// AI_Feedback 테이블 타입 정의
export interface AIFeedback {
  feedback_id: string;
  user_id: string;
  date: string;
  ai_feedback_text: string;
  created_at: string;
}

// Diet_Feedback 테이블 타입 정의
export interface DietFeedback {
  feedback_id: string;
  user_id: string;
  coach_id: string;
  date: string;
  feedback_text: string;
  nutritional_analysis: string;

  meal_balance_score: number;
  suggested_improvements: string;
  created_at: string;
  updated_at: string;
}
