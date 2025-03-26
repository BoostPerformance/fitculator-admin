export interface AdminUser {
  email: string;
  username: string;
}

export interface Challenge {
  id: string;
  title: string;
  participants: ChallengeParticipant[];
}

export interface CoachData {
  id: string;
  admin_user_id: string;
  organization_id: string;
  profile_image_url: string | null;
  introduction: string;
  specialization: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admin_users: AdminUser;
  challenge_coaches: Array<{ challenge: Challenge }>;
}

export interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

export interface Meal {
  description: string;
  id: string;
  meal_type: string;
  updated_at: string;
}

export interface DailyRecord {
  id: string;
  record_date: string;
  meals?: Meal[];
  feedbacks?: {
    coach_feedback: string;
    created_at: string;
    coach_memo?: string;
    id: string;
  };
}

export interface ChallengeParticipant {
  id: string;
  users: {
    id: string;
    username: string | null;
    name: string;
    email: string;
  };
  challenges: {
    id: string;
    title: string;
    challenge_type: string;
    start_date: string;
    end_date: string;
  };
  daily_records?: Array<DailyRecord>;
  daily_records_count?: number;
  feedbacks_count?: number;
  coach_memo: string | null;
  memo_updated_at: string | null;
  service_user_id: string;
}

export interface DietTableProps {
  dailyRecordsData: ChallengeParticipant[];
  loading?: boolean;
  challengeId: string;
  selectedDate?: string;
  onLoadMore?: (page: number) => void;
  feedbackData: any;
}
