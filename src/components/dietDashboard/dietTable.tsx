import Image from 'next/image';
import { useState } from 'react';
import {
  DietTableProps,
  ChallengeParticipant,
  DailyRecord,
} from '@/types/userPageTypes';
import Modal from '../layout/modal';
import { DietTableSkeleton } from '../layout/skeleton';

const DietTable: React.FC<DietTableProps> = ({
  dailyRecordsData,
  loading,
  challengeId,
  selectedDate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ChallengeParticipant | null>(null);
  const [existCoachMemo, setExistCoachMemo] = useState('');

  const calculateFeedbackRatio = (participant: ChallengeParticipant) => {
    // console.log("전체 참가자 데이터:", participant);
    // console.log("daily_records:", participant.daily_records);

    // 총 daily_record 수
    const totalRecords = participant.daily_records?.length || 0;
    // console.log("총 레코드 수:", totalRecords);

    // feedbacks가 있는 레코드 수
    const feedbackCount =
      participant.daily_records?.reduce((count, record) => {
        // console.log("현재 레코드:", record);
        // console.log("현재 레코드의 feedbacks:", record.feedbacks);

        // feedbacks 객체가 있고 id가 있으면 피드백이 존재하는 것으로 간주
        if (record.feedbacks && record.feedbacks.id) {
          //  console.log("피드백 있음");
          return count + 1;
        }
        //   console.log("피드백 없음");
        return count;
      }, 0) || 0;
    //  console.log("피드백 있는 레코드 수:", feedbackCount);

    return {
      completed: feedbackCount,
      total: totalRecords,
      formatted: `${feedbackCount}/${totalRecords}`,
    };
  };

  const participants = (records: ChallengeParticipant[]) => {
    if (!records || !Array.isArray(records)) {
      return [];
    }

    const groupedData = new Map();

    records.forEach((record) => {
      const participantId = record.id;
      if (!groupedData.has(participantId)) {
        const participant = {
          id: participantId,
          users: record.users,
          challenges: record.challenges,
          daily_records: record.daily_records,
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

  if (loading) {
    return <DietTableSkeleton />;
  }

  return (
    <div className="mt-[1.4rem]">
      {/* <div className="mb-4 text-lg font-semibold">총 업로드</div> */}
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
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-white text-left text-1.125-500 text-[#A1A1A1]">
            <th className="p-[1rem] lg:w-[15%] sm:w-[18%] sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-center lg:gap-[1rem] sm:flex-col sm:gap-[1rem]">
                <div className="sm:text-0.75-500 sm:p-0">ID</div>
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
            <th className="p-[1rem] lg:w-[15%] sm:w-[18%] sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-center lg:gap-[1rem] sm:flex-col sm:gap-[1rem]">
                <div className="sm:text-0.75-500 sm:p-0">이름</div>
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
            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem]">
              <div className="flex justify-center items-center lg:gap-[1rem] sm:flex-col sm:gap-[1rem] sm:p-0">
                <div className="sm:text-0.75-500 sm:p-0">코치메모</div>
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
            <th className="p-[1rem] lg:w-[20%] sm:p-0 sm:text-0.75-500 text-center">
              피드백 수
            </th>
          </tr>
        </thead>
        <tbody className="text-center">
          {participants(dailyRecordsData).map((data, index) => (
            <tr key={index} className="text-[#6F6F6F]">
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0 lg:py-[2rem] sm:py-[1rem]">
                {data.participant.users?.username}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {data.participant.users?.name}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                <button
                  className="cursor-pointer"
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
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {data.feedbackRatio.formatted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && (
        <div className="w-full text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      )}
    </div>
  );
};

export default DietTable;
