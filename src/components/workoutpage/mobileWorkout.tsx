'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkoutData } from '@/components/hooks/useWorkoutData';

export interface MobileWorkoutProps {
  challengeId?: string;
}

const useUserInfo = (userId: string) => {
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user?userId=${userId}`);
        if (!res.ok) throw new Error('유저 정보 로딩 실패');
        const data = await res.json();
        setName(data.name || '알 수 없음');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserInfo();
  }, [userId]);

  return { name, loading, error };
};

function formatMMDD(date: Date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}.${day}`;
}

function generateWeekLabels(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const weeks: { weekNumber: number; label: string }[] = [];
  let current = new Date(startDate);
  let index = 1;

  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const label = `${formatMMDD(weekStart)}-${formatMMDD(weekEnd)}`;
    weeks.push({ weekNumber: index, label });

    current.setDate(current.getDate() + 7);
    index++;
  }

  return weeks;
}
const MobileWorkout: React.FC<MobileWorkoutProps> = ({}) => {
  const params = useParams();
  const userId = params.userId as string;
  const challengeId = params.challengeId as string;
  const router = useRouter();
  const [weekLabels, setWeekLabels] = useState<
    { weekNumber: number; label: string }[]
  >([]);

  const {
    userData,
    loading,
    error: apiError,
    totalPoints,
  } = useWorkoutData(userId, challengeId);
  const { name: fetchedUserName } = useUserInfo(userId);

  const { currentWeekIndex, lastWeekIndex } = useMemo(() => {
    if (!userData || !userData.weeklyWorkouts.length)
      return { currentWeekIndex: 0, lastWeekIndex: 0 };
    const today = new Date();
    let currentIdx = 0;
    let lastIdx = Math.max(0, userData.weeklyWorkouts.length - 2);

    userData.weeklyWorkouts.forEach((week, idx) => {
      const dateParts = week.label.split('-');
      if (dateParts.length === 2) {
        const endDateParts = dateParts[1].split('.');
        if (endDateParts.length === 2) {
          const endMonth = parseInt(endDateParts[0]);
          const endDay = parseInt(endDateParts[1]);
          const weekEndDate = new Date(
            today.getFullYear(),
            endMonth - 1,
            endDay
          );
          if (today <= weekEndDate) {
            currentIdx = idx;
            lastIdx = Math.max(0, idx - 1);
          }
        }
      }
    });
    return { currentWeekIndex: currentIdx, lastWeekIndex: lastIdx };
  }, [userData]);

  useEffect(() => {
    const fetchTotalWeeks = async () => {
      const res = await fetch(
        `/api/workouts?type=challenge-weeks&challengeId=${challengeId}`
      );
      const data = await res.json();
      if (res.ok && data.startDate && data.endDate) {
        setWeekLabels(generateWeekLabels(data.startDate, data.endDate));
      }
    };
    if (challengeId) fetchTotalWeeks();
  }, [challengeId]);

  if (loading || !userData) return <div>로딩 중...</div>;

  const workoutItem = {
    id: userId,
    challenge_id: challengeId,
    userId: userId,
    userName: fetchedUserName.split(' ')[0] || 'User',
    name: fetchedUserName || '유저',
    weeklyData: userData.weeklyWorkouts.map((week, idx) => {
      const [start, end] = week.label.split('-').map((s) => s.trim());
      return {
        weekNumber: idx + 1,
        startDate: start || '',
        endDate: end || '',
        aerobicPercentage: Math.round(week.cardio || 0),
        strengthSessions: week.strengthSessions || 0,
        actualPercentage: Math.round(week.actualCardio || 0),
      };
    }),
  };

  return (
    <div className="w-full overflow-x-auto px-2 mt-6 sm:block md:hidden lg:hidden">
      <table className="min-w-[600px] w-full border-collapse text-sm">
        <thead>
          <tr className="text-[#A1A1A1] border-b">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">이름</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2 font-medium text-gray-800">
              {workoutItem.userName}
              <br />
              <span className="text-gray-400 text-xs">
                #{workoutItem.userId.slice(-4)}
              </span>
            </td>
            <td className="p-2 text-gray-700">{workoutItem.name}</td>
          </tr>
          <tr>
            <td colSpan={2}>
              <div className="flex gap-2 overflow-x-auto pt-2 pb-4">
                {weekLabels.map((week, idx) => {
                  const data = workoutItem.weeklyData.find(
                    (d) => `${d.startDate}-${d.endDate}` === week.label
                  );

                  return (
                    <div
                      key={idx}
                      className="min-w-[100px] flex-shrink-0 text-center text-blue-600 font-semibold cursor-pointer hover:underline border rounded px-2 py-1"
                      onClick={() =>
                        router.push(
                          `/user/${workoutItem.challenge_id}/workout/${week.weekNumber}/${workoutItem.userId}`
                        )
                      }
                    >
                      {week.weekNumber}주차
                      <br />
                      {data
                        ? `${data.aerobicPercentage}% / ${data.strengthSessions}회`
                        : `0% / 0회`}
                    </div>
                  );
                })}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MobileWorkout;
