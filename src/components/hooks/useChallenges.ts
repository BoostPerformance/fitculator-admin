'use client';
import { useState } from 'react';
import { Challenges } from '@/types/userPageTypes';

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
