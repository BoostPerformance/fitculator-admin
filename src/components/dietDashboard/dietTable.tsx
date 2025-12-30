import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  DietTableProps,
  ChallengeParticipant,
  DailyRecord,
} from '@/types/userPageTypes';
import Modal from '../layout/modal';
import { DietTableSkeleton } from '../layout/skeleton';

// 모바일 감지 hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const DietTable: React.FC<DietTableProps> = ({
  dailyRecordsData,
  loading,
  challengeId,
  selectedDate,
  feedbackData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ChallengeParticipant | null>(null);
  const [existCoachMemo, setExistCoachMemo] = useState('');

  const calculateFeedbackRatio = (participant: ChallengeParticipant) => {
    // 전체 daily_record 수는 API에서 가져온 daily_records_count 사용
    const totalRecords = participant.daily_records_count || 0;

    // 상위 컴포넌트에서 전달받은 피드백 데이터 사용
    const feedbackCount =
      feedbackData && feedbackData[participant.id] !== undefined
        ? feedbackData[participant.id]
        : participant.feedbacks_count || countFeedbacksDirectly(participant);

    return {
      completed: feedbackCount,
      total: totalRecords,
      formatted: `${feedbackCount}/${totalRecords}`,
    };
  };

  // 기존의 직접 카운트 함수 (백업으로 유지)
  const countFeedbacksDirectly = (
    participant: ChallengeParticipant
  ): number => {
    if (!participant.daily_records || participant.daily_records.length === 0) {
      return 0;
    }

    return participant.daily_records.reduce((count, record) => {
      // 피드백이 없으면 카운트하지 않음
      if (!record.feedbacks || record.feedbacks.length === 0) {
        return count;
      }

      // 피드백 배열에서 coach_feedback이 있는지 확인
      const hasCoachFeedback = record.feedbacks.some(
        (feedback) => feedback.coach_feedback
      );
      const result = hasCoachFeedback ? count + 1 : count;
      // console.log('result', result);
      // coach_feedback이 있으면 카운트 증가
      return result;
    }, 0);
  };

  const participants = (records: ChallengeParticipant[]) => {
    if (!records || !Array.isArray(records)) {
      return [];
    }

    const groupedData = new Map();

    records.forEach((record) => {
      const participantId = record.id;
      if (!groupedData.has(participantId)) {
        // 피드백 수 계산
        const calculatedFeedbackCount =
          feedbackData && feedbackData[participantId] !== undefined
            ? feedbackData[participantId]
            : typeof record.feedbacks_count === 'number'
            ? record.feedbacks_count
            : countFeedbacksDirectly(record);

        const participant = {
          id: participantId,
          users: record.users,
          challenges: record.challenges,
          daily_records: record.daily_records,
          daily_records_count: record.daily_records_count,
          feedbacks_count: calculatedFeedbackCount,
          coach_memo: record.coach_memo,
          memo_updated_at: record.memo_updated_at,
          service_user_id: record.service_user_id,
        };

        groupedData.set(participantId, {
          participant: participant,
          feedbackRatio: calculateFeedbackRatio(participant),
        });
      }
    });

    // Convert Map to array and sort by total records count and name
    return Array.from(groupedData.values()).sort((a, b) => {
      // First sort by total records count (큰 수가 위로)
      const totalA = a.feedbackRatio.total;
      const totalB = b.feedbackRatio.total;

      if (totalA !== totalB) {
        return totalB - totalA; // 내림차순 정렬
      }

      // If total records are equal, sort by name
      const nameA = a.participant.users?.name || '';
      const nameB = b.participant.users?.name || '';
      return nameA.localeCompare(nameB);
    });
  };

  const handleCoachMemoSave = (memo: string) => {
    if (!selectedParticipant) return;

    if (selectedParticipant) {
      // 선택된 참가자의 메모를 업데이트
      setSelectedParticipant({
        ...selectedParticipant,
        coach_memo: memo,
        memo_updated_at: new Date().toISOString(),
      });
    }
  };

  const handleModalOpen = (participant: ChallengeParticipant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
    setExistCoachMemo(participant.coach_memo || '');
  };

  const isMobile = useIsMobile();

  if (loading) {
    return <DietTableSkeleton />;
  }

  const participantsList = participants(dailyRecordsData);

  // Mobile card component
  const MobileCard = ({ data, index }: { data: any; index: number }) => {
    const feedbackPercent = data.feedbackRatio.total > 0
      ? Math.round((data.feedbackRatio.completed / data.feedbackRatio.total) * 100)
      : 0;

    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3"
      >
        {/* 헤더: 순위, 이름, ID */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-300 font-semibold text-sm">
              {index + 1}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {data.participant.users?.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {data.participant.users?.username}
              </div>
            </div>
          </div>
        </div>

        {/* 피드백 진행률 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">피드백 진행률</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {data.feedbackRatio.formatted}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${feedbackPercent}%` }}
            />
          </div>
        </div>

        {/* 코치메모 버튼 */}
        <button
          className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors flex items-center justify-between min-h-[48px]"
          onClick={(e) => {
            e.stopPropagation();
            handleModalOpen(data.participant);
          }}
        >
          <span className="text-gray-500 dark:text-gray-400">코치메모</span>
          <span className="text-gray-900 dark:text-white truncate max-w-[60%] text-right">
            {selectedParticipant && selectedParticipant.id === data.participant.id
              ? selectedParticipant.coach_memo || '작성하기'
              : data.participant.coach_memo || '작성하기'}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="mt-4">
      {/* 모달 */}
      <div className="absolute items-center justify-center">
        {isModalOpen && selectedParticipant && (
          <Modal
            onClose={() => setIsModalOpen(false)}
            participantId={selectedParticipant.id}
            challengeId={selectedParticipant.challenges.id}
            serviceUserId={selectedParticipant.users.id}
            coach_memo={existCoachMemo}
            onSave={handleCoachMemoSave}
          />
        )}
      </div>

      {/* 모바일 카드 뷰 */}
      {isMobile ? (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              참가자 ({participantsList.length}명)
            </h2>
          </div>
          <div className="space-y-3">
            {participantsList.map((data, index) => (
              <MobileCard key={index} data={data} index={index} />
            ))}
          </div>
          {participantsList.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              참가자 데이터가 없습니다
            </div>
          )}
        </div>
      ) : (
        /* 데스크톱 테이블 뷰 */
        <table className="table-auto w-full bg-white shadow rounded-lg">
          <thead>
            <tr className="bg-white text-left text-1.125-500 text-[#A1A1A1]">
              <th className="p-[1rem] lg:w-[15%]">
                <div className="relative flex items-center justify-center lg:gap-[1rem]">
                  <div>ID</div>
                  <button>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={10}
                      height={10}
                      alt="arrow-down"
                    />
                  </button>
                </div>
              </th>
              <th className="p-[1rem] lg:w-[15%]">
                <div className="relative flex items-center justify-center lg:gap-[1rem]">
                  <div>이름</div>
                  <button>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={10}
                      height={10}
                      alt="arrow-down"
                    />
                  </button>
                </div>
              </th>
              <th className="p-[1rem]">
                <div className="flex justify-center items-center lg:gap-[1rem]">
                  <div>코치메모</div>
                  <button>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={10}
                      height={10}
                      alt="arrow-down"
                    />
                  </button>
                </div>
              </th>
              <th className="p-[1rem] lg:w-[20%] text-center">
                피드백 수
              </th>
            </tr>
          </thead>
          <tbody className="text-center">
            {participantsList.map((data, index) => (
              <tr key={index} className="text-[#6F6F6F] hover:bg-gray-50">
                <td className="p-[1rem] lg:py-[2rem]">
                  {data.participant.users?.username}
                </td>
                <td className="p-[1rem]">
                  {data.participant.users?.name}
                </td>
                <td className="p-[1rem]">
                  <button
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalOpen(data.participant);
                    }}
                  >
                    {selectedParticipant &&
                    selectedParticipant.id === data.participant.id
                      ? selectedParticipant.coach_memo || '코치메모'
                      : data.participant.coach_memo || '코치메모'}
                  </button>
                </td>
                <td className="p-[1rem]">
                  {data.feedbackRatio.formatted}
                </td>
              </tr>
            ))}
            {participantsList.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  표시할 참가자 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {loading && (
        <div className="w-full text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      )}
    </div>
  );
};

export default DietTable;
