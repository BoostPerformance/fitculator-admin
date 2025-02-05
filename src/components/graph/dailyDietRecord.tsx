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

  const calculateProgress = (participant: ChallengeParticipant) => {
    const weekDates = getWeekDates(participant.challenges.start_date);
    const completedDays = participant.daily_records.length;
    const totalDays = weekDates.length;
    return {
      completed: completedDays,
      total: totalDays,
      formatted: `${completedDays}/${totalDays}`,
    };
  };

  return (
    <div className="bg-white sm:p-6 md:p-6 rounded-lg p-3 lg:py-7 col-span-3 pl-8">
      <h2 className="text-xl font-medium mb-6 text-gray-600 text-left">
        일별 식단 기록 현황
      </h2>

      <div className="lg:min-w-[48rem] sm:min-w-full md:min-w-full ">
        <div className="flex flex-col gap-1">
          {/* Days header and Upload status */}
          <div className="flex items-center w-full mb-4 ">
            <div className="lg:w-[5rem] sm:w-16 md:w-[2rem] shrink-0 sm:hidden inline" />
            <div className="flex flex-1 items-start sm:pl-[2rem] sm:gap-[4rem] lg:gap-[3rem]">
              <div className="flex gap-1 sm:pl-[1rem] sm:gap-[0.6rem]">
                {days.map((day, idx) => (
                  <div key={idx} className="w-6 text-center text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="text-gray-500 sm:hidden md:hidden">
                총 업로드 현황
              </div>
            </div>
          </div>

          {/* Activity rows */}

          {activities.map((activity: any, index: any) => {
            const weekDates = getWeekDates(activity.challenges.start_date);
            return (
              <div
                key={index}
                className="flex lg:justify-start sm:justify-center w-full pb-8 sm:items-start md:items-start md:w-[3rem] sm:gap-2 "
              >
                <div className="w-[5rem] sm:w-[3rem]">
                  <span className="text-gray-700 sm:text-0.75-500">
                    {activity.users.name}
                  </span>
                </div>

                <div className="flex items-start gap-[2rem] sm:gap-3 sm:w-[17rem]">
                  <div>
                    <div className="md:flex-col lg:items-center sm:flex-col lg:gap-[3rem] md:gap-[2rem] lg:flex">
                      <div className="flex gap-1 sm:gap-2">
                        {weekDates.map((date, idx) => {
                          const hasRecord = hasRecordForDate(
                            activity.daily_records,
                            date
                          );
                          return (
                            <div
                              key={idx}
                              className={`w-6 h-6 rounded flex items-center justify-center
                          ${hasRecord ? 'bg-[#FAAA16]' : 'bg-gray-100'}`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex flex-1 items-center gap-2 md:gap-[2rem]">
                        <div className="h-3 bg-orange-500 rounded-full w-[25rem] sm:w-[13.5rem] md:w-[8rem] sm:mt-[1rem]" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-[1rem] items-center sm:gap-2">
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
                    <span className="text-gray-600 whitespace-nowrap">
                      {`${activity.daily_records.length}/${weekDates.length}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyDietRecord;
