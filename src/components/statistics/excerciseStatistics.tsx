'use client';
import { ProcessedMeal } from '@/types/dietDetaileTableTypes';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import { ChallengeParticipant } from '@/types/userPageTypes';
import { useEffect, useState } from 'react';
import { useWorkoutDataQuery } from '../hooks/useWorkoutDataQuery';

interface ExcerciseStatsProps {
  processedMeals: ProcessedMeal[];
  selectedChallengeId?: string;
  dailyRecords?: ChallengeParticipant[];
  selectedDate: string;
}

const ExcerciseStatistics = ({
  processedMeals,
  selectedChallengeId,
  dailyRecords,
  selectedDate,
}: ExcerciseStatsProps) => {
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [todayStats, setTodayStats] = useState({ count: 0, total: 0 });
  const [weeklyAverage, setWeeklyAverage] = useState(0);

  // React Query 훅 사용
  const { weeklyChart, todayCount, isLoading } = useWorkoutDataQuery(selectedChallengeId || '');

  useEffect(() => {
    if (todayCount) {
      setTodayStats(todayCount);
    }

    if (weeklyChart) {
      // Calculate total workouts (total entries in cardio and strength)
      let totalCount = 0;

      if (weeklyChart.cardio && Array.isArray(weeklyChart.cardio)) {
        totalCount += weeklyChart.cardio.length;
      }

      if (weeklyChart.strength && Array.isArray(weeklyChart.strength)) {
        totalCount += weeklyChart.strength.length;
      }

      setTotalWorkouts(totalCount);

      // Calculate weekly average
      let avgPercentage = 0;
      if (weeklyChart.cardio && weeklyChart.cardio.length > 0) {
        // Get current week's data
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Filter cardio data for current week
        const currentWeekData = weeklyChart.cardio.filter((item) => {
          const itemDate = new Date(item.date);
          return itemDate >= startOfWeek && itemDate <= endOfWeek;
        });

        if (currentWeekData.length > 0) {
          const totalPercentage = currentWeekData.reduce(
            (sum, item) => sum + item.y,
            0
          );
          avgPercentage = parseFloat(
            (totalPercentage / currentWeekData.length).toFixed(1)
          );
        }
      }
      setWeeklyAverage(avgPercentage);
    }
  }, [weeklyChart, todayCount]);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-1 gap-4 px-8 pb-[3rem] sm:px-3">
        <div>
          <TotalFeedbackCounts
            counts={`${totalWorkouts}개`}
            title="전체 운동 업로드 수"
            borderColor="border-blue-5"
            textColor="text-blue-5"
            loading={isLoading}
          />
        </div>
        <div>
          <TotalFeedbackCounts
            counts={`${todayStats.count}`}
            total={`${todayStats.total} 명`}
            title="오늘 운동 업로드 멤버"
            borderColor="border-blue-5"
            textColor="text-blue-5"
            loading={isLoading}
          />
        </div>
        <div>
          <TotalFeedbackCounts
            counts={`${weeklyAverage}점`}
            title="주간 평균 운동점수"
            borderColor="border-blue-5"
            textColor="text-blue-5"
            loading={isLoading}
          />
        </div>
      </div>
    </>
  );
};

export { ExcerciseStatistics };