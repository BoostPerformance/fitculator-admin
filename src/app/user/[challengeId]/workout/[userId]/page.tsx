'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import TextBox from '@/components/textBox';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import WeeklyWorkoutChart from '@/components/workoutDashboard/weeklyWorkoutChart';

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

interface UserData {
  name: string;
  achievement: number;
  weeklyWorkouts: WeeklyWorkout[];
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
  const colors: Record<string, string> = {
    HIT: '#60BDFF',
    일반기기: '#90EFA5',
    걷기: '#9BA3FF',
    러닝: '#FFB6C1',
    수영: '#FFD700',
    CARDIO: '#60BDFF', // 추가: API 데이터 형식에 맞춤
    STRENGTH: '#FFB6C1', // 추가: API 데이터 형식에 맞춤
  };

  // 애니메이션 없이 도넛 차트 생성
  const segments = Object.entries(workoutTypes).map(([type, value], index) => {
    const percentage = (value / total) * 100;
    const dashoffset = circumference * (1 - value / total);
    const rotation = offset * 3.6; // 360 / 100
    offset += percentage;

    return (
      <circle
        key={index}
        cx="50"
        cy="50"
        r="35"
        fill="transparent"
        stroke={colors[type] || `hsl(${index * 60}, 70%, 60%)`}
        strokeWidth="23"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform={`rotate(${rotation} 50 50)`}
      />
    );
  });

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-center">
        <svg className="w-45 h-45" viewBox="0 0 100 100">
          {segments}
        </svg>
        <div className="absolute text-2.5-700 font-bold">
          {Math.round(total)}%
        </div>
      </div>
      <div className="flex flex-wrap justify-around text-xs mt-2">
        {Object.entries(workoutTypes).map(([type, value], index) => (
          <div key={index} className="flex items-center my-1">
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{
                backgroundColor: colors[type] || `hsl(${index * 60}, 70%, 60%)`,
              }}
            ></div>
            <div>
              {type}
              <br />
              {value}%
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

// 목업 데이터 (백업용)
const MOCK_DATA: Record<string, UserData> = {
  user1: {
    name: '김철수',
    achievement: 88,
    weeklyWorkouts: [
      {
        weekNumber: 1,
        label: '03.20-03.26',
        totalAchievement: 88,
        workoutTypes: {
          HIT: 40,
          일반기기: 38.2,
          걷기: 9.8,
        },
        dailyWorkouts: [
          {
            day: '월',
            value: 45,
            status: 'complete',
            hasStrength: true,
            strengthCount: 2,
          },
          {
            day: '화',
            value: 30,
            status: 'incomplete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '수',
            value: 20,
            status: 'complete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '목',
            value: 60,
            status: 'complete',
            hasStrength: true,
            strengthCount: 2,
          },
          {
            day: '금',
            value: 30,
            status: 'complete',
            hasStrength: false,
            strengthCount: 0,
          },
          {
            day: '토',
            value: 30,
            status: 'complete',
            hasStrength: true,
            strengthCount: 1,
          },
          {
            day: '일',
            value: 30,
            status: 'complete',
            hasStrength: false,
            strengthCount: 3,
          },
        ],
        totalSessions: 5,
        requiredSessions: 2,
        feedback: {
          text: '김철수님 이번 주 운동 목표를 달성하셨네요! 특히 HIT 운동의 비중이 높아 효과적인 운동이 되었을 것 같아요. 다음 주에는 걷기의 비중을 조금 더 높여보는 것도 좋을 것 같습니다.',
          author: '코치 이지훈',
          date: '2023.10.24 14:15:34',
        },
      },
    ],
  },
  user2: {
    name: '이영희',
    achievement: 75,
    weeklyWorkouts: [
      {
        weekNumber: 1,
        label: '03.20-03.26',
        totalAchievement: 75,
        workoutTypes: {
          HIT: 35,
          일반기기: 30,
          걷기: 10,
        },
        dailyWorkouts: [
          {
            day: '월',
            value: 40,
            status: 'complete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '화',
            value: 0,
            status: 'incomplete',
            hasStrength: false,
            strengthCount: 0,
          },
          {
            day: '수',
            value: 15,
            status: 'complete',
            hasStrength: true,
            strengthCount: 2,
          },
          {
            day: '목',
            value: 50,
            status: 'complete',
            hasStrength: true,
            strengthCount: 2,
          },
          {
            day: '금',
            value: 25,
            status: 'complete',
            hasStrength: false,
            strengthCount: 1,
          },
          {
            day: '토',
            value: 0,
            status: 'rest',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '일',
            value: 0,
            status: 'rest',
            hasStrength: false,
            strengthCount: 0,
          },
        ],
        totalSessions: 3,
        requiredSessions: 5,
        feedback: {
          text: '이영희님, 운동을 시작하신 첫 주차네요. 일반기기 운동 비중이 높았고, 주 3회 운동을 하셨습니다. 다음 주에는 목표인 5회를 달성해보시는 것이 어떨까요?',
          author: '코치 박성민',
          date: '2023.10.24 14:15:34',
        },
      },
    ],
  },
  user3: {
    name: '박지민',
    achievement: 50,
    weeklyWorkouts: [
      {
        weekNumber: 1,
        label: '03.20-03.26',
        totalAchievement: 50,
        workoutTypes: {
          HIT: 20,
          일반기기: 25,
          걷기: 5,
        },
        dailyWorkouts: [
          {
            day: '월',
            value: 0,
            status: 'incomplete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '화',
            value: 30,
            status: 'complete',
            hasStrength: true,
            strengthCount: 2,
          },
          {
            day: '수',
            value: 0,
            status: 'incomplete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '목',
            value: 0,
            status: 'incomplete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '금',
            value: 25,
            status: 'complete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '토',
            value: 0,
            status: 'rest',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '일',
            value: 0,
            status: 'rest',
            hasStrength: false,
            strengthCount: 2,
          },
        ],
        totalSessions: 2,
        requiredSessions: 5,
        feedback: {
          text: '박지민님, 첫 주차 운동을 시작하셨네요. 화요일과 금요일에만 운동을 하셨는데, 다음 주에는 좀 더 자주 운동해보시면 어떨까요?',
          author: '코치 김민수',
          date: '2023.10.24 14:15:34',
        },
      },
    ],
  },
  default: {
    name: '최한',
    achievement: 88,
    weeklyWorkouts: [
      {
        weekNumber: 1,
        label: '03.20-03.26',
        totalAchievement: 88,
        workoutTypes: {
          HIT: 40,
          일반기기: 38.2,
          걷기: 9.8,
        },
        dailyWorkouts: [
          {
            day: '월',
            value: 45,
            status: 'complete',
            hasStrength: true,
            strengthCount: 2,
          },
          {
            day: '화',
            value: 30,
            status: 'incomplete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '수',
            value: 20,
            status: 'complete',
            hasStrength: false,
            strengthCount: 0,
          },
          {
            day: '목',
            value: 60,
            status: 'complete',
            hasStrength: true,
            strengthCount: 1,
          },
          {
            day: '금',
            value: 30,
            status: 'complete',
            hasStrength: false,
            strengthCount: 2,
          },
          {
            day: '토',
            value: 30,
            status: 'complete',
            hasStrength: true,
            strengthCount: 2,
          },
          {
            day: '일',
            value: 30,
            status: 'complete',
            hasStrength: false,
            strengthCount: 2,
          },
        ],
        totalSessions: 5,
        requiredSessions: 2,
        feedback: {
          text: '최한님 이번 주 운동 목표를 달성하셨네요! 특히 HIT 운동의 비중이 높아 효과적인 운동이 되었을 것 같아요.',
          author: '코치 이지훈',
          date: '2023.10.24 14:15:34',
        },
      },
    ],
  },
};

// 운동 상세 페이지 컴포넌트
export default function UserWorkoutDetailPage() {
  const params = useParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWeek, setSelectedWeek] = useState<number>(0); // 기본값은 첫 번째 주
  const [apiError, setApiError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState<boolean>(false);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  useEffect(() => {
    const fetchUserWorkoutData = async () => {
      try {
        setLoading(true);
        setApiError(null);

        // userId 가져오기
        const userId = params.userId as string;
        const challengeId = params.challengeId as string;

        if (!userId) {
          throw new Error('사용자 ID가 필요합니다.');
        }

        console.log(
          `Fetching workout data for user: ${userId}, challenge: ${challengeId}`
        );

        // API 호출
        const response = await fetch(
          `/api/workouts/user-detail?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error(`API 오류: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        console.log('API Response:', data);

        // API 응답 데이터 처리
        if (data && data.user) {
          // 데이터 변환
          const processedData = processApiData(data);
          setUserData(processedData);
          setTotalPoints(data.stats.totalCardioPoints || 0);
          setUseMockData(false);
        } else {
          throw new Error('유효한 데이터가 없습니다.');
        }
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
        setApiError((error as Error).message);

        // API 오류 시 목업 데이터 사용
        console.log('API 오류로 인해 목업 데이터 사용');
        setUseMockData(true);

        // 목업 데이터에서 해당 유저 데이터 찾기
        const mockUserId = params.userId as string;
        const mockData = MOCK_DATA[mockUserId] || MOCK_DATA.default;
        setUserData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchUserWorkoutData();
    // 페이지 로드 시 상단으로 스크롤
    window.scrollTo(0, 0);
  }, [params]);

  // API 데이터 가공 함수
  const processApiData = (apiData: ApiResponse): UserData => {
    const { user, weeklyRecords, stats } = apiData;

    // 주간 레코드 처리
    const processedWeeklyWorkouts: WeeklyWorkout[] = weeklyRecords.map(
      (record) => {
        // 1. 레코드의 시작일과 종료일로 주차 라벨 생성
        const recordStartDate = new Date(record.start_date);
        const recordEndDate = new Date(record.end_date);

        const formatDateLabel = (date: Date): string => {
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          return `${month}.${day}`;
        };

        const label = `${formatDateLabel(recordStartDate)}-${formatDateLabel(
          recordEndDate
        )}`;

        // 2. 운동 유형별 데이터 생성 (유산소/근력 비율)
        const cardioPoints = record.cardio_points_total || 0;
        const strengthPoints = record.strength_sessions_count * 20; // 근력 세션당 20점으로 계산

        const workoutTypes: WorkoutTypes = {
          CARDIO: Math.min(cardioPoints, 100), // 100% 초과하지 않도록
          STRENGTH: Math.min(strengthPoints, 100), // 100% 초과하지 않도록
        };

        // 3. 주간 일일 데이터 생성
        const dailyWorkouts: DailyWorkout[] = [];
        const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

        // API에서 사용자의 최근 운동 데이터 가져오기 (있다면)
        const recentWorkouts = apiData.recentWorkouts || [];

        // 날짜별 근력 운동 횟수 맵 생성
        const strengthWorkoutsByDate: Record<string, number> = {};

        // 근력 운동 데이터 추출 (운동 카테고리 타입이 STRENGTH인 운동)
        recentWorkouts.forEach((workout) => {
          // workout 객체의 구조에 따라 조정 필요
          if (workout.workout_categories?.workout_types?.name === 'STRENGTH') {
            const workoutDate = new Date(workout.timestamp);
            const dateKey = workoutDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식

            // 해당 날짜에 근력 운동 횟수 증가
            if (!strengthWorkoutsByDate[dateKey]) {
              strengthWorkoutsByDate[dateKey] = 0;
            }
            strengthWorkoutsByDate[dateKey]++;
          }
        });

        // 주간 시작/종료일로 날짜 범위 생성 (변수명 변경으로 충돌 방지)
        const dateRange: Date[] = [];

        // 주간 날짜 배열 생성
        let currentDate = new Date(recordStartDate);
        while (currentDate <= recordEndDate) {
          dateRange.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // 각 요일별 데이터 생성
        for (let i = 0; i < 7; i++) {
          const dayOfWeek = weekdays[i];

          // 해당 요일에 맞는 날짜 찾기 (있다면)
          const dayDate = dateRange.find((date) => {
            const day = date.getDay();
            // 0(일) ~ 6(토) -> '일', '월', ... 로 변환
            return weekdays[(day + 1) % 7] === dayOfWeek;
          });

          // 해당 날짜의 근력 운동 횟수 가져오기
          let strengthCount = 0;
          if (dayDate) {
            const dateKey = dayDate.toISOString().split('T')[0];
            strengthCount = strengthWorkoutsByDate[dateKey] || 0;
          }

          // 주간 총 근력 운동 횟수를 기반으로 추산 (API 데이터가 충분하지 않은 경우)
          if (!strengthCount && record.strength_sessions_count) {
            // 월, 수, 금에 균등하게 분배 (또는 다른 분배 방식 적용)
            const strengthDays = ['월', '수', '금'];
            if (strengthDays.includes(dayOfWeek)) {
              const sessionsPerDay = Math.ceil(
                record.strength_sessions_count / strengthDays.length
              );
              strengthCount = Math.min(1, sessionsPerDay); // 최대 1개만 표시
            }
          }

          // 현재 요일이 주말인지 확인
          const isWeekend = dayOfWeek === '토' || dayOfWeek === '일';

          // 유산소 운동 값 설정
          let cardioValue = 0;
          if (!isWeekend) {
            // 임시 로직: 요일별로 다른 값 설정
            cardioValue = weekdays.indexOf(dayOfWeek) * 10 + 20;
          }

          // 상태 설정
          let status: 'complete' | 'incomplete' | 'rest' = 'rest';
          if (!isWeekend) {
            status = cardioValue > 0 ? 'complete' : 'incomplete';
          }

          const dayData: DailyWorkout = {
            day: dayOfWeek,
            value: cardioValue,
            status,
            hasStrength: strengthCount > 0,
            strengthCount,
          };

          dailyWorkouts.push(dayData);
        }

        // 4. 피드백 데이터 처리
        let feedbackData: Feedback = {
          text: '피드백이 아직 없습니다.',
          author: 'AI 코치',
          date: new Date().toISOString(),
        };

        if (record.feedback) {
          feedbackData = {
            text:
              record.feedback.ai_feedback ||
              record.feedback.coach_feedback ||
              '피드백이 아직 없습니다.',
            author: record.coach ? `코치 ${record.coach.name}` : 'AI 코치',
            date: record.feedback.created_at || new Date().toISOString(),
          };
        }

        // 5. 주간 정보 구성
        return {
          weekNumber: record.weekNumber || 1,
          label,
          totalAchievement: Math.min(cardioPoints, 100), // 유산소 달성률
          workoutTypes,
          dailyWorkouts,
          totalSessions: record.strength_sessions_count || 0,
          requiredSessions: 3, // 목표 세션 수 (임의 설정)
          feedback: feedbackData,
        };
      }
    );

    // 최종 사용자 데이터 구조
    return {
      name: user.name || user.displayName || '사용자',
      achievement:
        Math.round(stats.totalCardioPoints / weeklyRecords.length) || 0,
      weeklyWorkouts: processedWeeklyWorkouts,
    };
  };
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

  // 선택된 주차 데이터
  const weekData = userData.weeklyWorkouts[selectedWeek];

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
          <WeeklyWorkoutChart userName={userData.name} />
          {/* First Chart Panel */}
          <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
            <div className="font-bold mb-4">지난 주 운동 그래프</div>

            <div className="flex mb-6 sm:flex-col">
              {/* Donut Chart */}
              <div className="flex flex-col w-1/3 sm:w-full sm:gap-6">
                <div className="relative">
                  {generateDonutChart(weekData.workoutTypes)}
                </div>
                <div className="flex justify-between text-sm mt-4 bg-gray-8 px-[1.875rem] py-[1.25rem]">
                  <div className="text-gray-500">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5">
                    {weekData.totalSessions}
                    <span className="text-1.75-900">
                      /{weekData.requiredSessions} 회
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="w-2/3 flex items-end pl-6 sm:w-full">
                {generateBarChart(weekData.dailyWorkouts)}
              </div>
            </div>
          </div>

          {/* Second Chart Panel (Duplicate of the first) */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="font-bold mb-4">이번 주 운동 그래프</div>

            <div className="flex gap-6 mb-6 sm:flex-col sm:gap-6">
              {/* 왼쪽: 도넛 차트 + 근력운동 */}
              <div className="flex flex-col items-center w-1/3 sm:w-full">
                <div className="relative w-full">
                  {generateDonutChart(weekData.workoutTypes)}
                </div>
                <div className="flex justify-between text-sm mt-4 w-full bg-gray-8 px-[1.875rem] py-[1.25rem]">
                  <div className="text-gray-500">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5">
                    {weekData.totalSessions}
                    <span className="text-1.75-900">
                      /{weekData.requiredSessions} 회
                    </span>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 바차트 + TextBox */}
              <div className="flex flex-col w-2/3 sm:w-full sm:items-center">
                <div className="flex items-end mb-4">
                  {generateBarChart(weekData.dailyWorkouts)}
                </div>
                <div>
                  <TextBox
                    title="코치 피드백"
                    value={weekData.feedback.text}
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
