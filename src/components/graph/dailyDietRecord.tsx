import React from 'react';

const days = ['월', '화', '수', '목', '금', '토', '일'];
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

const DailyDietRecord = ({ activities }: any) => {
  const getWeekDates = (startDate: string) => {
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const hasRecordForDate = (records: DailyRecord[], date: string) => {
    return records.some((record) => record.record_date === date);
  };

  return (
    <div className="bg-white rounded-lg p-3 grid grid-cols-5 gap-4 col-span-2">
      {/* Header Row */}
      <div className="col-span-1 text-gray-500 text-right pr-4">참가자</div>
      <div className="col-span-3 grid grid-cols-7 gap-2">
        {days.map((day, idx) => (
          <div key={idx} className="text-center text-gray-500">
            {day}
          </div>
        ))}
      </div>
      <div className="col-span-1 text-center text-gray-500">총 기록</div>

      {/* Activity Rows */}
      {activities.map((activity: any, index: number) => {
        const weekDates = getWeekDates(activity.challenges.start_date);
        return (
          <React.Fragment key={index}>
            {/* Names Column */}
            <div className="col-span-1 flex flex-col items-end pr-4">
              <div className="text-gray-700 mb-4">{activity.users.name}</div>
            </div>

            {/* Daily Records Column */}
            <div className="col-span-3 grid grid-cols-7 gap-2">
              {weekDates.map((date, idx) => {
                const hasRecord = hasRecordForDate(
                  activity.daily_records,
                  date
                );
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={`w-[2rem] h-[2rem] rounded flex items-center justify-center
                      ${hasRecord ? 'bg-[#FAAA16]' : 'bg-gray-100'}`}
                    />
                    {/* <div className="h-3 mt-2 bg-orange-500 rounded-full w-full" /> */}
                  </div>
                );
              })}
            </div>

            {/* Total Records Column */}
            <div className="col-span-1 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-gray-600">
                  {`${activity.daily_records.length}/${weekDates.length}`}
                </span>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DailyDietRecord;
