export interface AdminUser {
  email: string;
  display_name: string;
}

export interface Challenge {
  id: string;
  title: string;
  participants: Array<any>;
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
  challenge_id: string;
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

export interface DailyRecord extends Challenges {
  id: string;
  record_date: string;
  feedbacks: {
    coach_feedback: string;
    created_at: string;
    coach_memo: string;
    id: string;
  }[];
}

export interface ChallengeParticipant {
  id: string;
  users: {
    id: string;
    name: string;
    display_name: string;
  };
  challenges: {
    id: string;
    title: string;
    end_date: string;
    start_date: string;
    challenge_type: string;
  };
  daily_records: DailyRecord[];
}

export interface DietTableProps {
  dailyRecordsData: ChallengeParticipant[];
  coachMemo?: string;
}
