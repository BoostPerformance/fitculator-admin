'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

// 타입 정의
export interface RunningDataResponse {
  weeklyChart: any;
  leaderboard: any;
  todayCount: any;
  batchUserData: any;
}

// API 호출 함수들
const fetchWeeklyChart = async (challengeId: string) => {
  try {
    const url = `/api/workouts/user-detail?type=weekly-chart&challengeId=${challengeId}&t=${Date.now()}&r=${Math.random()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Weekly chart API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

const fetchLeaderboard = async (challengeId: string) => {
  try {
    const url = `/api/workouts/user-detail?type=leaderboard&challengeId=${challengeId}&t=${Date.now()}&r=${Math.random()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Leaderboard API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

const fetchTodayCount = async (challengeId: string) => {
  try {
    const url = `/api/workouts/user-detail?type=today-count&challengeId=${challengeId}&t=${Date.now()}&r=${Math.random()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Today count API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// 메인 훅: 모든 러닝 데이터를 한번에 가져옴
export const useRunningDataQuery = (challengeId: string, refreshParam?: string | null) => {
  const queryClient = useQueryClient();

  // 1. Weekly Chart 데이터
  const weeklyChartQuery = useQuery({
    queryKey: ['running', 'weekly-chart', challengeId, refreshParam],
    queryFn: () => fetchWeeklyChart(challengeId),
    enabled: !!challengeId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: false,
    placeholderData: refreshParam ? undefined : (previousData) => previousData,
  });

  // 2. Leaderboard 데이터
  const leaderboardQuery = useQuery({
    queryKey: ['running', 'leaderboard', challengeId, refreshParam],
    queryFn: () => fetchLeaderboard(challengeId),
    enabled: !!challengeId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: false,
    placeholderData: refreshParam ? undefined : (previousData) => previousData,
  });

  // 3. Today Count 데이터
  const todayCountQuery = useQuery({
    queryKey: ['running', 'today-count', challengeId, refreshParam],
    queryFn: () => fetchTodayCount(challengeId),
    enabled: !!challengeId,
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: false,
    placeholderData: refreshParam ? undefined : (previousData) => previousData,
  });

  // 4. Batch User Data
  const userIds = weeklyChartQuery.data?.users?.map((user: any) => user.id) || [];

  const batchUserDataQuery = useQuery({
    queryKey: ['running', 'batch-user-data-single', challengeId, userIds.sort().join(','), refreshParam],
    queryFn: async () => {
      if (!userIds.length) {
        return [];
      }

      const url = `/api/workouts/user-detail?type=batch-user-data&userIds=${userIds.join(',')}&challengeId=${challengeId}&t=${Date.now()}&r=${Math.random()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch batch user data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    },
    enabled: !!challengeId && userIds.length > 0 && userIds.length <= 200,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: false,
    placeholderData: refreshParam ? undefined : (previousData) => previousData,
    retry: 3,
  });

  const batchUserData = batchUserDataQuery.data || [];
  const batchUserDataError = batchUserDataQuery.error;

  // isLoading은 캐시된 데이터가 없을 때만 true
  // 캐시된 데이터가 있으면 즉시 표시하고 백그라운드에서 refetch
  const hasWeeklyData = !!weeklyChartQuery.data;
  const hasLeaderboardData = !!leaderboardQuery.data;
  const hasTodayCountData = !!todayCountQuery.data;
  const hasBatchUserData = batchUserData?.length > 0;

  const isLoading =
    (!hasWeeklyData && weeklyChartQuery.isLoading) ||
    (!hasLeaderboardData && leaderboardQuery.isLoading) ||
    (!hasTodayCountData && todayCountQuery.isLoading) ||
    (userIds.length > 0 && !hasBatchUserData && batchUserDataQuery.isLoading);

  const isFetching =
    weeklyChartQuery.isFetching ||
    leaderboardQuery.isFetching ||
    todayCountQuery.isFetching ||
    (userIds.length > 0 && batchUserDataQuery.isFetching);

  const error =
    weeklyChartQuery.error ||
    leaderboardQuery.error ||
    todayCountQuery.error ||
    batchUserDataError;

  // API 연결 상태 확인
  const isApiConnected = !error && (hasWeeklyData || hasLeaderboardData || hasTodayCountData);
  const hasAnyData = hasWeeklyData || hasLeaderboardData || hasTodayCountData || hasBatchUserData;

  return {
    weeklyChart: weeklyChartQuery.data,
    leaderboard: leaderboardQuery.data,
    todayCount: todayCountQuery.data,
    batchUserData,
    isLoading,
    isFetching,
    error,
    isApiConnected,
    hasAnyData,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: ['running'] });

      await Promise.all([
        weeklyChartQuery.refetch(),
        leaderboardQuery.refetch(),
        todayCountQuery.refetch(),
        batchUserDataQuery.refetch()
      ]);
    }
  };
};

