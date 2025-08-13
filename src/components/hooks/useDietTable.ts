'use client';
import { useQuery } from '@tanstack/react-query';

interface DietTableData {
  data: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetchDietTable = async (
  challengeId: string, 
  page: number = 1, 
  limit: number = 30, 
  date?: string
): Promise<DietTableData> => {
  const today = date || new Date().toISOString().split('T')[0];
  const response = await fetch(
    `/api/diet-table?challengeId=${challengeId}&page=${page}&limit=${limit}&date=${today}`
  );
  if (!response.ok) throw new Error('Failed to fetch diet table data');
  return response.json();
};

export const useDietTable = (
  challengeId: string, 
  page: number = 1, 
  limit: number = 30, 
  date?: string
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['diet-table', challengeId, page, limit, date],
    queryFn: () => fetchDietTable(challengeId, page, limit, date),
    enabled: !!challengeId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { 
    dietTableData: data,
    isLoading,
    error,
    refetch,
  };
};