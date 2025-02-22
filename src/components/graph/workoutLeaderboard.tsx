"use client";

import { useEffect, useState } from "react";

interface WorkoutLeaderboardProps {
  challengeId: string;
}

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_points: number;
  rank: number;
}

interface WorkoutData {
  user_id: string;
  user: {
    name: string;
  };
  points: number;
}

export default function WorkoutLeaderboard({
  challengeId,
}: WorkoutLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [maxPoints, setMaxPoints] = useState(0);

  useEffect(() => {
    async function fetchLeaderboardData() {
      try {
        const response = await fetch(
          `/api/workouts?challengeId=${challengeId}`
        );
        if (!response.ok) {
          throw new Error("운동 데이터 가져오기 실패");
        }
        const workouts: WorkoutData[] = await response.json();

        // 사용자별 포인트 합계 계산
        const userPoints = workouts.reduce(
          (
            acc: { [key: string]: { points: number; name: string } },
            workout
          ) => {
            const userId = workout.user_id;
            if (!acc[userId]) {
              acc[userId] = {
                points: 0,
                name: workout.user?.name || "알 수 없음",
              };
            }
            acc[userId].points += workout.points || 0;
            return acc;
          },
          {}
        );

        // 리더보드 데이터 형식으로 변환 및 정렬
        const formattedData = Object.entries(userPoints)
          .map(([userId, data]) => ({
            user_id: userId,
            user_name: data.name,
            total_points: data.points,
            rank: 0,
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
        console.error("리더보드 데이터 가져오기 실패:", error);
      }
    }

    if (challengeId) {
      fetchLeaderboardData();
    }
  }, [challengeId]);

  return (
    <div className="col-span-2 bg-white dark:bg-blue-3 rounded-[0.625rem] p-[1.25rem]">
      <h2 className="text-lg font-semibold mb-4 dark:text-gray-5 text-[#6F6F6F] pt-3">
        운동 리더보드
      </h2>
      <div className="space-y-4">
        {leaderboardData.map((entry) => (
          <div key={entry.user_id} className="flex items-center gap-4">
            <span className="w-8 text-center font-bold">{entry.rank}</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{entry.user_name}</span>
                <span className="text-sm text-gray-600">
                  {entry.total_points.toFixed(2)}pt
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-5 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((entry.total_points / maxPoints) * 100).toFixed(
                      2
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        {leaderboardData.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            아직 운동 기록이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
