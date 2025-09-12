// components/hooks/useWorkoutData.ts
import { useState, useEffect } from 'react';
import {
  ApiResponse,
  UserData,
  WeeklyWorkout,
  Feedback,
  DailyWorkout,
  WorkoutTypes,
} from '@/types/useWorkoutDataTypes';

// Re-export types for convenience
export type { WeeklyWorkout, UserData, DailyWorkout, Feedback, WorkoutTypes };

export const useWorkoutData = (userId: string, challengeId: string) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  const fetchUserWorkoutData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!userId) throw new Error('사용자 ID가 필요합니다.');

        const response = await fetch(
          `/api/workouts/user-detail?userId=${userId}&challengeId=${challengeId}&t=${Date.now()}`,
          { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );

        if (!response.ok) throw new Error(`API 오류: ${response.status}`);

        const data: ApiResponse = await response.json();
// console.log('API data user info:', data.user);

        const processedData = await transformApiData(data);

        // console.log('processedData', processedData);

        setUserData(processedData);
        setTotalPoints(data.stats.totalCardioPoints);
      } catch (error) {
// console.error('API 호출 중 오류 발생:', error);
        setError((error as Error).message);
        setUserData({ name: '사용자', achievement: 0, weeklyWorkouts: [] });
        setTotalPoints(0);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (userId) {
      fetchUserWorkoutData();
    } else {
      setUserData({ name: '사용자', achievement: 0, weeklyWorkouts: [] });
      setTotalPoints(0);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, challengeId]);

  const transformApiData = async (apiData: ApiResponse): Promise<UserData> => {
    const { user, weeklyRecords, stats, challengePeriod } = apiData;
    const processedWeeklyWorkouts: WeeklyWorkout[] = [];
    const processedWeekNumbers = new Set<number>(); // 주차 번호로만 중복 체크

    // Calculate correct week numbers - always starts from W1
    const calculateWeekNumber = (recordStartDate: Date, challengeStartDate: Date): number => {
      // 챌린지 시작일이 속한 주의 월요일 계산 (W1의 시작)
      const startDay = challengeStartDate.getDay();
      let firstWeekMonday = new Date(challengeStartDate);
      
      if (startDay !== 1) {
        // 월요일이 아니면 해당 주의 월요일로 이동
        const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
        firstWeekMonday.setDate(firstWeekMonday.getDate() - daysSinceMonday);
      }
      
      // 현재 레코드 시작일 (이미 월요일)
      let recordWeekMonday = new Date(recordStartDate);
      
      // 주차 계산
      const timeDiff = recordWeekMonday.getTime() - firstWeekMonday.getTime();
      const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
      
      // W1부터 시작 (챌린지 시작일이 포함된 주가 W1)
      return weeksDiff + 1;
    };

    const toDateKey = (dateString: string): string => {
      // 한국 시간 표시를 위해 +9시간 적용
      const date = new Date(dateString);
      const kstTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      return kstTime.toISOString().split('T')[0];
    };

    for (const record of weeklyRecords) {
      // DB의 날짜를 로컬 시간으로 파싱 (타임존 영향 제거)
      const [startYear, startMonth, startDay] = record.start_date.split('-').map(Number);
      const [endYear, endMonth, endDay] = record.end_date.split('-').map(Number);
      const recordStartDate = new Date(startYear, startMonth - 1, startDay);
      const recordEndDate = new Date(endYear, endMonth - 1, endDay);


      const formatDateLabel = (dateString: string): string => {
        // 날짜 문자열에서 직접 월/일 추출 ('YYYY-MM-DD' 형식)
        const parts = dateString.split('-');
        const month = parseInt(parts[1]).toString();
        const day = parseInt(parts[2]).toString();
        return `${month}.${day}`;
      };

      const label = `${formatDateLabel(record.start_date)}-${formatDateLabel(
        record.end_date
      )}`;

      // workoutTypes는 더 이상 weekly-categories API에서 가져오지 않음
      // 실제 운동 데이터에서 계산하도록 변경됨
      const workoutTypes: WorkoutTypes = {};

      // recentWorkouts가 제거되었으므로 빈 맵으로 초기화
      // 실제 데이터는 week-detail API에서 가져옴
      const strengthWorkoutsByDate: Record<string, number> = {};
      const cardioWorkoutsByDate: Record<string, number> = {};

      const dateRange: Date[] = [];
      let currentDate = new Date(recordStartDate);
      while (currentDate <= recordEndDate) {
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
      const dailyWorkouts: DailyWorkout[] = [];

      weekdays.forEach((dayOfWeek, i) => {
        const dayDate = dateRange.find((date) => date.getDay() === (i + 1) % 7);

        let strengthCount = 0;
        let cardioValue = 0;
        if (dayDate) {
          const dateKey = dayDate.toISOString().split('T')[0];
          strengthCount = strengthWorkoutsByDate[dateKey] || 0;
          cardioValue = cardioWorkoutsByDate[dateKey] || 0;
        }
        // console.log(
        //   `[${label}] 요일: ${dayOfWeek}, Strength Count: ${strengthCount}, Cardio Value: ${cardioValue}`
        // );
        const isWeekend = dayOfWeek === '토' || dayOfWeek === '일';
        const status: 'complete' | 'incomplete' | 'rest' = isWeekend
          ? 'rest'
          : cardioValue > 0
          ? 'complete'
          : 'incomplete';

        dailyWorkouts.push({
          day: dayOfWeek,
          value: cardioValue,
          status,
          hasStrength: strengthCount > 0,
          strengthCount,
        });
      });

      const feedbackData: Feedback = {
        text:
          record.feedback?.ai_feedback ||
          record.feedback?.coach_feedback ||
          '피드백이 아직 없습니다.',
        author: record.coach ? `코치 ${record.coach.name}` : 'AI 코치',
        date: record.feedback?.created_at || new Date().toISOString(),
      };

      // Calculate correct week number
      let correctWeekNumber = 1;
      
      if (challengePeriod && challengePeriod.startDate) {
        // 로컬 시간으로 파싱 (타임존 영향 제거)
        const [year, month, day] = challengePeriod.startDate.split('-').map(Number);
        const challengeStartDate = new Date(year, month - 1, day);
        correctWeekNumber = calculateWeekNumber(recordStartDate, challengeStartDate);
      } else {
        // Fallback: use first record as reference for week numbering (start from W1)
        if (weeklyRecords.length > 0) {
          const sortedRecords = [...weeklyRecords].sort((a, b) => 
            new Date(a.start_date + 'T00:00:00Z').getTime() - new Date(b.start_date + 'T00:00:00Z').getTime()
          );
          const firstRecordStart = new Date(sortedRecords[0].start_date + 'T00:00:00Z');
          
          // 첫 레코드의 월요일 계산
          const firstDay = firstRecordStart.getDay();
          let firstWeekMonday = new Date(firstRecordStart);
          if (firstDay !== 1) {
            const daysSinceMonday = firstDay === 0 ? 6 : firstDay - 1;
            firstWeekMonday.setDate(firstWeekMonday.getDate() - daysSinceMonday);
          }
          
          // 현재 레코드의 월요일 계산
          const recordDay = recordStartDate.getDay();
          let recordWeekMonday = new Date(recordStartDate);
          if (recordDay !== 1) {
            const daysSinceMonday = recordDay === 0 ? 6 : recordDay - 1;
            recordWeekMonday.setDate(recordWeekMonday.getDate() - daysSinceMonday);
          }
          
          const timeDiff = recordWeekMonday.getTime() - firstWeekMonday.getTime();
          const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
          correctWeekNumber = weeksDiff + 1; // Always start from W1
        }
      }

      // 중복된 주차 데이터 필터링 - 주차 번호로만 체크하고 첫 번째 레코드만 사용
      if (!processedWeekNumbers.has(correctWeekNumber)) {
        processedWeekNumbers.add(correctWeekNumber);
        processedWeeklyWorkouts.push({
          recordId: record.id,
          weekNumber: correctWeekNumber,
          label,
          totalAchievement: record.cardio_points_total || 0,
          workoutTypes,
          dailyWorkouts,
          totalSessions: record.strength_sessions_count || 0,
          requiredSessions: 3,
          feedback: feedbackData,
          cardioPointsTotal: record.cardio_points_total || 0, // user-detail API에서 실제 계산된 값
        });
      }
    }
    // 주차 번호로 정렬
    processedWeeklyWorkouts.sort((a, b) => a.weekNumber - b.weekNumber);
    
    // console.log('processedWeeklyWorkouts', processedWeeklyWorkouts);

    return {
      name: user.name || user.displayName || '사용자',
      username: user.displayName || null,
      achievement:
        Math.round(stats.totalCardioPoints / weeklyRecords.length) || 0,
      weeklyWorkouts: processedWeeklyWorkouts,
    };
  };

  return {
    userData,
    loading,
    error,
    totalPoints,
    refetch: fetchUserWorkoutData,
  };
};
