'use client';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

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
        username: string;
      };
    }[];
  };
  coach_id: string;
  created_at: string;
  id: string;
}

const fetchChallengesApi = async (): Promise<Challenges[]> => {
  const response = await fetch('/api/challenges');
  if (!response.ok) throw new Error('Failed to fetch challenges');
  return response.json();
};

export function useChallenge() {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challengeTitle, setChallengeTitle] = useState('');

  const { data: challenges, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallengesApi,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const handleChallengeSelect = useCallback((challengeId: string) => {
    if (!challenges) return;

    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );
    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
      setChallengeTitle(selectedChallenge.challenges.title);
    }
  }, [challenges]);

  const fetchChallenges = useCallback(async () => {
    const result = await refetch();
    return result.data;
  }, [refetch]);

  return {
    challenges,
    selectedChallengeId,
    challengeTitle,
    fetchChallenges,
    handleChallengeSelect,
    loading,
    error,
  };
}
