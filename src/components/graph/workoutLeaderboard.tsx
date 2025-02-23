"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface WorkoutLeaderboardProps {
  challengeId: string;
}

type Period = "weekly" | "all";

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
  const [period, setPeriod] = useState<Period>("weekly");

  useEffect(() => {
    async function fetchLeaderboardData() {
      try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        console.log(
          `리더보드 조회기간: ${
            period === "weekly"
              ? `${weekAgo.toISOString()} ~ ${now.toISOString()}`
              : `전체 기간 (~ ${now.toISOString()})`
          }`
        );

        const response = await fetch(
          `/api/workouts?challengeId=${challengeId}&period=${period}`
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
  }, [challengeId, period]); // period 상태가 변경될 때마다 데이터 다시 불러오기

  return (
    <div className="col-span-2 bg-white dark:bg-blue-3 rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-100 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-gray-5 text-[#6F6F6F] pt-1 pl-1">
          운동 리더보드
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1 rounded-full text-sm ${
              period === "weekly"
                ? "bg-blue-5 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setPeriod("all")}
            className={`px-3 py-1 rounded-full text-sm ${
              period === "all"
                ? "bg-blue-5 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            전체
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {leaderboardData.map((entry) => (
          <div key={entry.user_id} className="flex items-center gap-4">
            <span className="w-6 text-center font-bold text-[#6F6F6F] text-[14px]">
              {entry.rank}
            </span>
            <div className="flex-1 flex items-center gap-2">
              <span className="font-medium text-[#6F6F6F] w-[70px] text-[14px]">
                {entry.user_name.split(" ")[0]}
              </span>
              <div className="w-[100px] sm:w-[60px] bg-gray-200 rounded-full h-2 relative">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (entry.total_points / 100) * 100,
                      100
                    )}%`,
                    background:
                      "linear-gradient(90deg, #FF007A 0%, #FF70AC 100%)",
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
              <div className="flex items-center gap-1 w-[80px] justify-end">
                <span className="text-[14px] sm:text-[12px] text-[#6F6F6F]">
                  {entry.total_points.toFixed(2)}pt
                </span>
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
