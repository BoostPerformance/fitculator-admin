import { useState, useEffect } from 'react';
//import { CombinedData } from '@/types/dietTypes';
//import { useRouter } from 'next/navigation';
import Image from 'next/image';
//import DietTableMockData from '../mock/DietTableMockData';

interface DailyRecord {
  id: string;
  record_date: string;
  feedbacks: {
    coach_feedback: string;
    created_at: string;
    id: string;
  }[];
}

interface ChallengeParticipant {
  id: string;
  users: {
    id: string;
    name: string;
    display_name: string;
  };
  challenges: {
    id: string;
    title: string;
    end_date: string;
    start_date: string;
    challenge_type: string;
  };
  daily_records: DailyRecord[];
}

interface FeedbackCount {
  participantId: string;
  challengeId: string;
  feedbackRatio: {
    completed: number;
    total: number;
    formatted: string;
  };
}

interface DietTableProps {
  dailyRecordsData: ChallengeParticipant[];
  feedbackCounts?: FeedbackCount[];
}

const DietTable: React.FC<DietTableProps> = ({
  dailyRecordsData,
  feedbackCounts = [],
}) => {
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
        console.log('record', record);
        if (recordDate <= today && record.feedbacks! !== null) {
          return 1;
        }
        return 0;
      })
      .reduce<number>((sum, current) => sum + current, 0);

    console.log({
      completed: feedbackCount,
      total: effectiveDays,
      formatted: `${feedbackCount}/${effectiveDays}`,
    });

    return {
      completed: feedbackCount,
      total: effectiveDays,
      formatted: `${feedbackCount}/${effectiveDays}`,
    };
  };

  // const getDaysArray = (start: Date, end: Date) => {
  //   const arr = [];
  //   const currentDate = new Date(start);
  //   const endDate = new Date(end);

  //   while (currentDate <= endDate) {
  //     arr.push(new Date(currentDate).toISOString().split('T')[0]);
  //     currentDate.setDate(currentDate.getDate() + 1);
  //   }
  //   return arr;
  // };

  // const getRecordArray = (start: string, end: string, records: string[]) => {
  //   const days = getDaysArray(new Date(start), new Date(end));
  //   return days.map((day) => (records.includes(day) ? 1 : 0));
  // };

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

      //console.log('records', records);
      // 해당 참가자의 피드백 찾기
    });

    return Array.from(groupedData.values());
  };

  return (
    <div className="mt-[1.4rem]">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-white text-left text-1.125-500 text-[#A1A1A1]">
            <th className="p-[1rem] w-[10%]">
              <div className="relative flex items-center justify-between">
                <div>닉네임</div>
                <button>
                  <Image
                    src="/svg/arrow-down.svg"
                    width={10}
                    height={10}
                    alt="arrow-down"
                  />
                </button>
                {/* <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300" /> */}
              </div>
            </th>
            <th className="p-[1rem] w-[10%]">
              <div className="relative flex justify-between items-center pr-[1rem]">
                <div>이름</div>
                <button>
                  <Image
                    src="/svg/arrow-down.svg"
                    width={10}
                    height={10}
                    alt="arrow-down"
                  />
                </button>
                {/* <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300" /> */}
              </div>
            </th>

            <th className="p-[1rem] w-[20%] flex justify-between items-center">
              <div>코치메모</div>
              <button>
                <Image
                  src="/svg/arrow-down.svg"
                  width={10}
                  height={10}
                  alt="arrow-down"
                />
              </button>
            </th>
            <th className="p-[1rem] w-[10%]">피드백 수</th>
          </tr>
        </thead>
        <tbody>
          {participants(dailyRecordsData).map((data, index) => (
            <tr key={index} className="text-[#6F6F6F] hover:bg-[#F4F6FC]">
              <td className="p-[1rem]">
                {data.participant.users?.display_name}
              </td>
              <td className="p-[1rem]">{data.participant.users?.name}</td>
              <td className="p-[1rem]">
                <input type="text" placeholder="코치메모" />
              </td>
              <td className="p-[1rem]">{data.feedbackRatio.formatted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
