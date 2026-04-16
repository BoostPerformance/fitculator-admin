'use client';
import { useState, useEffect } from 'react';
import { WorkoutPageSkeleton } from '@/components/layout/skeleton';
import { useParams, useSearchParams } from 'next/navigation';
import { useWorkoutDataQuery } from '@/components/hooks/useWorkoutDataQuery';
import { useResponsive } from '@/components/hooks/useResponsive';
import { useChallengeContext } from '@/contexts/ChallengeContext';
import Title from '@/components/layout/title';
import { IoRefresh } from 'react-icons/io5';
import WorkoutTable from '@/components/workoutDashboard/workoutTable';
import { ExcerciseStatistics } from '@/components/statistics/excerciseStatistics';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function WorkoutPage() {
 const params = useParams();
 const searchParams = useSearchParams();
 const urlDate = searchParams.get('date');
 const refreshParam = searchParams.get('refresh');
 const today = new Date().toISOString().split('T')[0];
 const queryClient = useQueryClient();

 const [selectedDate, setSelectedDate] = useState<string>(urlDate || today);
 const {
 weeklyChart,
 leaderboard,
 todayCount,
 batchUserData,
 isLoading: workoutLoading,
 isFetching: workoutFetching,
 error: workoutError,
 hasAnyData,
 isApiConnected,
 refetch
 } = useWorkoutDataQuery(params.challengeId as string, refreshParam);
 
 // 디버깅을 위한 로그
 useEffect(() => {
// console.log('🔍 Workout 페이지 데이터 상태:', {
 // challengeId: params.challengeId,
 // workoutLoading,
 // hasAnyData,
 // isApiConnected,
 // weeklyChart: !!weeklyChart,
 // leaderboard: !!leaderboard,
 // todayCount: !!todayCount,
 // batchUserData: batchUserData?.length || 0,
 // workoutError: workoutError?.message
 // });
 }, [params.challengeId, workoutLoading, hasAnyData, isApiConnected, weeklyChart, leaderboard, todayCount, batchUserData, workoutError]);
 
 const { isMobile } = useResponsive();
 const {
 challenges,
 selectedChallengeId: currentChallengeId,
 fetchChallenges,
 loading: challengesLoading,
 } = useChallengeContext();
 const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
 const [challengeError, setChallengeError] = useState<string | null>(null);
 const [isRefreshing, setIsRefreshing] = useState(false);
 // API 연결 상태 체크 제거

 const handleSelectChallenge = (challengeId: string) => {
 setSelectedChallengeId(challengeId);
 };

 useEffect(() => {
 // refreshParam이 query key에 포함되므로 별도의 캐시 제거 불필요
 // 페이지 새로고림 시에만 전체 캐시 제거
 if (typeof window !== 'undefined') {
 const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
 if (navigation.type === 'reload') {
 // 새로고침으로 접근한 경우 모든 workout 관련 캐시 제거
 queryClient.removeQueries({ queryKey: ['workout'] });
 }
 }
 
 // Challenge 데이터는 Context에서 자동으로 로드됨
 }, [queryClient]);

 // API 연결 테스트 제거 - 불필요한 경고 메시지 방지

 const handleRefresh = async () => {
 setIsRefreshing(true);
 try {
 await refetch();
 } finally {
 setTimeout(() => setIsRefreshing(false), 500);
 }
 };

 useEffect(() => {
 if (urlDate) {
 setSelectedDate(urlDate);
 const row = document.querySelector(`[data-date="${urlDate}"]`);
 if (row) {
 row.scrollIntoView({ behavior: 'smooth', block: 'center' });
 row.classList.add('bg-yellow-50');
 setTimeout(() => row.classList.remove('bg-yellow-50'), 3000);
 }
 }
 }, [urlDate]);

 if (challengeError) {
 return <div className="p-4 text-red-500">{challengeError}</div>;
 }

 if (challengesLoading) {
 return <WorkoutPageSkeleton />;
 }

 if (!challenges) {
 return <div className="p-4">챌린지 정보가 없습니다.</div>;
 }

 const currentChallenge = challenges?.find((c) => c.challenges.id === params.challengeId);
 
 return (
 <div className="flex-1 p-4 sm:p-0">
 <div className="px-6 pt-6 sm:px-4 sm:pt-4">
 {/* 챌린지 기간 표시 */}
 {currentChallenge && (
 <div className="text-body text-content-tertiary mb-2">
 {new Date(currentChallenge.challenges.start_date).toLocaleDateString('ko-KR', {
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 })} - {new Date(currentChallenge.challenges.end_date).toLocaleDateString('ko-KR', {
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 })}
 </div>
 )}
 <div className="text-content-tertiary text-headline font-bold">
 {currentChallenge?.challenges.title || ''}
 </div>
 <div className="flex items-center justify-between">
 <Title title="운동 현황" />
 <button
 onClick={handleRefresh}
 disabled={isRefreshing || workoutFetching}
 className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-content-secondary bg-surface border border-line rounded-lg hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 aria-label="데이터 새로고침"
 >
 <IoRefresh 
 className={`h-4 w-4 ${(isRefreshing || workoutFetching) ? 'animate-spin' : ''}`} 
 />
 {(isRefreshing || workoutFetching) ? '업데이트 중...' : '새로고침'}
 </button>
 </div>
 </div>
 {workoutError && (
 <div className="p-4 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg mx-4">
 <h4 className="font-semibold mb-2">운동 데이터 로드 오류</h4>
 <p>오류 내용: {workoutError.message}</p>
 <p className="text-sm mt-1">Challenge ID: {params.challengeId}</p>
 </div>
 )}
 
 {!workoutLoading && !hasAnyData && !workoutError && (
 <div className="p-4 text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mx-4">
 <h4 className="font-semibold mb-2">데이터 없음</h4>
 <p>현재 챌린지에 대한 운동 데이터가 없습니다.</p>
 <p className="text-sm mt-1">API 연결 상태: {isApiConnected ? '연결됨' : '연결 안됨'}</p>
 </div>
 )}
 <div className="mt-6">
 <ExcerciseStatistics
 processedMeals={[]}
 selectedChallengeId={params.challengeId as string}
 selectedDate={selectedDate}
 weeklyChart={weeklyChart}
 todayCount={todayCount}
 isLoading={workoutFetching} // 백그라운드 업데이트 상태 사용
 challengeEndDate={currentChallenge?.challenges.end_date}
 />
 </div>

 {/* API 연결 경고 메시지 제거 */}
 <div>
 <WorkoutTable 
 challengeId={params.challengeId as string}
 weeklyChart={weeklyChart}
 leaderboard={leaderboard}
 todayCount={todayCount}
 batchUserData={batchUserData}
 isLoading={(!weeklyChart || !leaderboard || !todayCount) && !workoutError}
 error={workoutError}
 />
 </div>
 </div>
 );
}
