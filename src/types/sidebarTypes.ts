export interface Challenge {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

export interface SidebarProps {
  data: Challenge[];
  onSelectChallenge: (challengeId: string) => void;
  coach: string;
  dietDetail?: boolean;
}
