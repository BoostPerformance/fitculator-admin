'use client';

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';

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
 const url = `/api/workouts/user-detail?type=weekly-chart&challengeId=${challengeId}&t=${Date.now()}&r=${Math.random()}`;
// console.log('🔗 Weekly chart API 호출:', url);
 
 const response = await fetch(url, {
 method: 'GET',
 headers: {
 'Content-Type': 'application/json',
 'Cache-Control': 'no-cache, no-store, must-revalidate',
 'Pragma': 'no-cache',
 },
 cache: 'no-store', // 캐싱 비활성화
 });
 
// console.log('📡 Weekly chart 응답 상태:', response.status, response.statusText);
// console.log('🌍 현재 환경:', process.env.NODE_ENV);
// console.log('🔗 요청 URL:', response.url);
 
 if (!response.ok) {
 const errorText = await response.text();
// console.error(`❌ Weekly chart API 오류:`, {
 // status: response.status,
 // statusText: response.statusText,
 // url: response.url,
 // error: errorText
 // });
 throw new Error(`Weekly chart API failed: ${response.status} - ${errorText}`);
 }
 
 const data = await response.json();
// console.log('✅ Weekly chart 데이터 수신:', !!data, Object.keys(data || {}));
 return data;
 } catch (error) {
// console.error('❌ Weekly chart fetch 실패:', {
 // error: error.message,
 // challengeId,
 // environment: process.env.NODE_ENV
 // });
 throw error;
 }
};

const fetchLeaderboard = async (challengeId: string) => {
 try {
 const url = `/api/workouts/user-detail?type=leaderboard&challengeId=${challengeId}&t=${Date.now()}&r=${Math.random()}`;
// console.log('🔗 Leaderboard API 호출:', url);
 
 const response = await fetch(url, {
 method: 'GET',
 headers: {
 'Content-Type': 'application/json',
 'Cache-Control': 'no-cache, no-store, must-revalidate',
 'Pragma': 'no-cache',
 },
 cache: 'no-store', // 캐싱 비활성화
 });
 
// console.log('📡 Leaderboard 응답 상태:', response.status, response.statusText);
 
 if (!response.ok) {
 const errorText = await response.text();
// console.error(`❌ Leaderboard API 오류:`, {
 // status: response.status,
 // statusText: response.statusText,
 // url: response.url,
 // error: errorText
 // });
 throw new Error(`Leaderboard API failed: ${response.status} - ${errorText}`);
 }
 
 const data = await response.json();
// console.log('✅ Leaderboard 데이터 수신:', !!data, Object.keys(data || {}));
 return data;
 } catch (error) {
// console.error('❌ Leaderboard fetch 실패:', {
 // error: error.message,
 // challengeId,
 // environment: process.env.NODE_ENV
 // });
 throw error;
 }
};

