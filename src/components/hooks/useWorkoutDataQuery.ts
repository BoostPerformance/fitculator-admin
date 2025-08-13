'use client';

import { useQuery, useQueries } from '@tanstack/react-query';

// 타입 정의
export interface WorkoutDataResponse {
  weeklyChart: any;
  leaderboard: any;
  todayCount: any;
  batchUserData: any;
}

// API 호출 함수들
const fetchWeeklyChart = async (challengeId: string) => {
  const response = await fetch(
    `/api/workouts/user-detail?type=weekly-chart&challengeId=${challengeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch weekly chart');
  return response.json();
};

const fetchLeaderboard = async (challengeId: string) => {
  const response = await fetch(
    `/api/workouts/user-detail?type=leaderboard&challengeId=${challengeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
};

const fetchTodayCount = async (challengeId: string) => {
  const response = await fetch(
    `/api/workouts/user-detail?type=today-count&challengeId=${challengeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch today count');
  return response.json();
};

const fetchBatchUserData = async (userIds: string[], challengeId: string) => {
  if (!userIds.length) return [];
  
  const response = await fetch(
    `/api/workouts/user-detail?type=batch-user-data&userIds=${userIds.join(',')}&challengeId=${challengeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch batch user data');
  return response.json();
};

// 메인 훅: 모든 운동 데이터를 한번에 가져옴
export const useWorkoutDataQuery = (challengeId: string) => {
  // 1. Weekly Chart 데이터
  const weeklyChartQuery = useQuery({
    queryKey: ['workout', 'weekly-chart', challengeId],
    queryFn: () => fetchWeeklyChart(challengeId),
    enabled: !!challengeId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
  });

  // 2. Leaderboard 데이터
  const leaderboardQuery = useQuery({
    queryKey: ['workout', 'leaderboard', challengeId],
    queryFn: () => fetchLeaderboard(challengeId),
    enabled: !!challengeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 3. Today Count 데이터
  const todayCountQuery = useQuery({
    queryKey: ['workout', 'today-count', challengeId],
    queryFn: () => fetchTodayCount(challengeId),
    enabled: !!challengeId,
    staleTime: 1 * 60 * 1000, // 1분 (더 자주 업데이트)
    gcTime: 5 * 60 * 1000,
  });

  // 4. Batch User Data (weekly chart 데이터가 있을 때만)
  const userIds = weeklyChartQuery.data?.users?.map((user: any) => user.id) || [];
  
  const batchUserDataQuery = useQuery({
    queryKey: ['workout', 'batch-user-data', challengeId, userIds.join(',')],
    queryFn: () => fetchBatchUserData(userIds, challengeId),
    enabled: !!challengeId && userIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 통합된 로딩 및 에러 상태
  const isLoading = 
    weeklyChartQuery.isLoading || 
    leaderboardQuery.isLoading || 
    todayCountQuery.isLoading ||
    (userIds.length > 0 && batchUserDataQuery.isLoading);

  const error = 
    weeklyChartQuery.error || 
    leaderboardQuery.error || 
    todayCountQuery.error ||
    batchUserDataQuery.error;

  return {
    weeklyChart: weeklyChartQuery.data,
    leaderboard: leaderboardQuery.data,
    todayCount: todayCountQuery.data,
    batchUserData: batchUserDataQuery.data,
    isLoading,
    error,
    refetch: () => {
      weeklyChartQuery.refetch();
      leaderboardQuery.refetch();
      todayCountQuery.refetch();
      batchUserDataQuery.refetch();
    }
  };
};

// 개별 사용자 데이터 훅 (특정 사용자 상세 페이지용)
export const useSingleUserWorkoutQuery = (userId: string, challengeId?: string) => {
  return useQuery({
    queryKey: ['workout', 'single-user', userId, challengeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/workouts/user-detail?userId=${userId}${challengeId ? `&challengeId=${challengeId}` : ''}`
      );
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};