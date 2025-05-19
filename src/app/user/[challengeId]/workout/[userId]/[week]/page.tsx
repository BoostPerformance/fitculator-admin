'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DietPageSkeleton } from '@/components/layout/skeleton';
import { useResponsive } from '@/components/hooks/useResponsive';
import { useDietData } from '@/components/hooks/useDietData';
import { useChallenge } from '@/components/hooks/useChallenges';
import Title from '@/components/layout/title';
import WorkoutUserList from '@/components/workoutDashboard/workoutUserList';
import { ExcerciseStatistics } from '@/components/statistics/excerciseStatistics';

export default function Page() {
  const params = useParams(); // contains userListId
  const searchParams = useSearchParams();
  const urlDate = searchParams.get('date');
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(urlDate || today);

  const { isMobile } = useResponsive();

  const {
    challenges,
    selectedChallengeId,
    fetchChallenges,
    loading: challengesLoading,
  } = useChallenge();

  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

  const challengeId = searchParams.get('challengeId') || '';

  const {
    dietRecords,
    loading: dietLoading,
    error: dietError,
  } = useDietData(challengeId, selectedDate);

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
    }
  }, [urlDate]);

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

  if (challengeError) {
    return <div className="p-4 text-red-500">{challengeError}</div>;
  }

  if (challengesLoading || dietLoading) {
    return <DietPageSkeleton />;
  }

  if (!challenges) {
    return <div className="p-4">챌린지 정보가 없습니다.</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-0">
      <div className="px-8 pt-4 sm:px-4 sm:pt-4">
        <div className="text-gray-2 text-1.25-700">
          {challenges.find((c) => c.challenges.id === challengeId)?.challenges
            .title || ''}
        </div>
        <Title title="운동 현황 (모바일)" />
      </div>

      <div className="mt-6">
        <ExcerciseStatistics
          processedMeals={dietRecords}
          selectedChallengeId={challengeId}
          selectedDate={selectedDate}
        />
      </div>

      {/* {!isApiConnected && (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded mb-4">
          <span className="font-medium">⚠️ API 연결 안됨:</span> 실제 API에
          연결할 수 없어 목데이터를 사용합니다.
        </div>
      )} */}
    </div>
  );
}
