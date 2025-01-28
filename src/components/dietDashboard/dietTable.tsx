import { useState, useEffect } from 'react';
//import { CombinedData } from '@/types/dietTypes';
//import { useRouter } from 'next/navigation';
import Image from 'next/image';
//import DietTableMockData from '../mock/DietTableMockData';
//import { ActivityStatus } from '@/types/dietTypes';

// interface ChallengeParticipants {
//   challenge_participants: {
//     users: {
//       display_name: string;
//       name: string;
//     };
//     challenges: {
//       start_date: string;
//       end_date: string;
//     };
//   };
// }

// interface DietTableItems {
//   record_date: string;
//   challenge_participants: ChallengeParticipants;
//   coach_memo?: string;
//   feedback_counts?: number | null;
// }

// interface DietTableProps {
//   data?: DietTableItems[];
// }
interface DailyRecord {
  record_date: string;
  challenge_participants: {
    id: string;
    users: {
      id: string;
      display_name: string;
      name: string;
    };
    challenges: {
      start_date: string;
      end_date: string;
    };
  };
  coach_memo?: string;
  feedback_counts?: number;
}

interface DietTableProps {
  dailyRecordsData: DailyRecord[];
}

const DietTable: React.FC<DietTableProps> = ({ dailyRecordsData }) => {
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

  // 배열을 7개씩 그룹화하는 함수
  const chunkArray = (array: number[], size: number) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

  const renderDotsFromArray = (recordArray: number[]) => {
    // 7개씩 그룹화
    const chunkedArray = chunkArray(recordArray, 10);

    return (
      <div className="flex flex-col gap-1 sm:w-full">
        {chunkedArray.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1">
            {week.map((value, dayIndex) => (
              <div key={`${weekIndex}-${dayIndex}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  className="min-w-[12px]"
                >
                  <circle
                    cx="6"
                    cy="6"
                    r="6"
                    fill={value === 1 ? '#26CBFF' : '#D9D9D9'}
                  />
                </svg>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const participants = (records: DailyRecord[]) => {
    if (!records || !Array.isArray(records)) {
      return [];
    }

    const groupedData = new Map();

    records.forEach((record) => {
      if (!record?.challenge_participants?.users?.id) {
        return;
      }

      const participantId = record.challenge_participants.users.id;

      if (!groupedData.has(participantId)) {
        groupedData.set(participantId, {
          participant: record.challenge_participants,
          recordDates: [],
          recordArray: [],
        });
      }

      groupedData.get(participantId).recordDates.push(record.record_date);
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
              <td className="p-[1rem] ">
                {data.participant.users.display_name}
              </td>
              <td className="p-[1rem]">{data.participant.users.name}</td>

              <td className="p-[1rem]">코치메모</td>
              <td className="p-[1rem]">feedback_counts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
