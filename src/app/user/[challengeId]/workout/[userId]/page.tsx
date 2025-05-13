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
  showAsEmpty = false
) => {
  const total = Object.values(workoutTypes).reduce(
    (sum, value) => sum + value,
    0
  );

  if (total === 0 || showAsEmpty) {
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

  let offset = 0;
  const circumference = 283;
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

  const segmentInfo = Object.entries(workoutTypes).map(
    ([type, value], index) => {
      const percentage = (value / total) * 100;
      const dashoffset = circumference * (1 - value / total);
      const startAngle = offset * 3.6;
      offset += percentage;
      const endAngle = offset * 3.6;
      const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
      const textRadius = 28;
      const textX = 50 + textRadius * Math.sin(midAngle);
      const textY = 50 - textRadius * Math.cos(midAngle);
      return {
        type,
        value,
        percentage,
        dashoffset,
        rotation: startAngle,
        textX,
        textY,
        color: colors[type] || `hsl(${index * 60}, 70%, 60%)`,
      };
    }
  );

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-center">
        <svg className="w-45 h-45" viewBox="0 0 100 100">
          {segmentInfo.map((segment, index) => (
            <circle
              key={`circle-${index}`}
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke={segment.color}
              strokeWidth="23"
              strokeDasharray={circumference}
              strokeDashoffset={segment.dashoffset}
              transform={`rotate(${segment.rotation} 50 50)`}
            />
          ))}
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="bold"
          >
            {Math.round(total)}%
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
              {Math.round(segment.percentage)}%
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
      <div className="absolute left-0 h-[90%] flex flex-col justify-between text-gray-500 text-xs">
        <div>100</div>
        <div>50</div>
        <div>0</div>
      </div>
      <div className="absolute left-8 right-0 h-[90%] flex items-end justify-between">
        {dailyWorkouts.map((day, index) => (
          <div
            key={index}
            className="flex flex-col items-center h-full relative"
          >
            <div className="h-full flex flex-col justify-end w-10 relative">
              <div className="flex flex-col-reverse items-center gap-1 relative -translate-y-full">
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
              <div
                className={`w-full ${
                  statusColors[day.status] || 'bg-gray-300'
                }`}
                style={{
                  height: `${(day.value / maxValue) * 100}%`,
                  minHeight: '2px',
                  borderRadius: '4px 4px 0 0',
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2 absolute -bottom-6 left-0 right-0 text-center">
              {day.day}
            </div>
          </div>
        ))}
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

  const lastWeekData = userData.weeklyWorkouts?.[lastWeekIndex] || {
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
          <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
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
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="font-bold mb-4">
              이번 주 운동 그래프 ({currentWeekData.label})
            </div>
            <div className="flex gap-6 mb-6 sm:flex-col sm:gap-6">
              <div className="flex flex-col items-center w-1/3 sm:w-full">
                <div className="relative w-full">
                  {generateDonutChart(currentWeekData.workoutTypes)}
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
                  className="pt-[6rem] text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:px-[2rem]"
                  onClick={handleBack}
                >
                  ← 목록으로
                </button>
              </div>
              <div className="flex flex-col w-2/3 sm:w-full sm:items-center">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
