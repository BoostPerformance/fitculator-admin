interface User {
  id: string;
  name: string;
  username: string;
}

interface Meal {
  id: string;
  meal_type: string;
  description: string;
  updated_at: string;
  meal_time: string;
}

interface Feedback {
  id: string;
  coach_feedback: string;
  ai_feedback: string;
  coach_id: string;
  daily_record_id: string;
  coach_memo?: string;
  updated_at: string;
  created_at: string;
}

interface DailyRecord {
  id: string;
  record_date: string;
  updated_at: string;
  created_at: string;
  meals: Meal[];
  feedbacks: Feedback[];
}

interface ChallengeParticipant {
  id: string;
  service_user_id: string;
  service_user: User;
  daily_records?: DailyRecord[];
  status: string;
}

interface Challenge {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  challenge_participants: ChallengeParticipant[];
}

interface SupabaseUser {
  id: string;
  name: string;
  username: string;
}

interface ChallengeParticipantData {
  id: string;
  service_user_id: string;
  service_user: SupabaseUser;
}

interface SupabaseChallenge {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  challenge_participants: ChallengeParticipantData[];
  users: SupabaseUser[];
}

interface ChallengeCoach {
  challenge_id: string;
  challenges: SupabaseChallenge;
}

interface DailyRecordData {
  id: string;
  record_date: string;
  updated_at: string;
  created_at: string;
  meals: Meal[];
  feedbacks: Feedback[];
}

interface EnrichedParticipant extends ChallengeParticipantData {
  daily_records: DailyRecordData[];
}

interface EnrichedChallengeData extends Omit<ChallengeCoach, "challenges"> {
  challenges: Omit<SupabaseChallenge, "challenge_participants"> & {
    challenge_participants: EnrichedParticipant[];
  };
}

export type {
  User,
  Meal,
  Feedback,
  DailyRecord,
  ChallengeParticipant,
  Challenge,
  ChallengeCoach,
  EnrichedChallengeData,
  SupabaseUser,
  ChallengeParticipantData,
  SupabaseChallenge,
  DailyRecordData,
  EnrichedParticipant,
};
