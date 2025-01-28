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
  const getDaysArray = (start: Date, end: Date) => {
    const arr = [];
    const currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
      arr.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return arr;
  };

  const getRecordArray = (start: string, end: string, records: string[]) => {
    const days = getDaysArray(new Date(start), new Date(end));
    return days.map((day) => (records.includes(day) ? 1 : 0));
  };

  const participants = (records: ChallengeParticipant[]) => {
    if (!records || !Array.isArray(records)) {
      return [];
    }

    const groupedData = new Map();

    records.forEach((record) => {
      const participantId = record.id;
      const challengeId = record.challenges.id;

      console.log('records', records);
      // 해당 참가자의 피드백 찾기
      const feedback = feedbackCounts.find(
        (count) =>
          count.participantId === participantId &&
          count.challengeId === challengeId
      );

      if (!groupedData.has(participantId)) {
        groupedData.set(participantId, {
          participant: record,
          recordDates: record.daily_records.map((dr) => dr.record_date),
          recordArray: [],
          feedbackRatio: feedback?.feedbackRatio || null,
        });
      }
    });

    // recordArray 계산 추가
    groupedData.forEach((value) => {
      value.recordArray = getRecordArray(
        value.participant.challenges.start_date,
        value.participant.challenges.end_date,
        value.recordDates
      );
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
                {data.participant.users.display_name}
              </td>
              <td className="p-[1rem]">{data.participant.users.name}</td>
              <td className="p-[1rem]">
                <input type="text" placeholder="코치메모" />
              </td>
              <td className="p-[1rem]">
                {data.feedbackRatio ? (
                  <span className="font-medium">
                    {data.feedbackRatio.formatted}
                  </span>
                ) : (
                  '0/0'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
