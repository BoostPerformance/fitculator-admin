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

  // 해당 날짜에 기록이 있는지 확인하는 함수
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
    <div className="bg-white sm:p-6 rounded-lg p-3 lg:py-[1.7rem] col-span-3 pl-[2rem]">
      <h2 className="text-xl font-medium mb-6 text-[#6F6F6F] text-left">
        일별 식단 기록 현황
      </h2>

      <div className="sm:space-y-4  ">
        <div className="flex flex-col gap-[0.3rem] items-center justify-center">
          {/* Days of week header */}
          <div className="flex items-center w-full mb-4 pl-[5.3rem] gap-[1rem] text-gray-500">
            <div className="flex sm:gap-[0.5rem] gap-[0.3rem]">
              {days.map((day, idx) => (
                <div key={idx} className="w-6 text-center">
                  {day}
                </div>
              ))}
            </div>
            <div className="pl-[1rem]">총 업로드 현황</div>
          </div>

          {/* Activity rows */}
          {activities.map((activity: any, index: any) => {
            const weekDates = getWeekDates(activity.challenges.start_date);

            return (
              <div
                key={index}
                className="flex items-center gap-[2rem] justify-center w-full pb-[2rem]"
              >
                <div className="sm:w-[4rem] ">
                  <span className="text-gray-700">{activity.users.name}</span>
                </div>

                <div className="flex items-center">
                  <div className="flex gap-1 mr-4">
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

                  <div className="flex items-center gap-2 w-[20rem]">
                    <div
                      className="h-[0.7rem] bg-gradient-to-r bg-orange-500  rounded-full"
                      style={{ width: `100%` }}
                    />
                    <div className="flex gap-[0.4rem]">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center p-1">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-full h-full text-white"
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
