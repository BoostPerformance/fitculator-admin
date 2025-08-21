import React, { useEffect, useState } from 'react';
import { ChallengeParticipant } from '@/types/userPageTypes';
import { logger, handleApiError } from '@/utils/logger';

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
        if (!challengeId) {
          logger.warn('DailyWorkoutRecord: challengeId가 비어있습니다', { activities });
          setWorkoutRecords([]);
          return;
        }

        const apiUrl = `/api/workouts?type=daily-records&challengeId=${challengeId}`;
        logger.api('DailyWorkoutRecord API 호출:', apiUrl);
        
        const startTime = Date.now();
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch workout records: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        logger.perf('DailyWorkoutRecord API 응답', startTime);
        logger.data('DailyWorkoutRecord 데이터 수신:', Array.isArray(data) ? `${data.length}개 기록` : 'Invalid data');
        
        // 디버깅: 받은 데이터 구조 확인
        // console.log('일별 운동 기록 API 응답 데이터:', data);
        // if (data && data.length > 0) {
        //   console.log('첫 번째 사용자 데이터 예시:', {
        //     사용자: data[0].user,
        //     챌린지_기간: data[0].challenge,
        //     주간_날짜: data[0].weekDates,
        //     총_운동일수: data[0].totalWorkouts,
        //     날짜_기준: '서버에서 결정됨'
        //   });
          
        //   // 각 사용자의 운동 일수 계산 확인
        //   data.forEach((record: WorkoutRecord, idx: number) => {
        //     const workoutDays = record.weekDates.filter(d => d.hasWorkout).length;
        //     console.log(`[사용자 ${idx + 1}] ${record.user.name}:`, {
        //       weekDates_배열_길이: record.weekDates.length,
        //       hasWorkout_true_개수: workoutDays,
        //       totalWorkouts_서버값: record.totalWorkouts,
        //       일치여부: workoutDays === record.totalWorkouts ? '✅ 일치' : `❌ 불일치 (${workoutDays} vs ${record.totalWorkouts})`
        //     });
        //   });
        // }
        
        setWorkoutRecords(data || []);
      } catch (error) {
        handleApiError(error, 'DailyWorkoutRecord');
        setWorkoutRecords([]);
      } finally {
        setLoading(false);
      }
    };

    if (activities && activities.length > 0) {
      fetchWorkoutRecords();
    } else {
      logger.warn('DailyWorkoutRecord: activities가 비어있습니다');
      setLoading(false);
    }
  }, [activities]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-3 col-span-2 h-[36rem] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!workoutRecords || workoutRecords.length === 0) {
    return (
      <div className="bg-white rounded-lg p-3 col-span-2 h-[36rem] flex items-center justify-center shadow-[0_0_12px_0_rgba(121,120,132,0.15)]">
        <div className="text-center">
          <div className="text-gray-500 mb-2">일별 운동 기록 현황</div>
          <div className="text-gray-400 text-sm">운동 기록이 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 col-span-2 overflow-y-auto h-[36rem] [&::-webkit-scrollbar]:!hidden [scrollbar-width:none] shadow-[0_0_12px_0_rgba(121,120,132,0.15)] ">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-gray-5 text-[#6F6F6F] pt-3">
          일별 운동 기록 현황
        </h2>
      </div>
      {/* 헤더 부분 */}
      <div className="grid grid-cols-12 mb-4">
        {/* 이름 열 공간 */}
        <div className="col-span-3"></div>
        {/* 요일 표시 영역 */}
        <div className="col-span-7">
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
        {/* 전체 현황 헤더 */}
        <div className="col-span-2 flex justify-end pr-2 text-gray-500 lg:text-0.75-500 md:text-0.875-500 sm:text-0.875-500 pt-[1rem]">
          전체
        </div>
      </div>

      {/* 사용자별 기록 */}
      <div className="space-y-6">
        {workoutRecords
          .sort((a, b) => b.totalWorkouts - a.totalWorkouts)
          .map((record, index) => (
            <div key={index} className="grid grid-cols-12 items-center">
              {/* 사용자 이름 */}
              <div className="col-span-3 px-1">
                <span className="text-gray-700 text-[12px]">
                  {record.user.name.split(' ')[0]}
                </span>
              </div>

              {/* 기록 네모칸들 */}
              <div className="col-span-7">
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
              <div className="col-span-2 flex justify-end pr-2">
                <div className="flex items-center gap-2">
                  {/* <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
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
                  </div> */}
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
