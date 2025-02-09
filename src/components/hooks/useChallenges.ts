'use client';
import { useState } from 'react';
// import { Challenges } from '@/types/userPageTypes';

interface Challenges {
  challenge_id: string;
  challenges: {
    end_date: string;
    id: string;
    start_date: string;
    title: string;
    challenge_participants: {
      daily_records: {
        feedbacks: {
          id: string;
          coach_id: string;
          coach_memo?: string;
          updated_at: string;
          ai_feedback: string;
        };
        id: string;
        meals: {
          description: string;
          id: string;
          meal_type: string;
          updated_at: string;
        }[];
        record_date: string;
        updated_at: string;
      }[];
      id: string;
      service_user_id: string;
      users: {
        id: string;
        name: string;
        display_name: string;
      };
    }[];
  };
  coach_id: string;
  created_at: string;
  id: string;
}
export const useChallenge = () => {
  const [challenges, setChallenges] = useState<Challenges[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challengeTitle, setChallengeTitle] = useState('');

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges');
      if (!response.ok) throw new Error('Failed to fetch challenges');

      const data = await response.json();
      setChallenges(data);
      return data;
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const handleChallengeSelect = (challengeId: string) => {
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );
    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
      setChallengeTitle(selectedChallenge.challenges.title);
    }
  };

  return {
    challenges,
    selectedChallengeId,
    challengeTitle,
    fetchChallenges,
    handleChallengeSelect,
  };
};
