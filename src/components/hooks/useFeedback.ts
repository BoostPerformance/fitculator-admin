// hooks/useFeedback.ts
import { useState } from 'react';

interface FeedbackData {
  daily_record_id: string;
  coach_feedback: string;
}

export const useFeedback = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveFeedback = async (data: FeedbackData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coach-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('coachFeedback!! response', response);
      if (!response.ok) {
        throw new Error('Failed to save feedback');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feedback');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveFeedback,
    isLoading,
    error,
  };
};
