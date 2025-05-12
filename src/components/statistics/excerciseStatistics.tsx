'use client';
import { ProcessedMeal } from '@/types/dietDetaileTableTypes';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import { ChallengeParticipant } from '@/types/userPageTypes';
import { useEffect, useState } from 'react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!selectedChallengeId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1. Fetch today's active member count
        const todayCountResponse = await fetch(
          `/api/workouts/user-detail?type=today-count&challengeId=${selectedChallengeId}`
        );

        if (!todayCountResponse.ok) {
          throw new Error(`오늘 카운트 API 오류: ${todayCountResponse.status}`);
        }

        const todayCountData = await todayCountResponse.json();
        setTodayStats(todayCountData);

        // 2. Fetch weekly chart data for total workout count and weekly average
        const weeklyResponse = await fetch(
          `/api/workouts/user-detail?type=weekly-chart&challengeId=${selectedChallengeId}`
        );

        if (!weeklyResponse.ok) {
          throw new Error(`주간 차트 API 오류: ${weeklyResponse.status}`);
        }

        const weeklyChartData = await weeklyResponse.json();

        // Calculate total workouts (total entries in cardio and strength)
        let totalCount = 0;

        if (weeklyChartData.cardio && Array.isArray(weeklyChartData.cardio)) {
          totalCount += weeklyChartData.cardio.length;
        }

        if (
          weeklyChartData.strength &&
          Array.isArray(weeklyChartData.strength)
        ) {
          totalCount += weeklyChartData.strength.length;
        }

        setTotalWorkouts(totalCount);

        // Calculate weekly average
        let avgPercentage = 0;
        if (weeklyChartData.cardio && weeklyChartData.cardio.length > 0) {
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
          const currentWeekData = weeklyChartData.cardio.filter((item) => {
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
      } catch (error) {
        console.error('운동 통계 데이터 불러오기 실패:', error);

        // Fallback to calculating from props
        const totalMembers =
          dailyRecords?.filter(
            (record) => record.challenges.id === selectedChallengeId
          )?.length ?? 0;

        setTodayStats({
          count: 0,
          total: totalMembers,
        });

        setTotalWorkouts(0);
        setWeeklyAverage(0);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [selectedChallengeId, selectedDate, dailyRecords]);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-1 gap-4 px-[2rem] pb-[3rem] sm:px-3">
        <div>
          <TotalFeedbackCounts
            counts={`${totalWorkouts}개`}
            title="전체 운동 업로드 수"
            borderColor="border-blue-5"
            textColor="text-blue-5"
            loading={loading}
          />
        </div>
        <div>
          <TotalFeedbackCounts
            counts={`${todayStats.count}`}
            total={`${todayStats.total} 명`}
            title="오늘 운동 업로드 멤버"
            borderColor="border-blue-5"
            textColor="text-blue-5"
            loading={loading}
          />
        </div>
        <div>
          <TotalFeedbackCounts
            counts={`${weeklyAverage}%`}
            total={''}
            title="이번주 평균 운동량"
            borderColor="border-green"
            textColor="text-green"
            loading={loading}
          />
        </div>
      </div>
    </>
  );
};

export { ExcerciseStatistics };
