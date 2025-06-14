import React, { useEffect, useState } from 'react';
import { ChallengeParticipant } from '@/types/userPageTypes';

const days = ['월', '화', '수', '목', '금', '토', '일'];

interface WorkoutRecord {
  user: {
    id: string;
    name: string;
  };
  challenge: {
    start_date: string;
    end_date: string;
  };
  weekDates: {
    date: string;
    hasWorkout: boolean;
  }[];
  totalWorkouts: number;
}

const DailyWorkoutRecord = ({
  activities,
}: {
  activities: ChallengeParticipant[];
}) => {
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkoutRecords = async () => {
      try {
        const challengeId = activities[0]?.challenges?.id;
        if (!challengeId) return;

        const response = await fetch(
          `/api/workouts?type=daily-records&challengeId=${challengeId}`
        );
        if (!response.ok) throw new Error('Failed to fetch workout records');

        const data = await response.json();
        setWorkoutRecords(data);
      } catch (error) {
        console.error('Error fetching workout records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutRecords();
  }, [activities]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-3 col-span-2 h-[36rem] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-3 col-span-2 overflow-y-auto h-[36rem] [&::-webkit-scrollbar]:!hidden [scrollbar-width:none] shadow-[0_0_12px_0_rgba(121,120,132,0.15)] ">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-gray-5 text-[#6F6F6F] pt-4 pl-1">
          일별 운동 기록 현황
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
        {workoutRecords
          .sort((a, b) => b.totalWorkouts - a.totalWorkouts)
          .map((record, index) => (
            <div key={index} className="grid grid-cols-6 items-center">
              {/* 사용자 이름 */}
              <div className="col-span-1">
                <span className="text-gray-700 text-0.625-500">
                  {record.user.name.split(' ')[0]}
                </span>
              </div>

              {/* 기록 네모칸들 */}
              <div className="col-span-3">
                <div className="grid grid-cols-7 gap-1">
                  {record.weekDates.map((weekDate, idx) => (
                    <div key={idx} className="flex justify-center">
                      <div
                        className={`w-[1.2rem] h-[1.2rem] rounded-[0.2rem] ${
                          weekDate.hasWorkout ? 'bg-[#FAAA16]' : 'bg-gray-100'
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
                    {`${record.totalWorkouts}일`}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DailyWorkoutRecord;
