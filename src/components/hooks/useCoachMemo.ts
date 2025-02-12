import { useState } from 'react';

interface CoachMemoData {
  participant_id: string;
  challenge_id: string;
  coach_memo: string;
  serviceUserId: string;
}

export const useCoachMemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCoachMemo = async (data: CoachMemoData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coach-memo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save coach memo');
      }

      const result = await response.json();
      console.log('coach-memo result:', result);

      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save coach memo'
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveCoachMemo,
    isLoading,
    error,
  };
};
