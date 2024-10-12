export interface Meal {
  meal_id: string;
  user_id: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  date: string; // YYYY-MM-DD 형식
  image_url_1?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  image_url_4?: string | null;
  description: string;
  created_at: string; // ISO 8601 형식: YYYY-MM-DDTHH:MM:SS
  updated_at: string; // ISO 8601 형식: YYYY-MM-DDTHH:MM:SS
}

// Coaches 테이블 타입 정의
export interface Coach {
  coach_id: string;
  name: string;
  email: string;
  specialization?: string; // 선택 사항
  created_at: string; // ISO 8601 형식
  updated_at: string; // ISO 8601 형식
}

// AI_Feedback 테이블 타입 정의
export interface AIFeedback {
  feedback_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD 형식
  ai_feedback_text: string;
  created_at: string; // ISO 8601 형식
}

// Diet_Feedback 테이블 타입 정의
export interface DietFeedback {
  feedback_id: string;
  user_id: string;
  coach_id: string;
  date: string; // YYYY-MM-DD 형식
  feedback_text: string;
  nutritional_analysis: string;
  meal_balance_score: number;
  suggested_improvements: string;
  created_at: string; // ISO 8601 형식
  updated_at: string; // ISO 8601 형식
}