// 개별 사용자 데이터 훅 (특정 사용자 상세 페이지용)
export const useSingleUserRunningQuery = (userId: string, challengeId?: string) => {
  return useQuery({
    queryKey: ['running', 'single-user', userId, challengeId],
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

// 페이지네이션 타입 정의
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// 페이지네이션된 사용자 데이터 가져오기
const fetchPaginatedUserData = async (challengeId: string, page: number, limit: number) => {
  const url = `/api/workouts/user-detail?type=paginated-user-data&challengeId=${challengeId}&page=${page}&limit=${limit}&t=${Date.now()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paginated user data API failed: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// 페이지네이션을 지원하는 러닝 데이터 훅
export const useRunningDataQueryPaginated = (
  challengeId: string,
  page: number = 1,
  limit: number = 30,
  refreshParam?: string | null
) => {
  const queryClient = useQueryClient();

  // 1. Weekly Chart 데이터 (참가자 목록용 - 페이지네이션 없이)
  const weeklyChartQuery = useQuery({
    queryKey: ['running', 'weekly-chart', challengeId, refreshParam],
    queryFn: () => fetchWeeklyChart(challengeId),
    enabled: !!challengeId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // 2. Leaderboard 데이터
  const leaderboardQuery = useQuery({
    queryKey: ['running', 'leaderboard', challengeId, refreshParam],
    queryFn: () => fetchLeaderboard(challengeId),
    enabled: !!challengeId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // 3. Today Count 데이터
  const todayCountQuery = useQuery({
    queryKey: ['running', 'today-count', challengeId, refreshParam],
    queryFn: () => fetchTodayCount(challengeId),
    enabled: !!challengeId,
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // 4. 페이지네이션된 사용자 데이터
  const paginatedUserDataQuery = useQuery({
    queryKey: ['running', 'paginated-user-data', challengeId, page, limit, refreshParam],
    queryFn: () => fetchPaginatedUserData(challengeId, page, limit),
    enabled: !!challengeId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  // isLoading은 캐시된 데이터가 없을 때만 true
  // 캐시된 데이터가 있으면 즉시 표시하고 백그라운드에서 refetch
  const hasWeeklyData = !!weeklyChartQuery.data;
  const hasLeaderboardData = !!leaderboardQuery.data;
  const hasTodayCountData = !!todayCountQuery.data;
  const hasPaginatedData = !!paginatedUserDataQuery.data;

  const isLoading =
    (!hasWeeklyData && weeklyChartQuery.isLoading) ||
    (!hasLeaderboardData && leaderboardQuery.isLoading) ||
    (!hasTodayCountData && todayCountQuery.isLoading) ||
    (!hasPaginatedData && paginatedUserDataQuery.isLoading);

  const isFetching =
    weeklyChartQuery.isFetching ||
    leaderboardQuery.isFetching ||
    todayCountQuery.isFetching ||
    paginatedUserDataQuery.isFetching;

  const error =
    weeklyChartQuery.error ||
    leaderboardQuery.error ||
    todayCountQuery.error ||
    paginatedUserDataQuery.error;

  const isApiConnected = !error && (hasWeeklyData || hasLeaderboardData || hasTodayCountData);
  const hasAnyData = hasWeeklyData || hasLeaderboardData || hasTodayCountData || hasPaginatedData;

  return {
    weeklyChart: weeklyChartQuery.data,
    leaderboard: leaderboardQuery.data,
    todayCount: todayCountQuery.data,
    paginatedUsers: paginatedUserDataQuery.data?.users || [],
    pagination: paginatedUserDataQuery.data?.pagination as PaginationInfo | undefined,
    isLoading,
    isFetching,
    error,
    isApiConnected,
    hasAnyData,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: ['running'] });
      await Promise.all([
        weeklyChartQuery.refetch(),
        leaderboardQuery.refetch(),
        todayCountQuery.refetch(),
        paginatedUserDataQuery.refetch(),
      ]);
    },
  };
};
