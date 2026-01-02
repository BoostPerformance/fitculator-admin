'use client';
import { useState, useEffect } from 'react';
import { WorkoutPageSkeleton } from '@/components/layout/skeleton';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useRunningDataQueryPaginated } from '@/components/hooks/useRunningDataQuery';
import { useResponsive } from '@/components/hooks/useResponsive';
import { useChallengeContext } from '@/contexts/ChallengeContext';
import Title from '@/components/layout/title';
import { IoRefresh } from 'react-icons/io5';
import RunningTable from '@/components/runningDashboard/runningTable';
import { ExcerciseStatistics } from '@/components/statistics/excerciseStatistics';
import RunningUserList from '@/components/runningDashboard/runningUserList';
import { useQueryClient } from '@tanstack/react-query';

export default function RunningPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlDate = searchParams.get('date');
  const refreshParam = searchParams.get('refresh');
  const urlPage = searchParams.get('page');
  const today = new Date().toISOString().split('T')[0];
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>(urlDate || today);
  const [currentPage, setCurrentPage] = useState<number>(urlPage ? parseInt(urlPage) : 1);
  const ITEMS_PER_PAGE = 30;

  const {
    weeklyChart,
    leaderboard,
    todayCount,
    paginatedUsers,
    pagination,
    isLoading: runningLoading,
    isFetching: runningFetching,
    error: runningError,
    hasAnyData,
    isApiConnected,
    refetch
  } = useRunningDataQueryPaginated(params.challengeId as string, currentPage, ITEMS_PER_PAGE, refreshParam);

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

  const handleSelectChallenge = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation.type === 'reload') {
        queryClient.removeQueries({ queryKey: ['running'] });
      }
    }
  }, [queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // URL 업데이트 (선택사항)
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());
    router.push(`/${params.challengeId}/running?${newSearchParams.toString()}`, { scroll: false });
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

  if (challengesLoading || runningLoading) {
    return <WorkoutPageSkeleton />;
  }

  if (!challenges) {
    return <div className="p-4">챌린지 정보가 없습니다.</div>;
  }

  const currentChallenge = challenges?.find((c) => c.challenges.id === params.challengeId);

  return (
    <div className="flex-1 p-4 sm:p-0">
      <div className="px-8 pt-4 sm:px-4 sm:pt-4">
        {/* 챌린지 기간 표시 */}
        {currentChallenge && (
          <div className="text-0.875-400 text-gray-6 dark:text-gray-7 mb-2">
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
        <div className="text-gray-2 dark:text-gray-4 text-1.25-700">
          {currentChallenge?.challenges.title || ''}
        </div>
        <div className="flex items-center justify-between">
          <Title title="운동 현황" />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || runningFetching}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-4 bg-white dark:bg-blue-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="데이터 새로고침"
          >
            <IoRefresh
              className={`h-4 w-4 ${(isRefreshing || runningFetching) ? 'animate-spin' : ''}`}
            />
            {(isRefreshing || runningFetching) ? '업데이트 중...' : '새로고침'}
          </button>
        </div>
      </div>
      {runningError && (
        <div className="p-4 text-red-500 bg-red-50 rounded-lg mx-4">
          <h4 className="font-semibold mb-2">운동 데이터 로드 오류</h4>
          <p>오류 내용: {runningError.message}</p>
          <p className="text-sm mt-1">Challenge ID: {params.challengeId}</p>
        </div>
      )}

      {!runningLoading && !hasAnyData && !runningError && (
        <div className="p-4 text-yellow-600 bg-yellow-50 rounded-lg mx-4">
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
          isLoading={runningFetching}
          challengeEndDate={currentChallenge?.challenges.end_date}
        />
      </div>

      <RunningUserList
        challengeId={params.challengeId as string}
        weeklyChart={weeklyChart}
        leaderboard={leaderboard}
        todayCount={todayCount}
        paginatedUsers={paginatedUsers}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isLoading={runningLoading}
        error={runningError}
      />
      <div className="sm:hidden">
        <RunningTable
          challengeId={params.challengeId as string}
          weeklyChart={weeklyChart}
          leaderboard={leaderboard}
          todayCount={todayCount}
          paginatedUsers={paginatedUsers}
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isLoading={runningLoading}
          error={runningError}
        />
      </div>
    </div>
  );
}
