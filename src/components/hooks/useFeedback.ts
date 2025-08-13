import { useState } from 'react';

interface FeedbackData {
  daily_record_id: string;
  coach_feedback: string;
}

interface FeedbackWithChallengeId extends FeedbackData {
  challenge_id: string;
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

      //console.log('coachFeedback response', response);

      if (!response.ok) {
        throw new Error('Failed to save feedback at useFeedback ');
      }

      const result = await response.json();
      //  console.log('저장된 피드백 데이터:', result);
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save feedback SetError'
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedback = async (dailyRecordId: string): Promise<FeedbackWithChallengeId | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/coach-feedback?daily_record_id=${dailyRecordId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch feedback'
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveFeedback,
    getFeedback,
    isLoading,
    error,
  };
};
