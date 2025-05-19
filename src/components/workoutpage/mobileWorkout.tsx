'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DietTableSkeleton } from '../layout/skeleton';
import {
  WeekInfo,
  WorkoutItem,
  WeeklyChartData,
  LeaderboardEntry,
  TodayCountData,
} from '@/types/workoutTableTypes';

const formatDateToMMDD = (dateString: string | Date) => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}.${day}`;
};

const generateWeekLabels = (startDateStr: string, endDateStr: string) => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const weeks: WeekInfo[] = [];

  let current = new Date(startDate);
  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    weeks.push({
      label: `${formatDateToMMDD(weekStart)}-${formatDateToMMDD(weekEnd)}`,
      startDate: new Date(weekStart),
      endDate: new Date(weekEnd),
    });

    current.setDate(current.getDate() + 7);
  }

  return weeks;
};

const MobileWorkout: React.FC = () => {
  const { challengeId, userId } = useParams();
  const router = useRouter();
  const [userData, setUserData] = useState<WorkoutItem | null>(null);
  const [weekInfo, setWeekInfo] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchUserWorkoutData = useCallback(async () => {
    try {
      setLoading(true);

      const [chartRes, leaderboardRes] = await Promise.all([
        fetch(
          `/api/workouts/user-detail?type=weekly-chart&challengeId=${challengeId}`
        ),
        fetch(
          `/api/workouts/user-detail?type=leaderboard&challengeId=${challengeId}`
        ),
      ]);

      const chartData: WeeklyChartData = await chartRes.json();
      const leaderboard: LeaderboardEntry[] = await leaderboardRes.json();

      const userRes = await fetch(`/api/workouts/user-detail?userId=${userId}`);
      const userStats = await userRes.json();
      const user = chartData.users.find((u) => u.id === userId);

      const weeks = generateWeekLabels(
        chartData.challengePeriod.startDate,
        chartData.challengePeriod.endDate
      );
      setWeekInfo(weeks);

      const userWeeklyData = weeks.map((week, idx) => {
        const cardioPoints = chartData.cardio
          .filter((c) => c.userId === userId && c.x === week.label)
          .reduce((sum, c) => sum + c.y, 0);

        const strengthSessions = chartData.strength.filter(
          (s) => s.userId === userId && s.x === week.label
        ).length;

        return {
          weekNumber: idx + 1,
          startDate: week.label.split('-')[0],
          endDate: week.label.split('-')[1],
          aerobicPercentage: cardioPoints,
          actualPercentage: cardioPoints,
          strengthSessions,
        };
      });

      setUserData({
        id: user?.id || '',
        challenge_id: challengeId as string,
        userId: userId as string,
        userName: user?.name?.split(' ')[0] || '유저',
        name: user?.name || '유저',
        weeklyData: userWeeklyData,
        hasUploaded: leaderboard.find((l) => l.user_id === userId)?.points > 0,
        totalAchievements: userStats?.stats?.totalCardioPoints || 0,
        activeThisWeek: true,
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setApiError('유저 데이터를 불러오는 데 실패했습니다.');
      setLoading(false);
    }
  }, [challengeId, userId]);

  useEffect(() => {
    fetchUserWorkoutData();
  }, [fetchUserWorkoutData]);

  if (loading) return <DietTableSkeleton />;
  if (apiError || !userData)
    return <div className="p-4 text-red-500">{apiError || '데이터 없음'}</div>;

  return (
    <div className="w-full px-4 mt-6 lg:hidden md:hidden ">
      <div className="bg-white shadow-md rounded-2xl p-4 space-y-3">
        <div className="text-xl font-semibold text-gray-800">
          {userData.name} 님
        </div>

        {weekInfo.map((week, idx) => {
          const weekNumber = idx + 1;
          const data = userData.weeklyData.find(
            (w) =>
              `${w.startDate}-${w.endDate}` === week.label ||
              w.weekNumber === weekNumber
          );

          return (
            <div
              key={idx}
              className="flex justify-between items-center p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition"
              onClick={() =>
                router.push(
                  `/user/${userData.challenge_id}/workout/${userData.userId}/${weekNumber}`
                )
              }
            >
              <div className="text-sm text-gray-600">
                {weekNumber}주차 <br />
                <span className="text-xs text-gray-400">{week.label}</span>
              </div>
              <div className="text-right text-sm font-medium text-blue-600">
                {data ? data.aerobicPercentage.toFixed(1) : 0}% <br />
                {data ? data.strengthSessions : 0}회
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="mt-6 text-gray-400 font-bold hover:font-extrabold"
        onClick={() => router.push(`/user/${challengeId}/workout`)}
      >
        ← 목록으로 돌아가기
      </button>
    </div>
  );
};

export default MobileWorkout;
