import TotalFeedbackCounts from '../totalCounts/totalFeedbackCount';
import { ChallengeParticipant, Challenges } from '@/types/userPageTypes';

interface ChallengeStatisticsProps {
  dailyRecords: ChallengeParticipant[];
  selectedChallengeId: string;
  challenges: Challenges[];
}

const ChallengeStatistics: React.FC<ChallengeStatisticsProps> = ({
  dailyRecords,
  selectedChallengeId,
  challenges,
}) => {
  const getTotalDietUploads = () => {
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === selectedChallengeId
    );

    if (!selectedChallenge) return { count: '0', total: '0개' };

    const startDate = new Date(selectedChallenge.challenges.start_date);
    const endDate = new Date(selectedChallenge.challenges.end_date);

    const challengeRecords = dailyRecords.filter(
      (record) => record.challenges.id === selectedChallengeId
    );

    const totalDietUploads = challengeRecords.reduce((total, record) => {
      const validRecords = record.daily_records.filter((dailyRecord) => {
        const recordDate = new Date(dailyRecord.record_date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      return total + validRecords.length;
    }, 0);

    //const totalParticipants = challengeRecords.length;
    //console.log('challengeRecords', challengeRecords);
    return {
      total: `${totalDietUploads.toString()}개`,
    };
  };

  const getTodayDietUploads = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 오늘 날짜 가져오기

    // 선택된 챌린지에 대해서만 필터링
    const todayUploads = dailyRecords.filter((record) => {
      if (record.challenges.id !== selectedChallengeId) return false;

      // daily_records 배열에서 오늘 날짜의 기록이 있는지 확인
      return record.daily_records.some(
        (dailyRecord: any) => dailyRecord.record_date.split('T')[0] === today
      );
    });

    const totalNoRecords = dailyRecords.filter(
      (record) => record.challenges.id === selectedChallengeId
    ).length;

    return {
      count: todayUploads.length.toString(),
      total: `${totalNoRecords}명`,
    };
  };

  const todayStats = getTodayDietUploads();
  const totalStats = getTotalDietUploads();

  return (
    <div className="flex gap-[0.625rem] overflow-x-auto sm:grid sm:grid-cols-2 sm:grid-rows-3 sm:px-[0.3rem] md:grid md:grid-cols-5 md:grid-rows-1 md:pb-[1rem] md:gap-[-.3rem]">
      <TotalFeedbackCounts
        counts="10"
        total="30명"
        title="진행현황"
        borderColor="border-green"
        textColor="text-green"
        grids="sm:col-span-2 "
      />
      <TotalFeedbackCounts
        counts={'10'}
        total={'30명'}
        title={'오늘 운동 업로드 멤버'}
        borderColor="border-blue-5"
        textColor="text-blue-5"
      />
      <TotalFeedbackCounts
        counts={todayStats.count}
        total={todayStats.total}
        title={'오늘 식단 업로드 멤버'}
        borderColor="border-yellow"
        textColor="text-yellow"
      />
      <TotalFeedbackCounts
        counts={'10'}
        total={'30개'}
        title={'전체 운동 업로드 수'}
        borderColor="border-blue-5"
        textColor="text-blue-5"
      />
      <TotalFeedbackCounts
        counts={totalStats.total}
        title={'전체 식단 업로드 수'}
        borderColor="border-yellow"
        textColor="text-yellow"
      />
    </div>
  );
};

export default ChallengeStatistics;
