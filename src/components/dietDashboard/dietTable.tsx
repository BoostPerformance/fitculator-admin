import { useState, useEffect } from 'react';
//import { CombinedData } from '@/types/dietTypes';
//import { useRouter } from 'next/navigation';
//import Image from 'next/image';
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

// const sortData = (
//   data: CombinedData[],
//   sortBy: string,
//   sortDirection: boolean
// ) => {
//   return [...data].sort((a, b) => {
//     if (sortBy === 'name') {
//       return a.name.localeCompare(b.name, 'ko') * (sortDirection ? 1 : -1);
//     }
//      else if (sortBy === 'id') {
//       return (parseInt(a.id) - parseInt(b.id)) * (sortDirection ? 1 : -1);
//     } else if (sortBy === 'updateTime') {
//       return (
//         a.updateTime.localeCompare(b.updateTime) * (sortDirection ? 1 : -1)
//       );
//     }
//     return 0;
//   });
// };

const DietTable: React.FC = () => {
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);

  useEffect(() => {
    const fetchDailyRecords = async () => {
      const response = await fetch('/api/challenge-participants');
      const data = await response.json();
      setDailyRecords(data);
    };
    fetchDailyRecords();
  }, []);

  const renderMealsDots = (start: string, end: string, records: string[]) => {
    const days = getDaysArray(new Date(start), new Date(end));

    return (
      <div className="flex gap-1">
        {days.map((day, index) => {
          const hasRecord = records.includes(day);
          return (
            <div key={index}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 21 20"
                fill="none"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="10"
                  transform="matrix(-1 0 0 1 20.334 0)"
                  fill={hasRecord ? '#26CBFF' : '#D9D9D9'}
                />
              </svg>
            </div>
          );
        })}
      </div>
    );
  };

  const getDaysArray = (start: Date, end: Date) => {
    const arr = [];
    for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
      arr.push(new Date(dt).toISOString().split('T')[0]);
    }
    return arr;
  };

  const participants = (records: DailyRecord[]) => {
    const groupedData = new Map();

    records.forEach((record) => {
      // console.log('Processing record:', record);
      const participantId = record.challenge_participants.users.id;

      if (!groupedData.has(participantId)) {
        groupedData.set(participantId, {
          participant: record.challenge_participants,
          recordDates: [],
        });
      }

      const result = groupedData
        .get(participantId)
        .recordDates.push(record.record_date);
    });

    return Array.from(groupedData.values());
  };

  return (
    <div className="mt-[1.4rem]">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-gray-100 text-left text-1-500 text-gray-6">
            <th className="p-[1rem]">
              <div className="relative flex items-center justify-between">
                <div>닉네임</div>
                <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300" />
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative flex justify-between items-center pr-[1rem]">
                <div>이름</div>
                <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300" />
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative flex justify-between items-center pr-[1rem]">
                <div>식단</div>
                <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300" />
              </div>
            </th>
            <th className="p-[1rem] w-[9rem]">
              <div className="relative flex justify-between items-center">
                <div>운동</div>
                <span className="absolute left-[7.9rem] h-[100%] w-[1px] bg-gray-300" />
              </div>
            </th>
            <th className="p-[1rem]">코치메모</th>
            <th className="p-[1rem]">피드백 수</th>
          </tr>
        </thead>
        <tbody>
          {participants(dailyRecords).map((data, index) => (
            <tr key={index}>
              <td>{data.participant.users.display_name}</td>
              <td>{data.participant.users.name}</td>
              <td>
                {renderMealsDots(
                  data.participant.challenges.start_date,
                  data.participant.challenges.end_date,
                  data.recordDates
                )}
              </td>
              <td className="p-[1rem]">200% /2회</td>
              <td className="p-[1rem]">코치메모</td>
              {/* <td className="p-[1rem]">{record.feedback_counts}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
