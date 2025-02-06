'use client';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/fixedBars/sidebar';

import { useChallenge } from '@/components/hooks/useChallenges';
import MainContent from '@/components/mainContent';
import { useAdminData } from '@/components/hooks/useAdminData';
import { useDailyRecords } from '@/components/hooks/useDailyRecords';
import { useResponsive } from '@/components/hooks/useResponsive';

// pages/User.tsx
export default function User() {
  const {
    challenges,
    selectedChallengeId,
    challengeTitle,
    fetchChallenges,
    handleChallengeSelect,
  } = useChallenge();
  const { isMobile } = useResponsive();

  const { dailyRecords, fetchDailyRecords } = useDailyRecords();
  const { adminData, fetchAdminData } = useAdminData();

  const filteredDailyRecordsbyId = useMemo(
    () =>
      dailyRecords.filter(
        (record) => record.challenges.id === selectedChallengeId
      ),
    [dailyRecords, selectedChallengeId]
  );

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchChallenges(),
        fetchDailyRecords(),
        fetchAdminData(),
      ]);
    };
    fetchAllData();
  }, []);

  return (
    <div className="bg-white-1 dark:bg-blue-4 flex gap-[1rem] pr-[1rem] h-screen overflow-hidden sm:flex-col md:flex-col">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        coach={adminData.display_name}
      />
      <MainContent
        challengeTitle={challengeTitle}
        dailyRecords={filteredDailyRecordsbyId}
        selectedChallengeId={selectedChallengeId}
        challenges={challenges}
        isMobile={isMobile}
      />
    </div>
  );
}
