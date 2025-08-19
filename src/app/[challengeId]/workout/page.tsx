'use client';
import { useState, useEffect } from 'react';
import { WorkoutPageSkeleton } from '@/components/layout/skeleton';
import { useParams, useSearchParams } from 'next/navigation';
import { useWorkoutDataQuery } from '@/components/hooks/useWorkoutDataQuery';
import { useResponsive } from '@/components/hooks/useResponsive';
import { useChallenge } from '@/components/hooks/useChallenges';
import Title from '@/components/layout/title';
import WorkoutTable from '@/components/workoutDashboard/workoutTable';
import { ExcerciseStatistics } from '@/components/statistics/excerciseStatistics';
import WorkoutUserList from '@/components/workoutDashboard/workoutUserList';
import { useQuery } from '@tanstack/react-query';

export default function WorkoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get('date');
  const today = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(urlDate || today);
  const {
    weeklyChart,
    leaderboard,
    todayCount,
    batchUserData,
    isLoading: workoutLoading,
    error: workoutError,
    hasAnyData,
    isApiConnected
  } = useWorkoutDataQuery(params.challengeId as string);
  
  // 디버깅을 위한 로그
  useEffect(() => {
// console.log('🔍 Workout 페이지 데이터 상태:', {
    //   challengeId: params.challengeId,
    //   workoutLoading,
    //   hasAnyData,
    //   isApiConnected,
    //   weeklyChart: !!weeklyChart,
    //   leaderboard: !!leaderboard,
    //   todayCount: !!todayCount,
    //   batchUserData: batchUserData?.length || 0,
    //   workoutError: workoutError?.message
    // });
  }, [params.challengeId, workoutLoading, hasAnyData, isApiConnected, weeklyChart, leaderboard, todayCount, batchUserData, workoutError]);
  
  const { isMobile } = useResponsive();
  const {
    challenges,
    selectedChallengeId: currentChallengeId,
    fetchChallenges,
    loading: challengesLoading,
  } = useChallenge();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challengeError, setChallengeError] = useState<string | null>(null);
  // API 연결 상태 체크 제거

  const handleSelectChallenge = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
  };

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        await fetchChallenges();
        setChallengeError(null);
      } catch (err) {
        setChallengeError('챌린지 정보를 불러오는데 실패했습니다.');
// console.error('Failed to fetch challenges:', err);
      }
    };
    loadChallenges();
  }, [fetchChallenges]);

  // API 연결 테스트 제거 - 불필요한 경고 메시지 방지

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

  if (challengesLoading || workoutLoading) {
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
          <div className="text-0.875-400 text-gray-6 mb-2">
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
        <div className="text-gray-2 text-1.25-700">
          {currentChallenge?.challenges.title || ''}
        </div>
        <Title title="운동 현황" />
      </div>
      {workoutError && (
        <div className="p-4 text-red-500 bg-red-50 rounded-lg mx-4">
          <h4 className="font-semibold mb-2">운동 데이터 로드 오류</h4>
          <p>오류 내용: {workoutError.message}</p>
          <p className="text-sm mt-1">Challenge ID: {params.challengeId}</p>
        </div>
      )}
      
      {!workoutLoading && !hasAnyData && !workoutError && (
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
        />
      </div>

      {/* API 연결 경고 메시지 제거 */}
      <WorkoutUserList challengeId={params.challengeId as string} />
      <div className="sm:hidden">
        <WorkoutTable challengeId={params.challengeId as string} />
      </div>
    </div>
  );
}
