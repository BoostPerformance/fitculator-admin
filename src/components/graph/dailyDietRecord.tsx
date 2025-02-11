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
      <div className="lg:grid lg:grid-cols-6 md:gap-[1rem]">
        <div className="lg:col-span-1"></div>
        <div className="lg:col-span-2">
          <div className="flex items-center justify-center lg:gap-auto md:gap-3">
            {days.map((day, idx) => (
              <div
                key={idx}
                className="text-center text-gray-500 text-0.7-500 lg:pl-[0.8rem]"
              >
                {day}
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-2 lg:block md:hidden sm:hidden text-center text-gray-500 text-0.7-500">
          총 업로드 현황
        </div>
      </div>

      <div className="grid grid-cols-6 gap-5">
        {activities.map((activity: any, index: number) => {
          const weekDates = getWeekDates(activity.challenges.start_date);
          return (
            <React.Fragment key={index}>
              {/* Names Column */}
              <div className="lg:col-span-1 flex flex-col items-start pr-4 md:pr-0">
                <div className="text-gray-700 text-0.625-500">
                  {activity.users.name}
                </div>
              </div>

              {/* Desktop View - Grid Based Progress */}
              <div className="lg:flex lg:col-span-2 md:hidden sm:hidden">
                <div className="grid grid-cols-7 gap-4 w-full">
                  {weekDates.map((date, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className={`w-[1rem] h-[1rem] rounded-[0.2rem]
                        ${
                          hasRecordForDate(activity.daily_records, date)
                            ? 'bg-[#FAAA16]'
                            : 'bg-gray-100'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile/Tablet View - Dots and Single Progress Bar */}
              <div className="lg:hidden md:col-span-4 sm:col-span-5">
                {/* Dots Row */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekDates.map((date, idx) => (
                    <div key={idx} className="flex justify-center">
                      <div
                        className={`w-[1rem] h-[1rem] rounded-[0.1rem]
                        ${
                          hasRecordForDate(activity.daily_records, date)
                            ? 'bg-[#FAAA16]'
                            : 'bg-gray-100'
                        }`}
                      />
                    </div>
                  ))}
                </div>
                {/* Single Progress Bar */}
                <div className="w-full h-3 bg-gray-100 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${
                        (activity.daily_records.length / weekDates.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Desktop Progress Bar Column */}
              <div className="lg:block md:hidden sm:hidden col-span-2">
                <div className="w-full h-3 bg-gray-100 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${
                        (activity.daily_records.length / weekDates.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Total Records Column */}
              <div className="col-span-1 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3 h-3 text-white"
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
                  <span className="text-gray-600 lg:text-0.875-500 md:text-0.875-500">
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
