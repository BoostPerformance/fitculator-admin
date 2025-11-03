import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'recent-challenges';
const MAX_RECENT = 3; // 최대 3개까지 저장

export const useRecentChallenges = () => {
  const [recentChallenges, setRecentChallenges] = useState<string[]>([]);

  // localStorage에서 최근 챌린지 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setRecentChallenges(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load recent challenges:', error);
      }
    }
  }, []);

  // 챌린지 방문 기록 추가
  const addRecentChallenge = useCallback((challengeId: string) => {
    setRecentChallenges((prev) => {
      // 중복 제거
      const filtered = prev.filter((id) => id !== challengeId);
      // 새로운 챌린지를 맨 앞에 추가
      const updated = [challengeId, ...filtered].slice(0, MAX_RECENT);

      // localStorage에 저장
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent challenges:', error);
      }

      return updated;
    });
  }, []);

  // 최근 챌린지 삭제
  const removeRecentChallenge = useCallback((challengeId: string) => {
    setRecentChallenges((prev) => {
      const updated = prev.filter((id) => id !== challengeId);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent challenges:', error);
      }

      return updated;
    });
  }, []);

  return {
    recentChallenges,
    addRecentChallenge,
    removeRecentChallenge,
  };
};
