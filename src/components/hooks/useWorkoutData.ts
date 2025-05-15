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

export const useWorkoutData = (userId: string, challengeId: string) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  useEffect(() => {
    const fetchUserWorkoutData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!userId) throw new Error('사용자 ID가 필요합니다.');

        const response = await fetch(
          `/api/workouts/user-detail?userId=${userId}`
        );

        if (!response.ok) throw new Error(`API 오류: ${response.status}`);

        const data: ApiResponse = await response.json();
        const processedData = await transformApiData(data);

        setUserData(processedData);
        setTotalPoints(data.stats.totalCardioPoints);
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
        setError((error as Error).message);
        setUserData({ name: '사용자', achievement: 0, weeklyWorkouts: [] });
        setTotalPoints(0);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserWorkoutData();
    } else {
      setUserData({ name: '사용자', achievement: 0, weeklyWorkouts: [] });
      setTotalPoints(0);
      setLoading(false);
    }
  }, [userId, challengeId]);

  const transformApiData = async (apiData: ApiResponse): Promise<UserData> => {
    const { user, weeklyRecords, stats } = apiData;
    const processedWeeklyWorkouts: WeeklyWorkout[] = [];

    const toDateKey = (date: Date): string => {
      // timestamp는 이미 KST로 제공됨 → UTC 보정 불필요
      return date.toISOString().split('T')[0];
    };

    for (const record of weeklyRecords) {
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

      let workoutTypes: WorkoutTypes = {};
      try {
        const response = await fetch(
          `/api/workouts/weekly-categories?challengeId=${challengeId}&userId=${user.id}&weekLabel=${label}`
        );
        if (response.ok) {
          const categoryData = await response.json();
          const weekData = categoryData.data?.find(
            (week: any) => week.weekLabel === label
          );
          if (weekData?.categories) {
            weekData.categories
              .filter((cat: any) => cat.percentage > 0)
              .forEach((cat: any) => {
                workoutTypes[cat.name_ko] = cat.percentage;
              });
          }
        }
      } catch (error) {
        console.error('운동 카테고리 데이터 가져오기 실패:', error);
      }

      const recentWorkouts = apiData.recentWorkouts || [];
      const strengthWorkoutsByDate: Record<string, number> = {};
      const cardioWorkoutsByDate: Record<string, number> = {};

      recentWorkouts.forEach((workout) => {
        const workoutDate = new Date(workout.timestamp); // 이미 KST 기준임
        const dateKey = toDateKey(workoutDate);
        const type = workout.workout_categories?.workout_types?.name;
        // console.log('workout time', new Date(workout.timestamp).toString());

        if (type === 'STRENGTH') {
          strengthWorkoutsByDate[dateKey] =
            (strengthWorkoutsByDate[dateKey] || 0) + 1;
        }
        if (type === 'CARDIO') {
          cardioWorkoutsByDate[dateKey] =
            (cardioWorkoutsByDate[dateKey] || 0) + (workout.points || 0);
        }
      });

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
          const dateKey = toDateKey(dayDate);
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

      processedWeeklyWorkouts.push({
        recordId: record.id,
        weekNumber: record.weekNumber || 1,
        label,
        totalAchievement: Math.min(record.cardio_points_total || 0, 100),
        workoutTypes,
        dailyWorkouts,
        totalSessions: record.strength_sessions_count || 0,
        requiredSessions: 3,
        feedback: feedbackData,
      });
    }

    return {
      name: user.name || user.displayName || '사용자',
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
  };
};
