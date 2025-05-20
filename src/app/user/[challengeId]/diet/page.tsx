'use client';
import { useState, useEffect } from 'react';
import { DietPageSkeleton } from '@/components/layout/skeleton';
import { useParams, useSearchParams } from 'next/navigation';
import { useDietData } from '@/components/hooks/useDietData';
import { DietStatistics } from '@/components/statistics/dietStatistics';
import { DietContent } from '@/components/dietDashboard/dietContent';
import { useResponsive } from '@/components/hooks/useResponsive';
import { useChallenge } from '@/components/hooks/useChallenges';
import { processMeals } from '@/components/utils/processMeals';
import Title from '@/components/layout/title';

export default function DietItem() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get('date');
  const today = new Date().toISOString().split('T')[0];
  const [fullDietData, setFullDietData] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  const [selectedDate, setSelectedDate] = useState<string>(urlDate || today);
  const {
    dietRecords,
    loading: dietLoading,
    error: dietError,
    fetchAllDietData,
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

  // useEffect(() => {
  //   const loadFullDietData = async () => {
  //     const fullRaw = await fetchAllDietData(); // <- from hook
  //     const processed = processMeals(fullRaw);
  //     setFullDietData(processed);
  //   };
  //   loadFullDietData();
  // }, [params.challengeId, selectedDate]);

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
      <div className="px-8 pt-4 sm:px-4 sm:pt-0">
        <div className="text-gray-2 text-1.25-700">
          {challenges?.find((c) => c.challenges.id === params.challengeId)
            ?.challenges.title || ''}
        </div>
        <Title title="식단 현황" />
      </div>
      {dietError && <div className="p-4 text-red-500">{dietError}</div>}
      <div className="mt-6">
        <DietStatistics
          fetchAllDietData={fetchAllDietData}
          processedMeals={dietRecords}
          selectedChallengeId={params.challengeId as string}
          selectedDate={selectedDate}
          dailyRecords={challenges
            ?.filter(
              (challenge) => challenge.challenges.id === params.challengeId
            )
            .flatMap((challenge) =>
              challenge.challenges.challenge_participants.map(
                (participant) => ({
                  id: challenge.challenges.id,
                  users: {
                    id: participant.service_user_id || '',
                    name: '',
                    username: '',
                  },
                  challenges: {
                    ...challenge.challenges,
                    challenge_type: 'diet',
                  },
                  daily_records: [],
                })
              )
            )}
        />
      </div>
      <DietContent
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        challengeDates={{
          startDate:
            challenges?.find((c) => c.challenges.id === params.challengeId)
              ?.challenges.start_date || '',
          endDate:
            challenges?.find((c) => c.challenges.id === params.challengeId)
              ?.challenges.end_date || '',
        }}
        filteredByDate={dietRecords}
        mobileSize={isMobile}
        loading={dietLoading}
        challengeId={params.challengeId as string}
      />
    </div>
  );
}
