'use client';
import { useEffect, useMemo } from 'react';
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
  //console.log('dailyRecords', dailyRecords);

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

  //console.log('challenges', challenges);

  const calcChallenges = challenges.find(
    (challenge) => challenge.challenges.id === selectedChallengeId
  );
  //console.log('calc', calcChallenges);

  const challengeParticipantsMemos =
    calcChallenges?.challenges?.challenge_participants.map((participant) => {
      const memos = participant.daily_records.filter(
        (record) => record.feedbacks?.coach_memo
      );

      //   .map((record) => record.feedbacks.coach_memo)
      //   .filter((memo) => memo !== null); // null이 아닌 메모만 필터링

      return {
        participantId: participant.id,
        memos: memos,
      };
    });

  //console.log('challengeParticipantsMemos', challengeParticipantsMemos);
  return (
    <div className="bg-white-1 dark:bg-blue-4 flex gap-[1rem] h-screen overflow-hidden sm:flex-col sm:px-[1rem]">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        coach={adminData.username}
      />
      <MainContent
        challengeTitle={challengeTitle}
        dailyRecords={filteredDailyRecordsbyId}
        selectedChallengeId={selectedChallengeId}
        challenges={challenges}
        isMobile={isMobile}
        coachMemo={''}
      />
    </div>
  );
}