const fetchTodayCount = async (challengeId: string) => {
 try {
 const url = `/api/workouts/user-detail?type=today-count&challengeId=${challengeId}&t=${Date.now()}&r=${Math.random()}`;
// console.log('🔗 Today count API 호출:', url);
 
 const response = await fetch(url, {
 method: 'GET',
 headers: {
 'Content-Type': 'application/json',
 'Cache-Control': 'no-cache, no-store, must-revalidate',
 'Pragma': 'no-cache',
 },
 cache: 'no-store', // 캐싱 비활성화
 });
 
// console.log('📡 Today count 응답 상태:', response.status, response.statusText);
 
 if (!response.ok) {
 const errorText = await response.text();
// console.error(`❌ Today count API 오류:`, {
 // status: response.status,
 // statusText: response.statusText,
 // url: response.url,
 // error: errorText
 // });
 throw new Error(`Today count API failed: ${response.status} - ${errorText}`);
 }
 
 const data = await response.json();
// console.log('✅ Today count 데이터 수신:', !!data, Object.keys(data || {}));
 return data;
 } catch (error) {
// console.error('❌ Today count fetch 실패:', {
 // error: error.message,
 // challengeId,
 // environment: process.env.NODE_ENV
 // });
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
export const useWorkoutDataQuery = (challengeId: string, refreshParam?: string | null) => {
 const queryClient = useQueryClient();
 // 1. Weekly Chart 데이터
 const weeklyChartQuery = useQuery({
 queryKey: ['workout', 'weekly-chart', challengeId, refreshParam],
 queryFn: () => fetchWeeklyChart(challengeId),
 enabled: !!challengeId,
 staleTime: 30 * 1000, // 30초간 fresh 상태 유지
 gcTime: 10 * 60 * 1000, // 10분간 캐시 보관
 retry: (failureCount, error) => {
// console.log(`🔄 Weekly chart 재시도 ${failureCount}회:`, error);
 return failureCount < 3;
 },
 retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
 refetchOnMount: 'always', // 마운트시 백그라운드에서 새 데이터 가져오기
 refetchOnWindowFocus: false, 
 refetchInterval: false,
 placeholderData: refreshParam ? undefined : (previousData) => previousData, // refresh시에는 placeholder 없음
 });

 // 2. Leaderboard 데이터
 const leaderboardQuery = useQuery({
 queryKey: ['workout', 'leaderboard', challengeId, refreshParam],
 queryFn: () => fetchLeaderboard(challengeId),
 enabled: !!challengeId,
 staleTime: 30 * 1000, // 30초간 fresh 상태 유지
 gcTime: 10 * 60 * 1000, // 10분간 캐시 보관
 retry: (failureCount, error) => {
// console.log(`🔄 Leaderboard 재시도 ${failureCount}회:`, error);
 return failureCount < 3;
 },
 retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
 refetchOnMount: 'always', // 마운트시 백그라운드에서 새 데이터 가져오기
 refetchOnWindowFocus: false,
 refetchInterval: false,
 placeholderData: refreshParam ? undefined : (previousData) => previousData, // refresh시에는 placeholder 없음
 });

 // 3. Today Count 데이터
 const todayCountQuery = useQuery({
 queryKey: ['workout', 'today-count', challengeId, refreshParam],
 queryFn: () => fetchTodayCount(challengeId),
 enabled: !!challengeId,
 staleTime: 15 * 1000, // 15초간 fresh (오늘 운동 수는 자주 바뀜)
 gcTime: 10 * 60 * 1000, // 10분간 캐시 보관
 retry: (failureCount, error) => {
// console.log(`🔄 Today count 재시도 ${failureCount}회:`, error);
 return failureCount < 3;
 },
 retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
 refetchOnMount: 'always', // 마운트시 백그라운드에서 새 데이터 가져오기
 refetchOnWindowFocus: false,
 refetchInterval: false,
 placeholderData: refreshParam ? undefined : (previousData) => previousData, // refresh시에는 placeholder 없음
 });

 // 4. Batch User Data - 임시로 단일 요청으로 변경 (성능 문제 해결)
 const userIds = weeklyChartQuery.data?.users?.map((user: any) => user.id) || [];
 
 const batchUserDataQuery = useQuery({
 queryKey: ['workout', 'batch-user-data-single', challengeId, userIds.sort().join(','), refreshParam],
 queryFn: async () => {
 if (!userIds.length) {
// console.log('🚫 Batch user data: userIds가 비어있음');
 return [];
 }
 
 const url = `/api/workouts/user-detail?type=batch-user-data&userIds=${userIds.join(',')}&challengeId=${challengeId}&t=${Date.now()}&r=${Math.random()}`;
// console.log('🔗 Batch user data API 호출:', url, `(${userIds.length}명)`);
 
 const response = await fetch(url, {
 method: 'GET',
 headers: {
 'Content-Type': 'application/json',
 'Cache-Control': 'no-cache, no-store, must-revalidate',
 'Pragma': 'no-cache',
 },
 cache: 'no-store', // 캐싱 비활성화
 });
 
// console.log('📡 Batch user data 응답 상태:', response.status, response.statusText);
 
 if (!response.ok) {
 const errorText = await response.text();
// console.error('❌ Batch user data API 오류:', {
 // status: response.status,
 // statusText: response.statusText,
 // url: response.url,
 // error: errorText
 // });
 throw new Error(`Failed to fetch batch user data: ${response.status} - ${errorText}`);
 }
 
 const data = await response.json();
// console.log('✅ Batch user data 수신:', Array.isArray(data) ? data.length : 'Invalid data', '개 사용자');
 return data;
 },
 enabled: !!challengeId && userIds.length > 0 && userIds.length <= 200, // 200명까지 허용
 staleTime: 60 * 1000, // 1분간 fresh (사용자 데이터는 덜 자주 바뀜)
 gcTime: 10 * 60 * 1000, // 10분간 캐시 보관
 refetchOnMount: 'always', // 마운트시 백그라운드에서 새 데이터 가져오기
 refetchOnWindowFocus: false,
 refetchInterval: false,
 placeholderData: refreshParam ? undefined : (previousData) => previousData, // refresh시에는 placeholder 없음
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
 
 // 연결 상태 로깅 - Production 환경에서 더 상세히
 if (error) {
// console.error('⚠️ API 연결 문제 감지:', {
 // error: error.message,
 // challengeId,
 // environment: process.env.NODE_ENV,
 // queries: {
 // weeklyChart: weeklyChartQuery.status,
 // leaderboard: leaderboardQuery.status,
 // todayCount: todayCountQuery.status,
 // batchUserData: batchUserDataQuery.status,
 // }
 // });
 } else if (hasAnyData) {
// console.log('✅ API 연결 정상, 데이터 로드됨:', {
 // challengeId,
 // environment: process.env.NODE_ENV,
 // data: {
 // weeklyChart: !!weeklyChartQuery.data,
 // leaderboard: !!leaderboardQuery.data,
 // todayCount: !!todayCountQuery.data,
 // batchUserData: batchUserData?.length || 0,
 // }
 // });
 } else if (!isLoading) {
// console.warn('⚠️ 로딩 완료되었지만 데이터가 없음:', {
 // challengeId,
 // environment: process.env.NODE_ENV,
 // isLoading,
 // hasAnyData,
 // queries: {
 // weeklyChart: weeklyChartQuery.status,
 // leaderboard: leaderboardQuery.status,
 // todayCount: todayCountQuery.status,
 // batchUserData: batchUserDataQuery.status,
 // }
 // });
 }

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
 // 캐시를 완전히 무효화하고 강제로 새 데이터 가져오기
 await queryClient.invalidateQueries({ queryKey: ['workout'] });
 
 // 그 다음 refetch
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