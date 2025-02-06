'use client';
import { useState } from 'react';
import { ChallengeParticipant } from '@/types/userPageTypes';

export const useDailyRecords = () => {
  const [dailyRecords, setDailyRecords] = useState<ChallengeParticipant[]>([]);

  const fetchDailyRecords = async () => {
    try {
      const response = await fetch('/api/challenge-participants');
      if (!response.ok) throw new Error('Failed to fetch daily-records data');
      const data = await response.json();
      setDailyRecords(data);
      return data;
    } catch (error) {
      console.error('Error fetching daily records:', error);
    }
  };

  return { dailyRecords, setDailyRecords, fetchDailyRecords };
};
