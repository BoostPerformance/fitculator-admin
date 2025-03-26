import React from 'react';
import { ChallengeParticipant } from '@/types/userPageTypes';

const days = ['월', '화', '수', '목', '금', '토', '일'];

const DailyDietRecord = ({
  activities,
}: {
  activities: ChallengeParticipant[];
}) => {
  //console.log('DailyDietRecord activities:', activities);
  // 현재 주의 월요일을 구하는 함수
  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0은 일요일, 1은 월요일, ..., 6은 토요일
    // 일요일이 0이므로, 월요일부터 시작하도록 조정
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(today.setDate(diff));
  };

  // 보여줄 주의 날짜들을 구하는 함수
  const getWeekDates = (
    challengeStartDate: string,
    challengeEndDate: string
  ) => {
    const start = new Date(challengeStartDate);
    const end = new Date(challengeEndDate);
    const today = new Date();
    let weekStart;

    // 1. 오늘이 챌린지 기간 전인 경우 - 챌린지 첫 주를 보여줌
    if (today < start) {
      weekStart = new Date(start);
      // 챌린지 시작일의 요일에 따라 해당 주의 월요일을 찾음
      const startDay = weekStart.getDay();
      weekStart.setDate(
        weekStart.getDate() - (startDay === 0 ? 6 : startDay - 1)
      );

      // 만약 계산된 월요일이 챌린지 시작일보다 이전이면, 챌린지 시작일을 사용
      if (weekStart < start) {
        weekStart = new Date(start);
      }
    }
    // 2. 오늘이 챌린지 기간 후인 경우 - 챌린지 마지막 주를 보여줌
    else if (today > end) {
      // 마지막 주의 월요일을 구함
      weekStart = new Date(end);
      const endDay = weekStart.getDay();
      // 해당 주의 월요일로 이동
      weekStart.setDate(weekStart.getDate() - (endDay === 0 ? 6 : endDay - 1));
    }
    // 3. 오늘이 챌린지 기간 중인 경우 - 오늘이 포함된 주를 보여줌
    else {
      weekStart = getMondayOfCurrentWeek();

      // 만약 계산된 월요일이 챌린지 시작일보다 이전이면, 챌린지 시작일을 사용
      if (weekStart < start) {
        weekStart = new Date(start);
      }
    }

    // 선택된 주의 7일을 배열로 반환
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  // 해당 날짜에 기록이 있는지 확인하는 함수 (디버깅 로그 추가)
  const hasRecordForDate = (date: string, activity: ChallengeParticipant) => {
    // 사용자 이름 가져오기 (디버깅용)
    const userName = activity.users.name;

    // 날짜가 챌린지 기간을 벗어났는지 확인
    const recordDate = new Date(date);
    const today = new Date();
    const challengeStart = new Date(activity.challenges.start_date);
    const challengeEnd = new Date(activity.challenges.end_date);

    // console.log(
    //   `[${userName}] 날짜 확인: ${date}, 챌린지 기간: ${
    //     challengeStart.toISOString().split('T')[0]
    //   } ~ ${challengeEnd.toISOString().split('T')[0]}`
    // );

    // 챌린지 기간 밖의 날짜는 항상 false 반환 (시작일 이전이거나 종료일 이후)
    if (recordDate < challengeStart || recordDate > challengeEnd) {
      // console.log(`[${userName}] ${date} - 챌린지 기간 밖 (false 반환)`);
      return false;
    }

    // 미래 날짜는 false 반환
    if (recordDate > today) {
      // console.log(`[${userName}] ${date} - 미래 날짜 (false 반환)`);
      return false;
    }

    // daily_records가 존재하는지 확인
    if (!activity.daily_records || activity.daily_records.length === 0) {
      // console.log(`[${userName}] ${date} - daily_records 없음 (false 반환)`);
      return false;
    }

    // console.log(
    //   `[${userName}] ${date} - daily_records 길이: ${activity.daily_records.length}`
    // );

    // 모든 daily_records의 날짜 출력 (데이터 확인용)
    const allDates = activity.daily_records.map((record) => {
      const recordDateStr =
        typeof record.record_date === 'string'
          ? record.record_date.split('T')[0]
          : new Date(record.record_date).toISOString().split('T')[0];
      return recordDateStr;
    });

    //  console.log(`[${userName}] 모든 기록 날짜:`, allDates);

    // 해당 날짜의 daily_record를 찾음
    const dailyRecord = activity.daily_records.find((record) => {
      // record.record_date가 문자열이든 Date 객체든 처리할 수 있도록 함
      const recordDateStr =
        typeof record.record_date === 'string'
          ? record.record_date.split('T')[0]
          : new Date(record.record_date).toISOString().split('T')[0];

      return recordDateStr === date;
    });

    if (!dailyRecord) {
      //  console.log(`[${userName}] ${date} - 해당 날짜의 기록 없음 (false 반환)`);
      return false;
    }

    // daily_record가 있고, meals 배열이 있는지 확인
    if (
      !dailyRecord.meals ||
      !Array.isArray(dailyRecord.meals) ||
      dailyRecord.meals.length === 0
    ) {
      // console.log(
      //   `[${userName}] ${date} - meals 데이터 없음 (false 반환), dailyRecord:`,
      //   dailyRecord
      // );
      return false;
    }

    // meals 정보 자세히 출력
    //  console.log(`[${userName}] ${date} - meals 데이터:`, dailyRecord.meals);

    // meals 배열에 description이 있는 항목이 하나라도 있는지 확인
    const hasMealWithDescription = dailyRecord.meals.some(
      (meal) => meal.description && meal.description.trim() !== ''
    );

    // console.log(
    //   `[${userName}] ${date} - 결과: ${
    //     hasMealWithDescription ? '기록 있음 (true)' : '유효한 기록 없음 (false)'
    //   }`
    // );
    return hasMealWithDescription;
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
