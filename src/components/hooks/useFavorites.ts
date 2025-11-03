import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'favorite-challenges';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // localStorage에서 즐겨찾기 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setFavorites(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // 즐겨찾기 추가/제거 토글
  const toggleFavorite = useCallback((challengeId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(challengeId)
        ? prev.filter((id) => id !== challengeId)
        : [...prev, challengeId];

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }

      return updated;
    });
  }, []);

  // 즐겨찾기 여부 확인
  const isFavorite = useCallback(
    (challengeId: string) => favorites.includes(challengeId),
    [favorites]
  );

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
};
