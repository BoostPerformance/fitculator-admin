'use client';
import { useState, useEffect } from 'react';
import { WorkoutPageSkeleton } from '@/components/layout/skeleton';
import { useParams, useSearchParams } from 'next/navigation';
import { useDietData } from '@/components/hooks/useDietData';
import { useResponsive } from '@/components/hooks/useResponsive';
import { useChallenge } from '@/components/hooks/useChallenges';
import Title from '@/components/layout/title';
import WorkoutTable from '@/components/workoutDashboard/workoutTable';
import { ExcerciseStatistics } from '@/components/statistics/excerciseStatistics';
import WorkoutUserList from '@/components/workoutDashboard/workoutUserList';

export default function WorkoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get('date');
  const today = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(urlDate || today);
  const {
    dietRecords,
    loading: dietLoading,
    error: dietError,
  } = useDietData(params.challengeId as string, selectedDate);
  const { isMobile } = useResponsive();
  const {
    challenges,
    selectedChallengeId: currentChallengeId,
    fetchChallenges,
    loading: challengesLoading,
  } = useChallenge();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

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
        console.error('Failed to fetch challenges:', err);
      }
    };
    loadChallenges();
  }, [fetchChallenges]);

  // API 연결 확인
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const response = await fetch(
          '/api/workouts/user-detail?type=test-connection'
        );
        setIsApiConnected(response.ok);
      } catch (error) {
        console.error('API 연결 확인 실패:', error);
        setIsApiConnected(false);
      }
    };
    checkApiConnection();
  }, []);

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

  if (challengesLoading || dietLoading) {
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
      {dietError && <div className="p-4 text-red-500">{dietError}</div>}
      <div className="mt-6">
        <ExcerciseStatistics
          processedMeals={dietRecords}
          selectedChallengeId={params.challengeId as string}
          selectedDate={selectedDate}
        />
      </div>

      {!isApiConnected && (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded mb-4">
          <span className="font-medium">⚠️ API 연결 안됨:</span> 실제 API에
          연결할 수 없어 목데이터를 사용합니다.
        </div>
      )}
      <WorkoutUserList challengeId={params.challengeId as string} />
      <div className="sm:hidden">
        <WorkoutTable challengeId={params.challengeId as string} />
      </div>
    </div>
  );
}
