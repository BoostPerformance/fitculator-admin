import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChallengeParticipant } from '@/types/userPageTypes';

const days = ['월', '화', '수', '목', '금', '토', '일'];

interface Workout {
  id: string;
  title: string;
  timestamp: string;
  duration_minutes: number;
  points: number;
  calories: number;
  progress: number;
  workout_categories: {
    id: string;
    name_ko: string;
    name_en: string;
    type_id: string;
    workout_types: {
      id: string;
      name: string;
    };
  };
}

interface DailyWorkoutRecord {
  id: string;
  record_date: string;
  workouts: Workout[];
  feedbacks: {
    coach_feedback: string;
    created_at: string;
    id: string;
  }[];
}

interface ChallengeParticipantWithWorkouts
  extends Omit<ChallengeParticipant, 'daily_records'> {
  daily_records: DailyWorkoutRecord[];
}

const DailyWorkoutRecordMobile = ({
  activities,
}: {
  activities: ChallengeParticipantWithWorkouts[];
}) => {
  const router = useRouter();
  const params = useParams();

  // 현재 주의 월요일을 구하는 함수
  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
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
      const startDay = weekStart.getDay();
      weekStart.setDate(
        weekStart.getDate() - (startDay === 0 ? 6 : startDay - 1)
      );

      if (weekStart < start) {
        weekStart = new Date(start);
      }
    }
    // 2. 오늘이 챌린지 기간 후인 경우 - 챌린지 마지막 주를 보여줌
    else if (today > end) {
      weekStart = new Date(end);
      const endDay = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (endDay === 0 ? 6 : endDay - 1));
    }
    // 3. 오늘이 챌린지 기간 중인 경우 - 오늘이 포함된 주를 보여줌
    else {
      weekStart = getMondayOfCurrentWeek();

      if (weekStart < start) {
        weekStart = new Date(start);
      }
    }

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  // 해당 날짜에 기록이 있는지 확인하는 함수
  const hasRecordForDate = (
    date: string,
    activity: ChallengeParticipantWithWorkouts
  ) => {
    const recordDate = new Date(date);
    const today = new Date();
    const challengeStart = new Date(activity.challenges.start_date);
    const challengeEnd = new Date(activity.challenges.end_date);

    // 챌린지 기간 밖의 날짜는 false 반환
    if (recordDate < challengeStart || recordDate > challengeEnd) {
      return false;
    }

    // 미래 날짜는 false 반환
    if (recordDate > today) {
      return false;
    }

    // daily_records가 존재하는지 확인
    if (!activity.daily_records || activity.daily_records.length === 0) {
      return false;
    }

    // 해당 날짜의 daily_record를 찾음
    const dailyRecord = activity.daily_records.find((record) => {
      const recordDateStr =
        typeof record.record_date === 'string'
          ? record.record_date.split('T')[0]
          : new Date(record.record_date).toISOString().split('T')[0];
      return recordDateStr === date;
    });

    if (!dailyRecord) {
      return false;
    }

    // workouts 배열이 있는지 확인
    if (
      !dailyRecord.workouts ||
      !Array.isArray(dailyRecord.workouts) ||
      dailyRecord.workouts.length === 0
    ) {
      return false;
    }

    // workouts 배열에 유효한 운동 기록이 있는지 확인
    return dailyRecord.workouts.some(
      (workout: Workout) => workout && workout.id
    );
  };

  const calculateChallengeDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

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
    <div className="bg-white sm:p-6 md:p-6 rounded-lg p-3 lg:py-7 col-span-3 pl-8 md:flex-col md:items-center lg:hidden md:hidden sm:block shadow-[0_0_12px_0_rgba(121,120,132,0.15)]">
      <h2 className="text-xl font-medium mb-6 text-gray-600 text-left">
        일별 운동 기록 현황
      </h2>

      <div className="w-full">
        <div className="flex flex-col gap-1">
          <div className="flex items-center w-full mb-4">
            <div className="lg:w-[5rem] sm:w-16 md:w-[2rem] shrink-0 sm:hidden inline" />
            <div className="flex flex-1 items-start sm:pl-[2rem] sm:gap-[4rem] lg:gap-[3rem]">
              <div className="flex gap-1 sm:pl-[1rem] sm:gap-[0.6rem]">
                {days.map((day, idx) => (
                  <div key={idx} className="w-6 text-center text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="text-gray-500 sm:hidden">총 업로드</div>
            </div>
          </div>

          {activities
            .sort((a, b) => b.daily_records.length - a.daily_records.length)
            .map((activity, index) => {
              const weekDates = getWeekDates(
                activity.challenges.start_date,
                activity.challenges.end_date
              );
              const challengeDays = calculateChallengeDays(
                activity.challenges.start_date,
                activity.challenges.end_date
              );

              return (
                <div
                  key={index}
                  className="flex lg:justify-start sm:justify-center w-full pb-8 sm:items-start sm:gap-2"
                >
                  <div className="w-[5rem] sm:w-[3rem]">
                    <span className="text-gray-700 sm:text-0.75-500 md:text-0.75-500">
                      {activity.users.name.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex items-start gap-[2rem] sm:gap-3 sm:w-[17rem] md:gap-2">
                    <div>
                      <div className="flex lg:items-center sm:flex-col lg:gap-[3rem] md:gap-[2rem]">
                        <div className="flex gap-1 sm:gap-2 md:gap-[1rem]">
                          {weekDates.map((date, idx) => {
                            const hasRecord = hasRecordForDate(date, activity);
                            return (
                              <div
                                key={idx}
                                className={`w-[1.25rem] h-[1.25rem] rounded flex items-center justify-center
                                ${hasRecord ? 'bg-[#FAAA16]' : 'bg-gray-100'}`}
                              />
                            );
                          })}
                        </div>

                        <div className="pt-[1rem]">
                          <div className="w-full h-3 bg-gray-100 rounded-full relative overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-orange-500 rounded-full"
                              style={{
                                width: `${
                                  (activity.daily_records.length /
                                    challengeDays) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
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
                        {`${activity.daily_records.length}일`}
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

export default DailyWorkoutRecordMobile;
