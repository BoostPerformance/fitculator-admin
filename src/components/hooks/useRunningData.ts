// components/hooks/useRunningData.ts
import { useState, useEffect } from 'react';
import {
  ApiResponse,
  UserData,
  WeeklyRunning,
  Feedback,
  DailyRunning,
  RunningTypes,
} from '@/types/useRunningDataTypes';

// Re-export types for convenience
export type { WeeklyRunning, UserData, DailyRunning, Feedback, RunningTypes };

export const useRunningData = (userId: string, challengeId: string) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  const fetchUserRunningData = async () => {
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

        const processedData = await transformApiData(data);

        setUserData(processedData);
        setTotalPoints(data.stats.totalCardioPoints);
      } catch (error) {
        setError((error as Error).message);
        setUserData({ name: '사용자', achievement: 0, weeklyRunnings: [] });
        setTotalPoints(0);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (userId) {
      fetchUserRunningData();
    } else {
      setUserData({ name: '사용자', achievement: 0, weeklyRunnings: [] });
      setTotalPoints(0);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, challengeId]);

  const transformApiData = async (apiData: ApiResponse): Promise<UserData> => {
    const { user, weeklyRecords, stats, challengePeriod } = apiData;
    const processedWeeklyRunnings: WeeklyRunning[] = [];
    const processedWeekNumbers = new Set<number>();

    // Calculate correct week numbers - always starts from W1
    const calculateWeekNumber = (recordStartDate: Date, challengeStartDate: Date): number => {
      const startDay = challengeStartDate.getDay();
      let firstWeekMonday = new Date(challengeStartDate);

      if (startDay !== 1) {
        const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
        firstWeekMonday.setDate(firstWeekMonday.getDate() - daysSinceMonday);
      }

      let recordWeekMonday = new Date(recordStartDate);

      const timeDiff = recordWeekMonday.getTime() - firstWeekMonday.getTime();
      const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));

      return weeksDiff + 1;
    };

    const toDateKey = (dateString: string): string => {
      const date = new Date(dateString);
      const kstTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      return kstTime.toISOString().split('T')[0];
    };

    for (const record of weeklyRecords) {
      const [startYear, startMonth, startDay] = record.start_date.split('-').map(Number);
      const [endYear, endMonth, endDay] = record.end_date.split('-').map(Number);
      const recordStartDate = new Date(startYear, startMonth - 1, startDay);
      const recordEndDate = new Date(endYear, endMonth - 1, endDay);


      const formatDateLabel = (dateString: string): string => {
        const parts = dateString.split('-');
        const month = parseInt(parts[1]).toString();
        const day = parseInt(parts[2]).toString();
        return `${month}.${day}`;
      };

      const label = `${formatDateLabel(record.start_date)}-${formatDateLabel(
        record.end_date
      )}`;

      const runningTypes: RunningTypes = {};

      const strengthWorkoutsByDate: Record<string, number> = {};
      const cardioWorkoutsByDate: Record<string, number> = {};

      const dateRange: Date[] = [];
      let currentDate = new Date(recordStartDate);
      while (currentDate <= recordEndDate) {
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
      const dailyRunnings: DailyRunning[] = [];

      weekdays.forEach((dayOfWeek, i) => {
        const dayDate = dateRange.find((date) => date.getDay() === (i + 1) % 7);

        let strengthCount = 0;
        let cardioValue = 0;
        if (dayDate) {
          const dateKey = dayDate.toISOString().split('T')[0];
          strengthCount = strengthWorkoutsByDate[dateKey] || 0;
          cardioValue = cardioWorkoutsByDate[dateKey] || 0;
        }
        const isWeekend = dayOfWeek === '토' || dayOfWeek === '일';
        const status: 'complete' | 'incomplete' | 'rest' = isWeekend
          ? 'rest'
          : cardioValue > 0
          ? 'complete'
          : 'incomplete';

        dailyRunnings.push({
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
        const [year, month, day] = challengePeriod.startDate.split('-').map(Number);
        const challengeStartDate = new Date(year, month - 1, day);
        correctWeekNumber = calculateWeekNumber(recordStartDate, challengeStartDate);
      } else {
        if (weeklyRecords.length > 0) {
          const sortedRecords = [...weeklyRecords].sort((a, b) =>
            new Date(a.start_date + 'T00:00:00Z').getTime() - new Date(b.start_date + 'T00:00:00Z').getTime()
          );
          const firstRecordStart = new Date(sortedRecords[0].start_date + 'T00:00:00Z');

          const firstDay = firstRecordStart.getDay();
          let firstWeekMonday = new Date(firstRecordStart);
          if (firstDay !== 1) {
            const daysSinceMonday = firstDay === 0 ? 6 : firstDay - 1;
            firstWeekMonday.setDate(firstWeekMonday.getDate() - daysSinceMonday);
          }

          const recordDay = recordStartDate.getDay();
          let recordWeekMonday = new Date(recordStartDate);
          if (recordDay !== 1) {
            const daysSinceMonday = recordDay === 0 ? 6 : recordDay - 1;
            recordWeekMonday.setDate(recordWeekMonday.getDate() - daysSinceMonday);
          }

          const timeDiff = recordWeekMonday.getTime() - firstWeekMonday.getTime();
          const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
          correctWeekNumber = weeksDiff + 1;
        }
      }

      if (!processedWeekNumbers.has(correctWeekNumber)) {
        processedWeekNumbers.add(correctWeekNumber);
        processedWeeklyRunnings.push({
          recordId: record.id,
          weekNumber: correctWeekNumber,
          label,
          totalAchievement: record.cardio_points_total || 0,
          runningTypes,
          dailyRunnings,
          totalSessions: record.strength_sessions_count || 0,
          requiredSessions: 3,
          feedback: feedbackData,
          cardioPointsTotal: record.cardio_points_total || 0,
        });
      }
    }
    processedWeeklyRunnings.sort((a, b) => a.weekNumber - b.weekNumber);

    return {
      name: user.name || user.displayName || '사용자',
      username: user.displayName || null,
      achievement:
        Math.round(stats.totalCardioPoints / weeklyRecords.length) || 0,
      weeklyRunnings: processedWeeklyRunnings,
    };
  };

  return {
    userData,
    loading,
    error,
    totalPoints,
    refetch: fetchUserRunningData,
  };
};
