'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_distance: number;
  total_points: number;
  rank: number;
}

type SortMetric = 'distance' | 'points';
type Period = 'weekly' | 'all';

interface RunningLeaderboardProps {
  challengeId: string;
  startDate?: string;
  endDate?: string;
}

const fetchDistanceLeaderboard = async (
  challengeId: string,
  period: Period,
  weekStart?: string,
  weekEnd?: string
) => {
  let url = `/api/workouts/user-detail?type=distance-leaderboard&challengeId=${challengeId}&period=${period}&t=${Date.now()}`;
  if (period === 'weekly' && weekStart && weekEnd) {
    url += `&weekStart=${weekStart}&weekEnd=${weekEnd}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
};

// 주차 목록 생성 함수
const generateWeeks = (startDate: string, endDate: string) => {
  const weeks: { label: string; startDate: string; endDate: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 시작일이 포함된 주의 월요일 찾기
  const startDay = start.getDay();
  const firstMonday = new Date(start);
  if (startDay !== 1) {
    const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
    firstMonday.setDate(firstMonday.getDate() - daysSinceMonday);
  }

  let weekNum = 1;
  let currentStart = new Date(firstMonday);

  while (currentStart <= end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);

    const startMonth = currentStart.getMonth() + 1;
    const startDateNum = currentStart.getDate();
    const endMonth = currentEnd.getMonth() + 1;
    const endDateNum = currentEnd.getDate();

    weeks.push({
      label: `W${weekNum} (${startMonth}.${startDateNum}-${endMonth}.${endDateNum})`,
      startDate: currentStart.toISOString().split('T')[0],
      endDate: currentEnd.toISOString().split('T')[0],
    });

    weekNum++;
    currentStart.setDate(currentStart.getDate() + 7);
  }

  return weeks;
};

export default function RunningLeaderboard({ challengeId, startDate, endDate }: RunningLeaderboardProps) {
  const [sortMetric, setSortMetric] = useState<SortMetric>('distance');
  const [period, setPeriod] = useState<Period>('weekly');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(-1);

  // 주차 목록 생성
  const weeks = useMemo(() => {
    if (!startDate || !endDate) return [];
    return generateWeeks(startDate, endDate);
  }, [startDate, endDate]);

  // 현재 주차 자동 선택 (초기값)
  useEffect(() => {
    if (weeks.length > 0 && selectedWeekIndex === -1) {
      const today = new Date().toISOString().split('T')[0];
      const currentWeekIdx = weeks.findIndex(
        (w) => w.startDate <= today && w.endDate >= today
      );
      if (currentWeekIdx >= 0) {
        setSelectedWeekIndex(currentWeekIdx);
      } else {
        // 현재 주차를 못 찾으면 마지막 주차
        setSelectedWeekIndex(weeks.length - 1);
      }
    }
  }, [weeks, selectedWeekIndex]);

  const selectedWeek = selectedWeekIndex >= 0 ? weeks[selectedWeekIndex] : undefined;

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['running', 'distance-leaderboard', challengeId, period, selectedWeek?.startDate, selectedWeek?.endDate],
    queryFn: () => fetchDistanceLeaderboard(
      challengeId,
      period,
      selectedWeek?.startDate,
      selectedWeek?.endDate
    ),
    enabled: !!challengeId && (period === 'all' || !!selectedWeek),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="col-span-2 bg-white dark:bg-gray-8 rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-2 bg-white dark:bg-gray-8 rounded-[0.625rem] p-[1.25rem] h-[36rem] shadow">
        <p className="text-red-500">리더보드를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  // 정렬 적용
  const sortedLeaderboard = [...(leaderboard || [])].sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
    if (sortMetric === 'distance') {
      return b.total_distance - a.total_distance;
    }
    return b.total_points - a.total_points;
  });

  // 최대값 계산 (100km 또는 100pt 기준)
  const maxValue = sortMetric === 'distance' ? 100 : 100;

  return (
    <div className="col-span-2 bg-white dark:bg-gray-8 rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-100 shadow">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold dark:text-gray-5 text-[#6F6F6F] pt-1 pl-1">
            리더보드
          </h2>
          <div className="flex items-center gap-1.5">
            {/* 거리/운동량 토글 */}
            <div className="flex rounded-full bg-gray-100 dark:bg-blue-4 p-0.5">
              <button
                onClick={() => setSortMetric('distance')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  sortMetric === 'distance'
                    ? 'bg-white dark:bg-blue-5 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-6 hover:text-gray-700'
                }`}
              >
                거리
              </button>
              <button
                onClick={() => setSortMetric('points')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  sortMetric === 'points'
                    ? 'bg-white dark:bg-blue-5 text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-6 hover:text-gray-700'
                }`}
              >
                운동량
              </button>
            </div>
            {/* 주간/전체 토글 */}
            <div className="flex rounded-full bg-gray-100 dark:bg-blue-4 p-0.5">
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  period === 'weekly'
                    ? 'bg-white dark:bg-blue-5 text-gray-700 dark:text-gray-4 shadow-sm'
                    : 'text-gray-500 dark:text-gray-6 hover:text-gray-700'
                }`}
              >
                주간
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  period === 'all'
                    ? 'bg-white dark:bg-blue-5 text-gray-700 dark:text-gray-4 shadow-sm'
                    : 'text-gray-500 dark:text-gray-6 hover:text-gray-700'
                }`}
              >
                전체
              </button>
            </div>
          </div>
        </div>
        {/* 주차 선택 (주간 선택 시에만 표시) */}
        {period === 'weekly' && weeks.length > 0 && (
          <div className="flex justify-end">
            <select
              value={selectedWeekIndex}
              onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
              className="px-2 py-1 rounded-lg text-[10px] bg-gray-100 dark:bg-blue-4 text-gray-600 dark:text-gray-5 border-none outline-none cursor-pointer"
            >
              {weeks.map((week, idx) => {
                const today = new Date().toISOString().split('T')[0];
                if (week.startDate > today) return null;
                return (
                  <option key={idx} value={idx}>
                    {week.label}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="text-right text-0.7-500 text-gray-5">
          {sortMetric === 'distance' ? '총 거리 (km)' : '총 운동량 (pt)'}
        </div>
        {sortedLeaderboard.map((entry: LeaderboardEntry, index: number) => {
          const value = sortMetric === 'distance' ? entry.total_distance : entry.total_points;
          const displayValue = sortMetric === 'distance'
            ? `${value.toFixed(2)}km`
            : `${value.toFixed(1)}pt`;

          return (
            <div key={entry.user_id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 text-center font-bold text-[#6F6F6F] dark:text-gray-4 text-[14px]">
                {index + 1}
              </div>
              <div className="col-span-3 font-medium text-[#6F6F6F] dark:text-gray-4 text-[12px]">
                {entry.user_name?.split(' ')[0] || '유저'}
              </div>
              <div className="col-span-5 bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((value / maxValue) * 100, 100)}%`,
                    background: sortMetric === 'distance'
                      ? 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)'
                      : 'linear-gradient(90deg, #FF007A 0%, #FF70AC 100%)',
                  }}
                />
                {value >= maxValue && (
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
              <div className="col-span-3 text-right text-[12px] text-[#6F6F6F] dark:text-gray-4">
                {displayValue}
              </div>
            </div>
          );
        })}
        {sortedLeaderboard.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-5 py-4">
            아직 러닝 기록이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
