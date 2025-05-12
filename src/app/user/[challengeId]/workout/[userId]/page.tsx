'use client';
import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import TextBox from '@/components/textBox';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import WeeklyWorkoutChart from '@/components/workoutDashboard/weeklyWorkoutChart';
import { useWorkoutData } from '@/components/hooks/useWorkoutData';
// 타입 정의
interface WorkoutTypes {
  [key: string]: number;
}

interface DailyWorkout {
  day: string;
  value: number;
  status: 'complete' | 'incomplete' | 'rest';
  hasStrength: boolean;
}

interface Feedback {
  text: string;
  author: string;
  date: string;
}

interface WeeklyWorkout {
  weekNumber: number;
  label: string;
  totalAchievement: number;
  workoutTypes: WorkoutTypes;
  dailyWorkouts: DailyWorkout[];
  totalSessions: number;
  requiredSessions: number;
  feedback: Feedback;
}

// API 응답 타입
interface CoachInfo {
  id: string;
  name: string;
  profile_image_url?: string;
}

interface FeedbackData {
  id: string;
  ai_feedback?: string;
  coach_feedback?: string;
  coach_memo?: string;
  coach_id?: string;
  created_at: string;
}

interface WeeklyRecord {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  cardio_points_total: number;
  strength_sessions_count: number;
  created_at: string;
  updated_at: string;
  weekNumber?: number;
  feedback?: FeedbackData | null;
  coach?: CoachInfo | null;
}

interface UserInfo {
  id: string;
  name: string;
  displayName?: string;
}

interface ApiStats {
  totalWeeks: number;
  totalCardioPoints: number;
  totalStrengthSessions: number;
}

interface ApiResponse {
  user: UserInfo;
  weeklyRecords: WeeklyRecord[];
  stats: ApiStats;
  recentWorkouts?: any[];
}

