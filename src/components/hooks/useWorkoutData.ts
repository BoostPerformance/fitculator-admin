// components/hooks/useWorkoutData.ts
import { useState, useEffect } from 'react';

// 타입 정의
export interface WorkoutTypes {
  [key: string]: number;
}

export interface DailyWorkout {
  day: string;
  value: number;
  status: 'complete' | 'incomplete' | 'rest';
  hasStrength: boolean;
  strengthCount: number;
}

export interface Feedback {
  text: string;
  author: string;
  date: string;
}

export interface WeeklyWorkout {
  weekNumber: number;
  label: string;
  totalAchievement: number;
  workoutTypes: WorkoutTypes;
  dailyWorkouts: DailyWorkout[];
  totalSessions: number;
  requiredSessions: number;
  feedback: Feedback;
}

export interface UserData {
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

export interface ApiResponse {
  user: UserInfo;
  weeklyRecords: WeeklyRecord[];
  stats: ApiStats;
  recentWorkouts?: any[];
}

// 목업 데이터
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

export const useWorkoutData = (userId: string, challengeId: string) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState<boolean>(false);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  useEffect(() => {
    const fetchUserWorkoutData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userId) {
          throw new Error('사용자 ID가 필요합니다.');
        }

        console.log(
          `Fetching workout data for user: ${userId}, challenge: ${challengeId}`
        );

        // 기본 운동 데이터 가져오기
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
          // 모든 유산소 운동 카테고리 정보 먼저 가져오기
          let categoryList: any[] = [];
          try {
            // 주차 파라미터 없이 전체 카테고리 정보 가져오기
            const categoriesResponse = await fetch(
              `/api/workouts/weekly-categories?challengeId=${challengeId}`
            );

            if (categoriesResponse.ok) {
              const categoryInfo = await categoriesResponse.json();
              if (categoryInfo && categoryInfo.categories) {
                categoryList = categoryInfo.categories;
                console.log('카테고리 리스트:', categoryList);
              }
            }
          } catch (e) {
            console.error('카테고리 목록 가져오기 실패:', e);
          }

          // 주간 레코드 처리
          const processedWeeklyWorkouts: WeeklyWorkout[] =
            data.weeklyRecords.map((record) => {
              // 1. 레코드의 시작일과 종료일로 주차 라벨 생성
              const recordStartDate = new Date(record.start_date);
              const recordEndDate = new Date(record.end_date);

              const formatDateLabel = (date: Date): string => {
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                return `${month}.${day}`;
              };

              const label = `${formatDateLabel(
                recordStartDate
              )}-${formatDateLabel(recordEndDate)}`;

              // 2. 각 주차별로 유산소 운동 종류 분포 생성
              let workoutTypes: WorkoutTypes = {};

              // DB에 저장된 카테고리 목록 (API에서 가져오지 못했을 경우 기본값)
              const defaultCategories = [
                '달리기',
                '하이트',
                '테니스',
                '등산',
                '사이클',
                '수영',
                '크로스 트레이닝',
                '걷기',
              ];

              // 실제 사용할 카테고리 목록
              const availableCategories =
                categoryList.length > 0
                  ? categoryList.map((cat: any) => cat.name_ko)
                  : defaultCategories;

              // 총 유산소 포인트
              const totalCardioPoints = record.cardio_points_total || 0;

              // 랜덤하게 3-5개의 카테고리 선택
              const selectedCount = Math.floor(Math.random() * 3) + 3; // 3-5개
              const selectedCategories = [...availableCategories]
                .sort(() => 0.5 - Math.random())
                .slice(0, selectedCount);

              // 각 선택된 카테고리에 유산소 포인트 분배
              let remainingPoints = totalCardioPoints;
              selectedCategories.forEach((category, index) => {
                if (index === selectedCategories.length - 1) {
                  // 마지막 카테고리는 남은 포인트 모두 할당
                  workoutTypes[category] = remainingPoints;
                } else {
                  // 나머지는 랜덤하게 분배 (최소 10% 이상)
                  const minPoint = Math.max(
                    10,
                    Math.floor(totalCardioPoints * 0.1)
                  );
                  const maxPoint = Math.max(
                    minPoint,
                    Math.floor(remainingPoints * 0.6)
                  );
                  const points =
                    Math.floor(Math.random() * (maxPoint - minPoint)) +
                    minPoint;

                  workoutTypes[category] = points;
                  remainingPoints -= points;
                }
              });

              console.log(`Week ${label} workout types:`, workoutTypes);

              // 3. 주간 일일 데이터 생성
              const dailyWorkouts: DailyWorkout[] = [];
              const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

              // API에서 사용자의 최근 운동 데이터 가져오기 (있다면)
              const recentWorkouts = data.recentWorkouts || [];

              // 날짜별 근력 운동 횟수 맵 생성
              const strengthWorkoutsByDate: Record<string, number> = {};

              // 근력 운동 데이터 추출 (운동 카테고리 타입이 STRENGTH인 운동)
              recentWorkouts.forEach((workout) => {
                if (
                  workout.workout_categories?.workout_types?.name === 'STRENGTH'
                ) {
                  const workoutDate = new Date(workout.timestamp);
                  const dateKey = workoutDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식

                  // 해당 날짜에 근력 운동 횟수 증가
                  if (!strengthWorkoutsByDate[dateKey]) {
                    strengthWorkoutsByDate[dateKey] = 0;
                  }
                  strengthWorkoutsByDate[dateKey]++;
                }
              });

              // 주간 시작/종료일로 날짜 범위 생성
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
                  author: record.coach
                    ? `코치 ${record.coach.name}`
                    : 'AI 코치',
                  date: record.feedback.created_at || new Date().toISOString(),
                };
              }

              // 5. 주간 정보 구성
              return {
                weekNumber: record.weekNumber || 1,
                label,
                totalAchievement: Math.min(
                  record.cardio_points_total || 0,
                  100
                ), // 유산소 달성률
                workoutTypes,
                dailyWorkouts,
                totalSessions: record.strength_sessions_count || 0,
                requiredSessions: 3, // 목표 세션 수 (임의 설정)
                feedback: feedbackData,
              };
            });

          // 최종 사용자 데이터 구조
          const processedData = {
            name: data.user.name || data.user.displayName || '사용자',
            achievement:
              Math.round(
                data.stats.totalCardioPoints / data.weeklyRecords.length
              ) || 0,
            weeklyWorkouts: processedWeeklyWorkouts,
          };

          setUserData(processedData);
          setTotalPoints(data.stats.totalCardioPoints || 0);
          setUseMockData(false);
          console.log('Processed User Data:', processedData);
        } else {
          throw new Error('유효한 데이터가 없습니다.');
        }
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
        setError((error as Error).message);

        // API 오류 시 목업 데이터 사용
        console.log('API 오류로 인해 목업 데이터 사용');
        setUseMockData(true);

        // 목업 데이터에서 해당 유저 데이터 찾기
        const mockData = MOCK_DATA[userId] || MOCK_DATA.default;
        setUserData(mockData);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserWorkoutData();
    }
  }, [userId, challengeId]);

  return {
    userData,
    loading,
    error,
    useMockData,
    totalPoints,
  };
};
