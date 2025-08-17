export interface ChallengeMission {
  id: string;
  challenge_id: string;
  title: string;
  description?: string;
  mission_type: 'workout' | 'diet' | 'custom';
  start_date: string;
  end_date: string;
  sort_order: number;
  requires_verification: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MissionCompletion {
  id: string;
  mission_id: string;
  user_id: string;
  workout_id?: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  proof_images?: string[];
  proof_note?: string;
  completed_at: string;
  created_at: string;
}

export interface MissionWithCompletions extends ChallengeMission {
  completions?: MissionCompletion[];
}

export interface UserMissionStatus {
  user_id: string;
  user_name: string;
  missions: {
    mission: ChallengeMission;
    completion?: MissionCompletion;
  }[];
  total_missions: number;
  completed_missions: number;
  completion_rate: number;
}

export interface WorkoutForMapping {
  id: string;
  user_id: string;
  start_time: string;
  title: string;
  note?: string;
}