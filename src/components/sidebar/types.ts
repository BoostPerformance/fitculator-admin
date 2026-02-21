export interface ChallengeData {
 challenges: {
 id: string;
 title: string;
 start_date: string;
 end_date: string;
 challenge_type: 'diet' | 'exercise' | 'diet_and_exercise' | 'running';
 enable_benchmark?: boolean;
 enable_mission?: boolean;
 use_daily_programs?: boolean;
 };
}

export interface SidebarProps {
 data: ChallengeData[];
 onSelectChallenge: (challengeId: string) => void;
 onSelectChallengeTitle?: (challengeId: string) => void;
 coach?: string;
 selectedChallengeId?: string;
 username?: string;
}
