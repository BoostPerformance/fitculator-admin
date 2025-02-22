interface ChallengeParticipant {
  id: string;
  status: string;
}

interface Challenge {
  id: string;
  title: string;
  participants: ChallengeParticipant[];
}

interface ChallengeCoachData {
  challenge: Challenge;
}

interface CoachData {
  id: string;
  admin_user_id: string;
  organization_id: string;
  organization_name: string;
  username: string;
  profile_image_url: string | null;
  challenges: Array<{
    id: string;
    title: string;
    participants: ChallengeParticipant[];
  }>;
}

interface AdminUser {
  id: string;
  admin_role: string;
  organization_id: string;
  username: string;
}

interface Organization {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  admin_user_id: string;
  organization_id: string;
  profile_image_url: string | null;
  admin_users: {
    username: string;
    email: string;
    organization: Organization;
  };
  challenge_coaches: ChallengeCoachData[];
}

export type {
  ChallengeParticipant,
  Challenge,
  ChallengeCoachData,
  CoachData,
  AdminUser,
  Organization,
  Coach
};