// 도넛 차트 SVG 생성 함수
const generateDonutChart = (workoutTypes: WorkoutTypes) => {
  const total = Object.values(workoutTypes).reduce(
    (sum, value) => sum + value,
    0
  );
  let offset = 0;
  const circumference = 283; // 2 * Math.PI * 45

  // DB에 있는 카테고리만 색상 매핑
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

  // 각 세그먼트에 대한 정보 계산
  const segmentInfo = Object.entries(workoutTypes).map(
    ([type, value], index) => {
      const percentage = (value / total) * 100;
      const dashoffset = circumference * (1 - value / total);
      const startAngle = offset * 3.6; // 시작 각도 (도 단위)
      offset += percentage;
      const endAngle = offset * 3.6; // 종료 각도 (도 단위)

      // 텍스트 위치 계산 (세그먼트 중앙)
      const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180); // 라디안으로 변환
      const textRadius = 28; // 텍스트 위치의 반지름 (중심에서 텍스트까지 거리)
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
        // 색상 매핑에 없는 경우 HSL 색상으로 생성
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

          {/* 중앙 전체 퍼센티지 */}
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

      {/* 범례 */}
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

// 바 차트 SVG 생성 함수 (근력 운동은 덤벨 아이콘 사용)
interface DailyWorkout {
  day: string;
  value: number;
  status: 'complete' | 'incomplete' | 'rest';
  hasStrength: boolean;
  strengthCount: number; // 근력운동 횟수 추가
}

// 바 차트 생성 함수 수정
const generateBarChart = (dailyWorkouts: DailyWorkout[]): JSX.Element => {
  // 값 로깅 추가
  console.log(
    'Bar chart data values:',
    dailyWorkouts.map((day) => ({
      day: day.day,
      value: day.value,
      status: day.status,
      hasStrength: day.hasStrength,
      strengthCount: day.strengthCount,
    }))
  );

  // 최대값 계산 (100으로 고정)
  const maxValue = 100;

  const statusColors: Record<string, string> = {
    complete: 'bg-[#26CBFF]',
    incomplete: 'bg-[#FF1469]',
    rest: 'bg-gray-300',
  };

  return (
    <div className="relative h-64 w-full">
      {/* Y축 지표 */}
      <div className="absolute left-0 h-[90%] flex flex-col justify-between text-gray-500 text-xs">
        <div>100</div>
        <div>50</div>
        <div>0</div>
      </div>

      {/* 바 차트 컨테이너 */}
      <div className="absolute left-8 right-0 h-[90%] flex items-end justify-between">
        {dailyWorkouts.map((day, index) => (
          <div
            key={index}
            className="flex flex-col items-center h-full relative"
          >
            {/* 바 컨테이너 */}
            <div className="h-full flex flex-col justify-end w-10 relative">
              {/* 근력운동 아이콘들 - 횟수만큼 반복 */}
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

              {/* 실제 바 */}
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

            {/* 요일 텍스트 */}
            <div className="text-xs text-gray-500 mt-2 absolute -bottom-6 left-0 right-0 text-center">
              {day.day}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 운동 상세 페이지 컴포넌트
export default function UserWorkoutDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const challengeId = params.challengeId as string;
  const router = useRouter();

  const {
    userData,
    loading,
    error: apiError,
    useMockData,
    totalPoints,
  } = useWorkoutData(userId, challengeId);

  // 날짜 관련 로직을 useMemo로 계산
  const { currentWeekIndex, lastWeekIndex } = useMemo(() => {
    if (!userData || !userData.weeklyWorkouts.length) {
      return { currentWeekIndex: 0, lastWeekIndex: 0 };
    }

    const today = new Date();

    // 현재 주차와 지난 주차 인덱스 찾기
    let currentIdx = 0; // 기본값: 가장 최근 주차
    let lastIdx = Math.max(0, userData.weeklyWorkouts.length - 2); // 기본값: 마지막에서 두 번째 주차 또는 첫 번째 주차

    // 각 주차 데이터를 반복하여 현재 날짜가 포함된 주차 찾기
    userData.weeklyWorkouts.forEach((week, idx) => {
      // 주차 라벨에서 날짜 범위 추출 (MM.DD-MM.DD 형식)
      const dateParts = week.label.split('-');
      if (dateParts.length === 2) {
        const endDateParts = dateParts[1].split('.');

        if (endDateParts.length === 2) {
          // 현재 년도와 월, 일 조합
          const endMonth = parseInt(endDateParts[0]);
          const endDay = parseInt(endDateParts[1]);

          // 주차 종료일 생성 (현재 년도 사용)
          const weekEndDate = new Date(
            today.getFullYear(),
            endMonth - 1,
            endDay
          );

          // 오늘 날짜가 주차 종료일보다 이전이거나 같으면 현재 주차로 설정
          if (today <= weekEndDate) {
            currentIdx = idx;
            // 지난 주차는 현재 주차 이전 또는 마지막에서 두 번째 주차
            lastIdx = Math.max(0, idx - 1);
          }
        }
      }
    });

    // 주차가 하나뿐이면 두 차트 모두 같은 데이터 사용
    if (userData.weeklyWorkouts.length === 1) {
      currentIdx = lastIdx = 0;
    }

    console.log(
      `Current week index: ${currentIdx}, Last week index: ${lastIdx}`
    );
    return { currentWeekIndex: currentIdx, lastWeekIndex: lastIdx };
  }, [userData]);

  const handleBack = () => {
    router.push(`/user/${params.challengeId}/workout`);
  };

  useEffect(() => {
    // 페이지 로드 시 상단으로 스크롤
    window.scrollTo(0, 0);
  }, [params]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (apiError && !userData) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded my-4">
        <h2 className="font-bold">데이터 로딩 오류</h2>
        <p>{apiError}</p>
      </div>
    );
  }

  if (!userData) {
    return <div>사용자 데이터를 불러오는 중 오류가 발생했습니다.</div>;
  }

  // 지난 주와 이번 주 데이터
  const lastWeekData = userData?.weeklyWorkouts?.[lastWeekIndex] || {
    label: '데이터 없음',
    workoutTypes: {},
    dailyWorkouts: [],
  };
  const currentWeekData = userData?.weeklyWorkouts?.[currentWeekIndex] || {
    label: '데이터 없음',
    workoutTypes: {},
    dailyWorkouts: [],
  };

  return (
    <div className="flex w-full p-4">
      {useMockData && (
        <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">
          목업 데이터 사용 중
        </div>
      )}

      {/* Main Content */}
      <div className="w-full md:w-4/6 mr-2 flex flex-col gap-5">
        {/* Top Performance Card */}
        <div className="font-bold mb-1">{userData.name} 님의 운동현황</div>
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
          {/* 지난 주 차트 패널 */}
          <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
            <div className="font-bold mb-4">
              지난 주 운동 그래프 ({lastWeekData?.label || '데이터 없음'})
            </div>

            <div className="flex mb-6 sm:flex-col">
              {/* Donut Chart */}
              <div className="flex flex-col w-1/3 sm:w-full sm:gap-6">
                <div className="relative">
                  {generateDonutChart(lastWeekData.workoutTypes || {})}
                </div>
                <div className="flex justify-between text-sm mt-4 bg-gray-8 px-[1.875rem] py-[1.25rem]">
                  <div className="text-gray-500">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5">
                    {lastWeekData.totalSessions || 0}
                    <span className="text-1.75-900">
                      /{lastWeekData.requiredSessions || 0} 회
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="w-2/3 flex items-end pl-6 sm:w-full">
                {generateBarChart(lastWeekData.dailyWorkouts) || []}
              </div>
            </div>
          </div>

          {/* 이번 주 차트 패널 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="font-bold mb-4">
              이번 주 운동 그래프 ({currentWeekData.label})
            </div>

            <div className="flex gap-6 mb-6 sm:flex-col sm:gap-6">
              {/* 왼쪽: 도넛 차트 + 근력운동 */}
              <div className="flex flex-col items-center w-1/3 sm:w-full">
                <div className="relative w-full">
                  {generateDonutChart(currentWeekData.workoutTypes)}
                </div>
                <div className="flex justify-between text-sm mt-4 w-full bg-gray-8 px-[1.875rem] py-[1.25rem]">
                  <div className="text-gray-500">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5">
                    {currentWeekData.totalSessions}
                    <span className="text-1.75-900">
                      /{currentWeekData.requiredSessions} 회
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

              {/* 오른쪽: 바차트 + TextBox */}
              <div className="flex flex-col w-2/3 sm:w-full sm:items-center">
                <div className="flex items-end mb-4">
                  {generateBarChart(currentWeekData.dailyWorkouts)}
                </div>
                <div>
                  <TextBox
                    title="코치 피드백"
                    value={currentWeekData.feedback.text}
                    placeholder="피드백을 작성하세요."
                    button1="남기기"
                    Btn1className="bg-green text-white"
                    svg1="/svg/send.svg"
                    onChange={(e) => console.log(e.target.value)}
                    onSave={async (feedback) => {
                      console.log('Saved:', feedback);
                      // 여기에 피드백 저장 API 호출 코드 추가 가능
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
