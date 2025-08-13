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
          `/api/workouts/user-detail?userId=${userId}&challengeId=${challengeId}`
        );

        if (!response.ok) throw new Error(`API 오류: ${response.status}`);

        const data: ApiResponse = await response.json();
        console.log('API data user info:', data.user);

        const processedData = await transformApiData(data);

        // console.log('processedData', processedData);

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
    const { user, weeklyRecords, stats, challengePeriod } = apiData;
    console.log('API Response challengePeriod:', challengePeriod);
    const processedWeeklyWorkouts: WeeklyWorkout[] = [];

    // Calculate correct week numbers with W0 logic
    const calculateWeekNumber = (recordStartDate: Date, challengeStartDate: Date): number => {
      const startDay = challengeStartDate.getDay();
      
      // Calculate the Monday of the week containing the challenge start date
      let challengeWeekStart = new Date(challengeStartDate);
      if (startDay !== 1) {
        // If not Monday, go back to the previous Monday
        const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
        challengeWeekStart.setDate(challengeWeekStart.getDate() - daysSinceMonday);
      }
      
      // Calculate week difference using the Monday of the record's week
      const recordDay = recordStartDate.getDay();
      let recordWeekStart = new Date(recordStartDate);
      if (recordDay !== 1) {
        const daysSinceMonday = recordDay === 0 ? 6 : recordDay - 1;
        recordWeekStart.setDate(recordWeekStart.getDate() - daysSinceMonday);
      }
      
      const timeDiff = recordWeekStart.getTime() - challengeWeekStart.getTime();
      const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
      
      // If challenge starts on Monday, weeks start from W1
      // If challenge starts on other days, weeks start from W0
      if (startDay === 1) {
        return weeksDiff + 1; // W1, W2, W3...
      } else {
        return weeksDiff; // W0, W1, W2...
      }
    };

    const toDateKey = (dateString: string): string => {
      // timestamp에 +9시간 적용 (한국 시간대)
      const date = new Date(dateString);
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      return kstDate.toISOString().split('T')[0];
    };

    for (const record of weeklyRecords) {
      const recordStartDate = new Date(record.start_date);
      const recordEndDate = new Date(record.end_date);

      //console.log('dates', recordStartDate, recordEndDate);

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

      // 해당 주차의 운동 데이터만 가져오기
      const weeklyWorkouts = apiData.recentWorkouts || [];
      const strengthWorkoutsByDate: Record<string, number> = {};
      const cardioWorkoutsByDate: Record<string, number> = {};

      weeklyWorkouts.forEach((workout) => {
        const workoutDate = new Date(workout.timestamp);
        const dateKey = toDateKey(workout.timestamp);
        const type = workout.workout_categories?.workout_types?.name;
        
        // 해당 주차 범위 내의 운동만 처리
        if (workoutDate >= recordStartDate && workoutDate <= recordEndDate) {
          if (type === 'STRENGTH') {
            strengthWorkoutsByDate[dateKey] =
              (strengthWorkoutsByDate[dateKey] || 0) + 1;
          }
          if (type === 'CARDIO') {
            cardioWorkoutsByDate[dateKey] =
              (cardioWorkoutsByDate[dateKey] || 0) + (workout.points || 0);
          }
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
      let correctWeekNumber = record.weekNumber || 1;
      
      if (challengePeriod && challengePeriod.startDate) {
        const challengeStartDate = new Date(challengePeriod.startDate);
        correctWeekNumber = calculateWeekNumber(recordStartDate, challengeStartDate);
      } else {
        // Fallback: use first record as reference for week numbering (always start from W0)
        if (weeklyRecords.length > 0) {
          const firstRecordStart = new Date(weeklyRecords[0].start_date);
          const timeDiff = recordStartDate.getTime() - firstRecordStart.getTime();
          const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
          correctWeekNumber = weeksDiff; // Always start from W0 when no challengePeriod
        }
      }

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
      });
    }
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
  };
};
