export interface PhotoData {
  id: string;
  meal_id: string;
  photo_url: string;
  created_at: string;
}
export interface MealItem {
  description: string;
  meal_photos: PhotoData[];
  updatedAt: string;
  meal_time: string;
}

export interface DailyMealData {
  recordDate: string;
  meals: {
    breakfast: MealItem[];
    lunch: MealItem[];
    dinner: MealItem[];
    snack: MealItem[];
    supplement: MealItem[];
    water: MealItem[];
    [key: string]: MealItem[]; // 추가적인 식사 유형을 위한 인덱스 시그니처
  };
  feedbacks: {
    coach_feedback?: string;
    ai_feedback: string;
  };
  user?: {
    id: string;
    name: string;
    username: string;
  };
  upload_days_count?: number;
}

export interface DailyRecords {
  id: string;
  feedbacks: {
    coach_feedback: string;
    ai_feedback?: string;
  };
  record_date: string;
}

export interface UserData {
  challenge: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
  daily_records: DailyRecords[];
  id: string;
  users: {
    username: string;
    id: string;
    name: string;
  };
}

export interface Meals {
  id: string;
  daily_record_id: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'WATER';
  description: string;
  meal_photos: [string];
  updated_at: string;
  meal_time: string;
  daily_records: {
    id: string;
    description: string;
    updated_at: string;
    record_date: string;
    participant_id: string;
    challenge_participants: {
      challenges: {
        end_date: string;
        id: string;
        start_date: string;
        title: string;
      };
      users: { id: string; name: string; username: string };
    };
    feedbacks: {
      ai_feedback: string;
      coach_feedback: string;
      coach_id: string;
      coach_memo: string;
      created_at: string;
      daily_record_id: string;
      id: string;
      updated_at: string;
    };
  };
}
