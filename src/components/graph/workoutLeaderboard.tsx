'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface WorkoutLeaderboardProps {
  challengeId: string;
}

type Period = 'weekly' | 'all';

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_points: number;
  rank: number;
  strengthWorkoutCount: number;
}

interface WorkoutData {
  user_id: string;
  user: {
    name: string;
    strengthWorkoutCount: number;
  };
  points: number;
}

export default function WorkoutLeaderboard({
  challengeId,
}: WorkoutLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [usersData, setUsersData] = useState([]);
  const [maxPoints, setMaxPoints] = useState(0);
  const [period, setPeriod] = useState<Period>('weekly');

  useEffect(() => {
    async function fetchLeaderboardData() {
      try {
        // challengeId가 유효한지 확인
        if (!challengeId) {
          // console.error('유효하지 않은 challengeId:', challengeId);
          setLeaderboardData([]);
          return;
        }

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // console.log(
        //   `리더보드 조회기간: ${
        //     period === "weekly"
        //       ? `${weekAgo.toISOString()} ~ ${now.toISOString()}`
        //       : `전체 기간 (~ ${now.toISOString()})`
        //   }`
        // );

        const response = await fetch(
          `/api/workouts?challengeId=${challengeId}&period=${period}`
        );
        if (!response.ok) {
          throw new Error('운동 데이터 가져오기 실패');
        }
        const workouts: WorkoutData[] = await response.json();

        // 사용자별 포인트 합계 계산
        const userPoints = workouts.reduce(
          (
            acc: {
              [key: string]: {
                points: number;
                name: string;
                strengthWorkoutCount: number;
              };
            },
            workout
          ) => {
            const userId = workout.user_id;
            if (!acc[userId]) {
              acc[userId] = {
                points: 0,
                name: workout.user?.name || '알 수 없음',
                strengthWorkoutCount: workout.user?.strengthWorkoutCount,
              };
            }
            acc[userId].points += workout.points || 0;
            return acc;
          },
          {}
        );

        // console.log('userPoints', userPoints);
        // 리더보드 데이터 형식으로 변환 및 정렬
        const formattedData = Object.entries(userPoints)
          .map(([userId, data]) => ({
            user_id: userId,
            user_name: data.name,
            total_points: data.points,
            rank: 0,
            strengthWorkoutCount: data.strengthWorkoutCount,
          }))
          .sort((a, b) => b.total_points - a.total_points)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        setLeaderboardData(formattedData);
        const maxPoints = Math.max(
          ...formattedData.map((entry) => entry.total_points)
        );
        setMaxPoints(maxPoints || 1);
      } catch (error) {
        // console.error('리더보드 데이터 가져오기 실패:', error);
      }
    }

    if (challengeId) {
      fetchLeaderboardData();
    }
  }, [challengeId, period]); // period 상태가 변경될 때마다 데이터 다시 불러오기

  return (
    <div className="col-span-2 bg-white dark:bg-blue-4 rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-100 shadow border border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-gray-4 text-[#6F6F6F] pt-1 pl-1">
          운동 리더보드
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 rounded-full text-xs ${
              period === 'weekly'
                ? 'bg-blue-5 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-4'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1 rounded-full text-xs ${
              period === 'all'
                ? 'bg-blue-5 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-4'
            }`}
          >
            전체
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="text-right text-0.7-500 text-gray-5">
          유산소포인트/근력횟수
        </div>
        {leaderboardData.map((entry) => {
          //  console.log('leaderboardData', leaderboardData);
          return (
            <div key={entry.user_id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 text-center font-bold text-[#6F6F6F] dark:text-gray-4 text-[14px]">
                {entry.rank}
              </div>
              <div className="col-span-3 font-medium text-[#6F6F6F] dark:text-gray-4 text-[12px]">
                {entry.user_name.split(' ')[0]}
              </div>
              <div className="col-span-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (entry.total_points / 100) * 100,
                      100
                    )}%`,
                    background:
                      'linear-gradient(90deg, #FF007A 0%, #FF70AC 100%)',
                  }}
                />
                {entry.total_points >= 100 && (
                  <div className="absolute -right-2 -top-2">
                    <Image
                      src="/svg/fire.svg"
                      alt="fire"
                      width={15}
                      height={20}
                    />
                  </div>
                )}
              </div>
              <div className="col-span-4 text-right text-[12px] text-[#6F6F6F] dark:text-gray-4">
                {entry.total_points.toFixed(1)}pt/
                {entry.strengthWorkoutCount}회
              </div>
            </div>
          );
        })}
        {leaderboardData.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-5 py-4">
            아직 운동 기록이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
