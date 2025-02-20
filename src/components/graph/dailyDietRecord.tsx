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
    <div className="bg-white rounded-lg p-3 col-span-2 overflow-y-auto h-[31.25rem]">
      {/* 헤더 부분 */}
      <div className="grid grid-cols-6 mb-4">
        {/* 이름 열 공간 */}
        <div className="col-span-1"></div>

        {/* 요일 표시 영역 */}
        <div className="col-span-4">
          <div className="grid grid-cols-7 gap-2 pt-[1rem]">
            {days.map((day, idx) => (
              <div
                key={idx}
                className="flex justify-center  text-gray-500 lg:text-0.75-500 sm:text-0.875-500"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* 총 업로드 현황 헤더 */}
        <div className="col-span-1 flex justify-center text-gray-500 lg:text-0.75-500 sm:text-0.875-500 text-center pt-[0.1rem] sm:hidden md:hidden">
          총 <br className="lg:hidden md:inlin sm:hidden" /> 업로드 <br /> 현황
        </div>
      </div>

      {/* 사용자별 기록 */}
      <div className="space-y-6">
        {activities.map((activity: any, index: number) => {
          const weekDates = getWeekDates(activity.challenges.start_date);
          return (
            <div key={index} className="grid grid-cols-6 items-center">
              {/* 사용자 이름 */}
              <div className="col-span-1">
                <span className="text-gray-700 text-0.625-500">
                  {activity.users.name}
                </span>
              </div>

              {/* 기록 네모칸들 */}
              <div className="col-span-4">
                <div className="grid grid-cols-7 gap-2">
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

                {/* 진행바 */}
                <div className="w-full h-3 bg-gray-100 rounded-full relative overflow-hidden mt-2">
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

              {/* 총 업로드 현황 카운트 */}
              <div className="col-span-1 flex justify-center">
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
                  <span className="text-gray-600 text-0.875-500">
                    {`${activity.daily_records.length}/${weekDates.length}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyDietRecord;
