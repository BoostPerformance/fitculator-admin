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
    <div className="bg-white rounded-lg p-3 grid-cols-4 gap-4 col-span-2 overflow-y-auto h-[50rem] sm:hidden lg:block md:block">
      <div className="grid grid-cols-4 gap-4 ">
        {/* Header Row */}
        <div className="col-span-1 text-gray-500 text-right pr-4"></div>
        <div className="col-span-1 grid grid-cols-7 gap-1 items-start">
          {days.map((day, idx) => (
            <div key={idx} className="text-center text-gray-500 text-0.7-500">
              {day}
            </div>
          ))}
        </div>
        <div className="col-span-1 text-center text-gray-500 text-0.7-500">
          총 업로드 현황
        </div>
        <div className="col-span-1 text-center text-gray-500"></div>

        {/* Activity Rows */}
        {activities.map((activity: any, index: number) => {
          const weekDates = getWeekDates(activity.challenges.start_date);
          return (
            <React.Fragment key={index}>
              {/* Names Column */}
              <div className="col-span-1 flex flex-col items-start pr-4">
                <div className="text-gray-700 text-0.625-500">
                  {activity.users.name}
                </div>
              </div>

              {/* Daily Records Column */}
              <div className="col-span-1 grid grid-cols-7 gap-2">
                {weekDates.map((date, idx) => {
                  const hasRecord = hasRecordForDate(
                    activity.daily_records,
                    date
                  );
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-[1rem] h-[1rem] rounded flex items-center justify-center
                      ${hasRecord ? 'bg-[#FAAA16]' : 'bg-gray-100'}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar Column */}
              <div className="col-span-1 flex items-center">
                <div className="w-full h-3 bg-gray-100 rounded-full relative overflow-hidden">
                  {(() => {
                    const startDate = new Date(activity.challenges.start_date);
                    const endDate = new Date(activity.challenges.end_date);
                    const totalDays = Math.ceil(
                      (endDate.getTime() - startDate.getTime()) /
                        (1000 * 3600 * 24)
                    );
                    const recordedDays = activity.daily_records.length;

                    return (
                      <div
                        className="absolute top-0 left-0 h-full bg-orange-500 rounded-full"
                        style={{
                          width: `${(recordedDays / totalDays) * 100}%`,
                        }}
                      />
                    );
                  })()}
                </div>
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
    </div>
  );
};

export default DailyDietRecord;
