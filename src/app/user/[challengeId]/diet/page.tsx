'use client';
import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/fixedBars/sidebar';
import { useDietData } from '@/components/hooks/useDietData';
import { DietStatistics } from '@/components/statistics/dietStatistics';
import { DietContent } from '@/components/dietDashboard/dietContent';
import { useResponsive } from '@/components/hooks/useResponsive';
import { processMeals } from '@/components/utils/processMeals';

export default function DietItem() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get('date');
  const { challenges, adminData } = useDietData(params.challengeId);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const { isMobile, isTablet, isDesktop } = useResponsive();

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
    if (challenges.length > 0 && params.challengeId) {
      const currentChallenge = challenges.find(
        (challenge) => challenge.challenge_id === params.challengeId
      );
      if (currentChallenge) {
        setSelectedChallengeId(currentChallenge.challenge_id);
        setChallengeTitle(currentChallenge.challenges.title);
      }
    }
    console.log('urlDate', urlDate);
  }, [challenges, params.challengeId, urlDate]);

  const handleChallengeSelect = (challengeId: string) => {
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
      setChallengeTitle(selectedChallenge.challenges.title);
    }
  };

  const filteredByChallengeId = challenges.filter(
    (item) => item.challenge_id === selectedChallengeId
  );

  const currentChallengeIndex = challenges.find(
    (challenge) => challenge.challenge_id === selectedChallengeId
  );

  const challengeDates = {
    startDate: currentChallengeIndex?.challenges?.start_date || '',
    endDate: currentChallengeIndex?.challenges?.end_date || '',
  };

  const processedMeals = useMemo(
    () => processMeals(filteredByChallengeId),
    [filteredByChallengeId]
  );

  // const today = new Date().toISOString().split('T')[0];
  // const yesterday = '2025-02-11';

  const filteredByDate = useMemo(() => {
    return processedMeals.filter((meal) => {
      //console.log('processedMeals', processedMeals);
      return meal.record_date === selectedDate;
    });
  }, [processedMeals, selectedDate]);
  // console.log('processedMeals', processedMeals);
  //console.log('selectedDate page', selectedDate);

  return (
    <div className="bg-white-1 flex sm:flex-col md:flex-col">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        coach={adminData.username}
        onSelectChallengeTitle={handleChallengeSelect}
        selectedChallengeId={selectedChallengeId}
      />
      <div className="flex flex-col gap-[1rem]">
        <div className="px-[2rem] pt-[2rem]">
          <div className="text-gray-2 text-1.25-700">{challengeTitle}</div>
          <div className="text-black-4 text-1.75-700">식단 현황</div>
        </div>
        <DietStatistics processedMeals={processedMeals} />
        <DietContent
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          challengeDates={challengeDates}
          filteredByDate={filteredByDate}
          mobileSize={isMobile}
        />
      </div>
    </div>
  );
}
