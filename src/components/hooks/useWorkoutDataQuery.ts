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
  try {
    const response = await fetch(
      `/api/workouts/user-detail?type=weekly-chart&challengeId=${challengeId}`
    );
    if (!response.ok) {
      console.error(`❌ Weekly chart API 오류: ${response.status} ${response.statusText}`);
      throw new Error(`Weekly chart API failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('❌ Weekly chart fetch 실패:', error);
    throw error;
  }
};

const fetchLeaderboard = async (challengeId: string) => {
  try {
    const response = await fetch(
      `/api/workouts/user-detail?type=leaderboard&challengeId=${challengeId}`
    );
    if (!response.ok) {
      console.error(`❌ Leaderboard API 오류: ${response.status} ${response.statusText}`);
      throw new Error(`Leaderboard API failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('❌ Leaderboard fetch 실패:', error);
    throw error;
  }
};

const fetchTodayCount = async (challengeId: string) => {
  try {
    const response = await fetch(
      `/api/workouts/user-detail?type=today-count&challengeId=${challengeId}`
    );
    if (!response.ok) {
      console.error(`❌ Today count API 오류: ${response.status} ${response.statusText}`);
      throw new Error(`Today count API failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('❌ Today count fetch 실패:', error);
    throw error;
  }
};

const fetchBatchUserData = async (userIds: string[], challengeId: string, page: number = 1, limit: number = 10) => {
  if (!userIds.length) return [];
  
  // 페이지네이션을 위해 userIds를 청크로 나눔
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUserIds = userIds.slice(startIndex, endIndex);
  
  if (paginatedUserIds.length === 0) return [];
  
  const response = await fetch(
    `/api/workouts/user-detail?type=batch-user-data&userIds=${paginatedUserIds.join(',')}&challengeId=${challengeId}&page=${page}&limit=${limit}`
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
    retry: (failureCount, error) => {
      console.log(`🔄 Weekly chart 재시도 ${failureCount}회:`, error);
      return failureCount < 2; // 최대 2번 재시도
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });

  // 2. Leaderboard 데이터
  const leaderboardQuery = useQuery({
    queryKey: ['workout', 'leaderboard', challengeId],
    queryFn: () => fetchLeaderboard(challengeId),
    enabled: !!challengeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      console.log(`🔄 Leaderboard 재시도 ${failureCount}회:`, error);
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 3. Today Count 데이터
  const todayCountQuery = useQuery({
    queryKey: ['workout', 'today-count', challengeId],
    queryFn: () => fetchTodayCount(challengeId),
    enabled: !!challengeId,
    staleTime: 1 * 60 * 1000, // 1분 (더 자주 업데이트)
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      console.log(`🔄 Today count 재시도 ${failureCount}회:`, error);
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 4. Batch User Data - 임시로 단일 요청으로 변경 (성능 문제 해결)
  const userIds = weeklyChartQuery.data?.users?.map((user: any) => user.id) || [];
  
  const batchUserDataQuery = useQuery({
    queryKey: ['workout', 'batch-user-data-single', challengeId, userIds.sort().join(',')],
    queryFn: async () => {
      if (!userIds.length) return [];
      const response = await fetch(
        `/api/workouts/user-detail?type=batch-user-data&userIds=${userIds.join(',')}&challengeId=${challengeId}`
      );
      if (!response.ok) throw new Error('Failed to fetch batch user data');
      return response.json();
    },
    enabled: !!challengeId && userIds.length > 0 && userIds.length <= 50, // 50명 이하일 때만
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  
  const batchUserData = batchUserDataQuery.data || [];
  const isBatchUserDataLoading = batchUserDataQuery.isLoading;
  const batchUserDataError = batchUserDataQuery.error;

  // 통합된 로딩 및 에러 상태
  const isLoading = 
    weeklyChartQuery.isLoading || 
    leaderboardQuery.isLoading || 
    todayCountQuery.isLoading ||
    (userIds.length > 0 && isBatchUserDataLoading);

  const error = 
    weeklyChartQuery.error || 
    leaderboardQuery.error || 
    todayCountQuery.error ||
    batchUserDataError;

  // API 연결 상태 확인
  const isApiConnected = !error && (weeklyChartQuery.data || leaderboardQuery.data || todayCountQuery.data);
  const hasAnyData = weeklyChartQuery.data || leaderboardQuery.data || todayCountQuery.data || batchUserData?.length > 0;
  
  // 연결 상태 로깅
  if (error) {
    console.warn('⚠️ API 연결 문제 감지:', error);
  } else if (hasAnyData) {
    console.log('✅ API 연결 정상, 데이터 로드됨');
  }

  return {
    weeklyChart: weeklyChartQuery.data,
    leaderboard: leaderboardQuery.data,
    todayCount: todayCountQuery.data,
    batchUserData,
    isLoading,
    error,
    isApiConnected,
    hasAnyData,
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