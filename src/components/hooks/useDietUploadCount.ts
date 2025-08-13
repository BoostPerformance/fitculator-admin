'use client';
import { useQuery } from '@tanstack/react-query';

interface DietUploadCountData {
  count: number;
  total: number;
  counts?: string;
}

const fetchDietUploadCount = async (challengeId: string, date?: string): Promise<DietUploadCountData> => {
  const today = date || new Date().toISOString().split('T')[0];
  const response = await fetch(`/api/diet-upload-count?challengeId=${challengeId}&date=${today}`);
  if (!response.ok) throw new Error('Failed to fetch diet upload count');
  return response.json();
};

export const useDietUploadCount = (challengeId: string, date?: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['diet-upload-count', challengeId, date],
    queryFn: () => fetchDietUploadCount(challengeId, date),
    enabled: !!challengeId,
    staleTime: 2 * 60 * 1000, // 2분 (식단 업로드는 실시간성이 중요)
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { 
    dietUploadCount: data,
    isLoading,
    error,
    refetch,
  };
};