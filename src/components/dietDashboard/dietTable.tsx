import Image from 'next/image';
import { useState, useEffect } from 'react';
import { DietTableProps, ChallengeParticipant } from '@/types/userPageTypes';
import Modal from '../layout/modal';

const DietTable: React.FC<DietTableProps> = ({ dailyRecordsData }) => {
  const [participantMemos, setParticipantMemos] = useState<{
    [key: string]: string;
  }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ChallengeParticipant | null>(null);

  const calculateFeedbackRatio = (participant: ChallengeParticipant) => {
    const today = new Date();
    const startDate = new Date(participant.challenges.start_date);
    const endDate = new Date(participant.challenges.end_date);

    // 챌린지 전체 기간 계산
    const totalChallengeDays =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // 오늘까지의 기간 계산
    const daysUntilToday =
      Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // 챌린지가 이미 끝났다면 전체 기간을, 아니면 오늘까지의 기간을 사용
    const effectiveDays = today > endDate ? totalChallengeDays : daysUntilToday;

    // 피드백 갯수 계산 (각 record의 모든 feedback 확인)
    const feedbackCount = participant.daily_records
      .map((record) => {
        const recordDate = new Date(record.record_date);

        if (recordDate <= today && record.feedbacks! !== null) {
          return 1;
        }
        return 0;
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

    const recordDate = records.forEach((record) => {
      const participantId = record.id;
      if (!groupedData.has(participantId)) {
        groupedData.set(participantId, {
          participant: record,
          feedbackRatio: calculateFeedbackRatio(record),
        });
      }
    });
    //console.log('recordDate', recordDate);

    return Array.from(groupedData.values());
  };

  // useEffect(() => {
  //   console.log('participantMemos updated:', participantMemos);
  // }, [participantMemos]);

  const handleCoachMemoSave = (memo: string, participantId: string) => {
    console.log('Saving memo:', {
      memo,
      participantId,
      currentMemos: participantMemos,
    });

    setParticipantMemos((prev) => {
      const newMemos = {
        ...prev,
        [participantId]: memo,
      };
      console.log('New participantMemos:', newMemos);
      return newMemos;
    });
  };

  const handleModalOpen = (participant: ChallengeParticipant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  return (
    <div className="mt-[1.4rem]">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-white text-left text-1.125-500 text-[#A1A1A1]">
            <th className="p-[1rem] lg:w-[15%] sm:w-[18%] sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[5.2rem] sm:text-0.75-500 sm:p-0">
                  닉네임
                </div>
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
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[5.2rem] sm:text-0.75-500 sm:p-0">
                  이름
                </div>
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
              <div className=" flex justify-center  items-center lg:gap-[1rem] sm:flex-col sm:gap-[1rem] lg:pr-[9rem] sm:p-0">
                <div className="lg:pl-[10.3rem] sm:text-0.75-500 sm:p-0">
                  코치메모
                </div>
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
            <th className="p-[1rem] w-[20%] lg:pl-[1rem] sm:p-0 sm:text-0.75-500 text-center">
              피드백 수
            </th>
          </tr>
        </thead>
        <tbody className="text-center ">
          {participants(dailyRecordsData).map((data, index) => {
            console.log('participantMemos', participantMemos);
            return (
              <tr key={index} className="text-[#6F6F6F] hover:bg-[#F4F6FC] ">
                <td className="p-[1rem] sm:text-0.625-500 sm:p-0 lg:py-[2rem] sm:py-[1rem]">
                  {data.participant.users?.display_name}
                </td>
                <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                  {data.participant.users?.name}
                </td>
                <td className="p-[1rem] sm:text-0.625-500 sm:p-0 ">
                  <button onClick={() => handleModalOpen(data.participant)}>
                    {participantMemos[data.participant.users.id] || '코치메모'}
                  </button>
                </td>
                <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                  {data.feedbackRatio.formatted}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="absolute items-center justify-center ">
        {isModalOpen && selectedParticipant && (
          <Modal
            onClose={() => setIsModalOpen(false)}
            participantId={selectedParticipant.id}
            challengeId={selectedParticipant.challenges.id}
            onSave={(memo) =>
              handleCoachMemoSave(memo, selectedParticipant.users.id)
            }
          />
        )}
      </div>
    </div>
  );
};

export default DietTable;
