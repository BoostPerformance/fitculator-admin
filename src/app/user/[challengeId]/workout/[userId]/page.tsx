'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import TextBox from '@/components/textBox';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import WeeklyWorkoutChart from '@/components/workoutDashboard/weeklyWorkoutChart';
import { useWorkoutData } from '@/components/hooks/useWorkoutData';
import { WorkoutTypes, DailyWorkout } from '@/types/workoutDetailPageType';

const generateDonutChart = (
  workoutTypes: WorkoutTypes,
  showAsEmpty = false,
  totalPoints: number
) => {
  const total = Object.values(workoutTypes).reduce(
    (sum, value) => sum + value,
    0
  );
  const circumference = 283;

  if (total === 0 || showAsEmpty || totalPoints === 0) {
    return (
      <div className="relative w-full flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
        <svg className="w-45 h-45" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth="23"
          />
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="bold"
          >
            0%
          </text>
        </svg>
        <p className="mt-4">운동 기록이 등록되면 여기에 표시됩니다.</p>
      </div>
    );
  }

  const colors: Record<string, string> = {
    달리기: '#80FBD0',
    HIIT: '#26CBFF',
    테니스: '#4CAF50',
    등산: '#795548',
    사이클: '#FF9800',
    수영: '#03A9F4',
    크로스핏: '#9C27B0',
    걷기: '#7BA5FF',
    기타: '#607D8F',
  };

  const filledLength = Math.min(
    (totalPoints / 100) * circumference,
    circumference
  ); // 100 기준 max

  let offset = 0;

  const segmentInfo = Object.entries(workoutTypes).map(
    ([type, value], index) => {
      const ratio = value / total; // 각 항목이 전체 중 차지하는 비율
      const segmentLength = ratio * filledLength;
      const dashoffset = circumference - offset - segmentLength;
      const rotation = (offset / circumference) * 360;
      offset += segmentLength;

      return {
        type,
        percentage: ratio * 100, // 텍스트로 표시될 값
        color: colors[type] || `hsl(${index * 60}, 70%, 60%)`,
        dashoffset,
        arcLength: segmentLength,
        rotation,
      };
    }
  );

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-center">
        <svg className="w-45 h-45" viewBox="0 0 100 100">
          {/* 회색 백그라운드 */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth="23"
          />
          {/* 실제 채워진 부분 */}
          {segmentInfo.map((segment, index) => (
            <circle
              key={`circle-${index}`}
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke={segment.color}
              strokeWidth="23"
              strokeDasharray={`${segment.arcLength} ${circumference}`}
              strokeDashoffset={segment.dashoffset}
              transform={`rotate(${segment.rotation} 50 50)`}
            />
          ))}
          {/* 중앙 텍스트 */}
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="bold"
          >
            {totalPoints.toFixed(1)}%
          </text>
        </svg>
      </div>
      <div className="flex flex-wrap justify-around text-xs mt-2">
        {segmentInfo.map((segment, index) => (
          <div key={index} className="flex items-center my-1">
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: segment.color }}
            ></div>
            <div>
              {segment.type}
              <br />
              {segment.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const generateBarChart = (
  dailyWorkouts: DailyWorkout[],
  showAsEmpty = false
): JSX.Element => {
  if (dailyWorkouts.length === 0 || showAsEmpty) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-400 text-sm">
        운동 기록이 등록되면 여기에 표시됩니다.
      </div>
    );
  }

  const maxValue = 100;
  const statusColors: Record<string, string> = {
    complete: 'bg-[#26CBFF]',
    incomplete: 'bg-[#FF1469]',
    rest: 'bg-gray-300',
  };

  return (
    <div className="relative h-64 w-full">
      {/* Y축 눈금 */}
      <div className="absolute left-0 h-[90%] flex flex-col justify-between text-gray-500 text-xs">
        <div>100</div>
        <div>50</div>
        <div>0</div>
      </div>

      {/* 바 차트 */}
      <div className="absolute left-8 right-0 h-[90%] flex items-end justify-between">
        {dailyWorkouts.map((day, index) => {
          const barHeight = (day.value / maxValue) * 100;

          return (
            <div
              key={index}
              className="flex flex-col items-center h-full relative group"
            >
              <div className="flex flex-col items-center w-10 h-full justify-end relative">
                {/* bar 자체 */}
                <div
                  className={`relative w-full ${
                    statusColors[day.status] || 'bg-gray-300'
                  }`}
                  style={{
                    height: `${barHeight}%`,
                    minHeight: '2px',
                    borderRadius: '4px 4px 0 0',
                  }}
                >
                  {/* 덤벨 - bar 위에 띄우기 */}
                  {day.strengthCount > 0 && (
                    <div
                      className="absolute bottom-full mb-1 flex flex-col items-center gap-1 pl-3"
                      style={{
                        transform: `translateY(-${
                          (day.value / maxValue) * 100
                        }%)`,
                      }}
                    >
                      {Array.from({ length: day.strengthCount }).map((_, i) => (
                        <div key={i} className="w-5 h-5">
                          <Image
                            src="/svg/dumbell.svg"
                            width={20}
                            height={20}
                            alt="근력운동"
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 툴팁 - bar 바깥으로 빼기 */}
                  <div className="absolute bottom-0 mb-2 px-[0.5rem] py-[0.1rem] text-0.625-500 text-white bg-black rounded opacity-0 group-hover:opacity-50 transition-opacity z-10">
                    {typeof day.value === 'number'
                      ? day.value.toFixed(1)
                      : '0.0'}
                    p
                  </div>
                </div>
              </div>

              {/* 요일 */}
              <div className="text-xs text-gray-500 mt-2 absolute -bottom-6 left-0 right-0 text-center">
                {day.day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const useUserInfo = (userId: string) => {
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user?userId=${userId}`);
        if (!res.ok) throw new Error('유저 정보 로딩 실패');
        const data = await res.json();
        setName(data.name || '알 수 없음');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserInfo();
  }, [userId]);

  return { name, loading, error };
};

// NOTE: Removed early return for no data and instead fallback handled in generateDonutChart and generateBarChart

export default function UserWorkoutDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const challengeId = params.challengeId as string;
  const router = useRouter();

  const {
    userData,
    loading,
    error: apiError,
    totalPoints,
  } = useWorkoutData(userId, challengeId);
  const { name: fetchedUserName } = useUserInfo(userId);

  const { currentWeekIndex, lastWeekIndex } = useMemo(() => {
    if (!userData || !userData.weeklyWorkouts.length)
      return { currentWeekIndex: 0, lastWeekIndex: 0 };
    const today = new Date();
    let currentIdx = 0;
    let lastIdx = Math.max(0, userData.weeklyWorkouts.length - 2);

    userData.weeklyWorkouts.forEach((week, idx) => {
      const dateParts = week.label.split('-');
      if (dateParts.length === 2) {
        const endDateParts = dateParts[1].split('.');
        if (endDateParts.length === 2) {
          const endMonth = parseInt(endDateParts[0]);
          const endDay = parseInt(endDateParts[1]);
          const weekEndDate = new Date(
            today.getFullYear(),
            endMonth - 1,
            endDay
          );
          if (today <= weekEndDate) {
            currentIdx = idx;
            lastIdx = Math.max(0, idx - 1);
          }
        }
      }
    });
    if (userData.weeklyWorkouts.length === 1) currentIdx = lastIdx = 0;
    return { currentWeekIndex: currentIdx, lastWeekIndex: lastIdx };
  }, [userData]);

  const isFirstWeek = currentWeekIndex === lastWeekIndex;

  const handleBack = () => router.push(`/user/${params.challengeId}/workout`);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  if (apiError)
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded my-4">
        <h2 className="font-bold">데이터 로딩 오류</h2>
        <p>{apiError}</p>
      </div>
    );
  if (!userData)
    return <div>사용자 데이터를 불러오는 중 오류가 발생했습니다.</div>;

  // const lastWeekData = userData.weeklyWorkouts?.[lastWeekIndex] || {
  //   label: '데이터 없음',
  //   workoutTypes: {},
  //   dailyWorkouts: [],
  //   feedback: {
  //     text: '피드백이 아직 없습니다.',
  //     author: 'AI 코치',
  //     date: new Date().toISOString(),
  //   },
  //   totalSessions: 0,
  //   requiredSessions: 3,
  // };
  const currentWeekData = userData.weeklyWorkouts?.[currentWeekIndex] || {
    label: '데이터 없음',
    workoutTypes: {},
    dailyWorkouts: [],
    feedback: {
      text: '피드백이 아직 없습니다.',
      author: 'AI 코치',
      date: new Date().toISOString(),
    },
    totalSessions: 0,
    requiredSessions: 3,
  };

  //console.log('currentWeekData.dailyWorkouts', currentWeekData.dailyWorkouts);

  return (
    <div className="flex w-full p-4">
      <div className="w-full md:w-4/6 mr-2 flex flex-col gap-5">
        <div className="font-bold mb-1">
          {fetchedUserName || userData.name} 님의 운동현황
        </div>
        <div className="w-1/3 sm:w-full">
          <TotalFeedbackCounts
            counts={`${totalPoints}pt`}
            title="총 운동포인트"
            borderColor="border-blue-500"
            textColor="text-blue-500"
          />
        </div>
        <div className="font-bold mb-4">주간운동 그래프</div>
        <div>
          <WeeklyWorkoutChart
            userName={userData.name}
            weeklyWorkouts={userData.weeklyWorkouts}
            userId={userId}
          />

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="font-bold mb-4">
              이번 주 운동 그래프 ({currentWeekData.label})
            </div>
            <div className="flex gap-6 mb-6 sm:flex-col sm:gap-6">
              <div className="flex flex-col items-center w-1/3 sm:w-full">
                <div className="relative w-full">
                  {generateDonutChart(
                    currentWeekData.workoutTypes,
                    false,
                    totalPoints // ← 이걸 넣어줘야 채워지는 양이 이 기준으로 됨
                  )}
                </div>
                <div className="flex justify-between text-sm mt-4 w-full bg-gray-8 px-[1.875rem] py-[1.25rem]">
                  <div className="text-gray-500">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5">
                    {currentWeekData.totalSessions || 0}
                    <span className="text-1.75-900">
                      /{currentWeekData.requiredSessions || 0} 회
                    </span>
                  </div>
                </div>
                <button
                  className="pt-[6rem] text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:px-[2rem] sm:hidden lg:block md:block"
                  onClick={handleBack}
                >
                  ← 목록으로
                </button>
              </div>
              <div className="flex flex-col w-2/3 sm:w-full sm:items-start ">
                <div className="flex items-end mb-4">
                  {generateBarChart(currentWeekData.dailyWorkouts)}
                </div>
                <div>
                  <TextBox
                    title="코치 피드백"
                    value={
                      currentWeekData.feedback?.text ||
                      '피드백이 아직 없습니다.'
                    }
                    placeholder="피드백을 작성하세요."
                    button1="남기기"
                    Btn1className="bg-green text-white"
                    svg1="/svg/send.svg"
                    onChange={(e) => console.log(e.target.value)}
                    onSave={async (feedback) => {
                      console.log('Saved:', feedback);
                    }}
                    isFeedbackMode={true}
                    copyIcon
                  />
                </div>
                <button
                  className="pt-[6rem] text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:px-[2rem] sm:block lg:hidden md:hidden"
                  onClick={handleBack}
                >
                  ← 목록으로
                </button>
              </div>
            </div>
          </div>
          {/* <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
            <div className="font-bold mb-4">
              지난 주 운동 그래프 ({lastWeekData?.label || '데이터 없음'})
            </div>
            <div className="flex mb-6 sm:flex-col">
              <div className="flex flex-col w-1/3 sm:w-full sm:gap-6">
                <div className="relative">
                  {generateDonutChart(
                    lastWeekData.workoutTypes || {},
                    isFirstWeek
                  )}
                </div>
                <div className="flex justify-between text-sm mt-4 bg-gray-8 px-[1.875rem] py-[1.25rem]">
                  <div className="text-gray-500">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5">
                    {isFirstWeek ? 0 : lastWeekData.totalSessions || 0}
                    <span className="text-1.75-900">
                      /
                      {isFirstWeek
                        ? lastWeekData.requiredSessions || 0
                        : lastWeekData.requiredSessions || 0}{' '}
                      회
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-2/3 flex items-end pl-6 sm:w-full">
                {generateBarChart(lastWeekData.dailyWorkouts, isFirstWeek)}
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
