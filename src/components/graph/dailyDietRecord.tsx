import React from 'react';
import { ChallengeParticipant } from '@/types/userPageTypes';

const days = ['월', '화', '수', '목', '금', '토', '일'];

const DailyDietRecord = ({
  activities,
}: {
  activities: ChallengeParticipant[];
}) => {
  console.log('DailyDietRecord activities:', activities);
  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    // 일요일이 0이므로, 월요일부터 시작하도록 조정
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(today.setDate(diff));
  };

  const getWeekDates = (
    challengeStartDate: string,
    challengeEndDate: string
  ) => {
    const start = new Date(challengeStartDate);
    const end = new Date(challengeEndDate);
    const today = new Date();
    let weekStart;

    // 챌린지가 종료된 경우
    if (today > end) {
      // 마지막 주의 월요일을 구함
      weekStart = new Date(end);
      weekStart.setDate(end.getDate() - ((end.getDay() + 6) % 7));
    } else {
      // 진행 중인 경우 현재 주의 월요일
      weekStart = getMondayOfCurrentWeek();
    }

    // 챌린지 시작일 이전인 경우
    if (today < start) {
      weekStart = start;
    }

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const calculateChallengeDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    // 오늘이 종료일보다 뒤면 전체 기간을, 아니면 현재까지의 일수를 반환
    if (today > end) {
      return Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else {
      return Math.ceil(
        (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  };

  const hasRecordForDate = (date: string, activity: ChallengeParticipant) => {
    // 날짜가 챌린지 기간을 벗어났는지 확인
    const recordDate = new Date(date);
    const today = new Date();
    const challengeStart = new Date(activity.challenges.start_date);

    // 챌린지 시작일 이전이거나 미래 날짜는 false 반환
    if (recordDate < challengeStart || recordDate > today) {
      return false;
    }

    // daily_records가 존재하는지 확인
    if (!activity.daily_records) {
      return false;
    }

    // 해당 날짜의 daily_record를 찾음
    const dailyRecord = activity.daily_records.find((record) => {
      const recordDateStr = record.record_date.split('T')[0];
      return recordDateStr === date;
    });

    // daily_record가 있고, meals 배열이 있는지 확인
    if (!dailyRecord?.meals) {
      return false;
    }

    // meals 배열에 description이 있는 항목이 하나라도 있는지 확인
    return dailyRecord.meals.some(
      (meal) => meal.description && meal.description.trim() !== ''
    );
  };

  return (
    <div className="bg-white rounded-lg p-3 col-span-2 overflow-y-auto h-[36rem] [&::-webkit-scrollbar]:!hidden [scrollbar-width:none] shadow-[0_0_12px_0_rgba(121,120,132,0.15)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-gray-5 text-[#6F6F6F] pt-4 pl-1">
          일별 식단 기록 현황
        </h2>
      </div>
      {/* 헤더 부분 */}
      <div className="grid grid-cols-6 mb-4">
        {/* 이름 열 공간 */}
        <div className="col-span-1"></div>
        {/* 요일 표시 영역 */}
        <div className="col-span-3">
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
        <div className="col-span-2 flex justify-center text-gray-500 lg:text-0.75-500 md:text-0.875-500 sm:text-0.875-500 text-center pt-[1rem]">
          총 업로드
          <br className="md:inline lg:hidden" />
        </div>
      </div>

      {/* 사용자별 기록 */}
      <div className="space-y-6">
        {activities
          .sort(
            (a: any, b: any) => b.daily_records_count - a.daily_records_count
          )
          .map((activity: any, index: number) => {
            const weekDates = getWeekDates(
              activity.challenges.start_date,
              activity.challenges.end_date
            );
            const challengeDays = calculateChallengeDays(
              activity.challenges.start_date,
              activity.challenges.end_date
            );
            return (
              <div key={index} className="grid grid-cols-6 items-center">
                {/* 사용자 이름 */}
                <div className="col-span-1">
                  <span className="text-gray-700 text-0.625-500">
                    {activity.users.name.split(' ')[0]}
                  </span>
                </div>

                {/* 기록 네모칸들 */}
                <div className="col-span-3">
                  <div className="grid grid-cols-7 gap-1">
                    {weekDates.map((date, idx) => (
                      <div key={idx} className="flex justify-center">
                        <div
                          className={`w-[1.2rem] h-[1.2rem] rounded-[0.2rem]
                        ${
                          hasRecordForDate(date, activity)
                            ? 'bg-[#FAAA16]'
                            : 'bg-gray-100'
                        }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 총 업로드 현황 카운트 */}
                <div className="col-span-2 flex justify-center">
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
                      {`${activity.daily_records_count}일`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      {/* <div className="gradient-overlay absolute left-3 right-3 h-[40px] bg-gradient-to-b from-transparent to-white pointer-events-none rounded-b-lg" /> */}
    </div>
  );
};

export default DailyDietRecord;
