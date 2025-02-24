import Image from 'next/image';
import { useState } from 'react';
import { DietTableProps, ChallengeParticipant } from '@/types/userPageTypes';
import Modal from '../layout/modal';

// interface CoachMemoData {
//   participant_id: string;
//   challenge_id: string;
//   coach_memo: string;
//   memo_record_date?: Date;
// }

const DietTable: React.FC<DietTableProps> = ({ dailyRecordsData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ChallengeParticipant | null>(null);
  const [existCoachMemo, setExistCoachMemo] = useState('');

  const calculateFeedbackRatio = (participant: ChallengeParticipant) => {
    const today = new Date();
    const startDate = new Date(participant.challenges.start_date);
    const endDate = new Date(participant.challenges.end_date);

    const totalChallengeDays =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    const daysUntilToday =
      Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    const effectiveDays = today > endDate ? totalChallengeDays : daysUntilToday;

    const feedbackCount = participant.daily_records
      .map((record) => {
        const recordDate = new Date(record.record_date);
        return recordDate <= today && record.feedbacks! !== null ? 1 : 0;
      })
      .reduce<number>((sum, current) => sum + current, 0);

    return {
      completed: feedbackCount,
      total: effectiveDays,
      formatted: `${feedbackCount}/${effectiveDays}`,
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
        groupedData.set(participantId, {
          participant: record,
          feedbackRatio: calculateFeedbackRatio(record),
        });
      }
    });
    // console.log('records dietTable', records);

    return Array.from(groupedData.values());
  };

  // useEffect(() => {
  //   console.log('participantMemos updated:', participantMemos);
  // }, [participantMemos]);

  const handleCoachMemoSave = (memo: string) => {
    if (!selectedParticipant) return;

    if (selectedParticipant) {
      // 선택된 참가자의 메모를 업데이트
      setSelectedParticipant({
        ...selectedParticipant,
        coach_memo: memo,
        memo_record_date: new Date().toISOString(),
      });
    }
  };

  const handleModalOpen = (participant: ChallengeParticipant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
    setExistCoachMemo(participant.coach_memo || '');

    // console.log('participant table', participant);

    // useEffect(() => {
    //   if (dailyRecordsData && dailyRecordsData.length > 0) {
    //     const initialMemos = dailyRecordsData.reduce(
    //       (memos: { [key: string]: string }, participant) => {
    //         if (participant.coach_memo) {
    //           memos[participant.id] = participant.coach_memo;
    //         }
    //         return memos;
    //       },
    //       {}
    //     );
    //     console.log('initialMemos', initialMemos);

    //     setParticipantMemos(initialMemos);
    //   }
    // }, [dailyRecordsData]);
  };
  //console.log('dailyRecordsData', dailyRecordsData);

  return (
    <div className="mt-[1.4rem]">
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
              <div className="relative flex justify-between items-center sm:flex-col sm:gap-[1rem] sm:justify-center">
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
            <th className="p-[1rem] lg:w-[15%] sm:w-[18%]  sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex justify-between items-center sm:flex-col sm:gap-[1rem] sm:justify-center">
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
              <div className="flex justify-between items-center sm:flex-col sm:gap-[1rem] sm:justify-center sm:p-0">
                <div className="sm:text-0.75-500 sm:p-0">코치 메모</div>
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
          {participants(dailyRecordsData).map((data, index) => {
            return (
              <tr key={index} className="text-[#6F6F6F] hover:bg-[#F4F6FC]">
                <td className="p-[1rem] text-left sm:text-center sm:text-0.625-500 sm:p-0 lg:py-[2rem] sm:py-[1rem]">
                  {data.participant.users?.username}
                </td>
                <td className="p-[1rem] text-left sm:text-center sm:text-0.625-500 sm:p-0">
                  {data.participant.users?.name}
                </td>
                <td className="p-[1rem] text-left sm:text-center sm:text-0.625-500 sm:p-0">
                  <button onClick={() => handleModalOpen(data.participant)}>
                    {selectedParticipant &&
                    selectedParticipant.id === data.participant.id
                      ? selectedParticipant.coach_memo || '코치메모'
                      : data.participant.coach_memo || '코치메모'}
                  </button>
                </td>
                <td className="p-[1rem] text-center sm:text-0.625-500 sm:p-0">
                  {data.feedbackRatio.formatted}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
