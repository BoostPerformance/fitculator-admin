'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

type MetricType = 'points' | 'distance';
type PeriodType = 'weekly' | 'monthly' | 'total';

interface LeaderboardConfig {
  metrics: Array<{ metric: MetricType; period: PeriodType }>;
}

interface LeaderboardProps {
  challengeId: string;
  startDate?: string;
  endDate?: string;
  leaderboardConfig: LeaderboardConfig;
}

interface PointsWorkoutData {
  user_id: string;
  user: {
    name: string;
    strengthWorkoutCount: number;
  };
  points: number;
}

interface DistanceLeaderboardEntry {
  user_id: string;
  user_name: string;
  total_distance: number;
  total_points: number;
  rank: number;
}

// --- Utility: generate weeks ---
const generateWeeks = (startDate: string, endDate: string) => {
  const weeks: { label: string; startDate: string; endDate: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

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

// --- Utility: generate months ---
const generateMonths = (startDate: string, endDate: string) => {
  const months: { label: string; startDate: string; endDate: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // last day of month

    months.push({
      label: `${year}.${month + 1}`,
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0],
    });

    current = new Date(year, month + 1, 1);
  }

  return months;
};

// --- API fetchers ---
const fetchPointsLeaderboard = async (
  challengeId: string,
  period: PeriodType,
  rangeStart?: string,
  rangeEnd?: string
) => {
  const apiPeriod = period === 'total' ? 'all' : 'weekly';
  let url = `/api/workouts/user-detail?type=leaderboard&challengeId=${challengeId}&period=${apiPeriod}&t=${Date.now()}`;
  if (rangeStart && rangeEnd) {
    url += `&weekStart=${rangeStart}&weekEnd=${rangeEnd}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch points leaderboard');
  return response.json();
};

const fetchDistanceLeaderboard = async (
  challengeId: string,
  period: PeriodType,
  rangeStart?: string,
  rangeEnd?: string
) => {
  const apiPeriod = period === 'total' ? 'all' : 'weekly';
  let url = `/api/workouts/user-detail?type=distance-leaderboard&challengeId=${challengeId}&period=${apiPeriod}&t=${Date.now()}`;
  if (rangeStart && rangeEnd) {
    url += `&weekStart=${rangeStart}&weekEnd=${rangeEnd}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch distance leaderboard');
  return response.json();
};

export default function Leaderboard({
  challengeId,
  startDate,
  endDate,
  leaderboardConfig,
}: LeaderboardProps) {
  // Extract available metrics and periods from config
  const availableMetrics = useMemo(() => {
    const metrics = new Set<MetricType>();
    leaderboardConfig.metrics.forEach((m) => metrics.add(m.metric));
    return Array.from(metrics);
  }, [leaderboardConfig]);

  const [selectedMetric, setSelectedMetric] = useState<MetricType>(availableMetrics[0]);

  // Get available periods for the selected metric
  const availablePeriods = useMemo(() => {
    return leaderboardConfig.metrics
      .filter((m) => m.metric === selectedMetric)
      .map((m) => m.period);
  }, [leaderboardConfig, selectedMetric]);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(availablePeriods[0]);

  // Reset period when metric changes if current period isn't available
  useEffect(() => {
    if (!availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(availablePeriods[0]);
    }
  }, [availablePeriods, selectedPeriod]);

  // Generate weeks / months
  const weeks = useMemo(() => {
    if (!startDate || !endDate) return [];
    return generateWeeks(startDate, endDate);
  }, [startDate, endDate]);

  const months = useMemo(() => {
    if (!startDate || !endDate) return [];
    return generateMonths(startDate, endDate);
  }, [startDate, endDate]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(-1);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(-1);

  // Auto-select current week
  useEffect(() => {
    if (weeks.length > 0 && selectedWeekIndex === -1) {
      const today = new Date().toISOString().split('T')[0];
      const idx = weeks.findIndex((w) => w.startDate <= today && w.endDate >= today);
      setSelectedWeekIndex(idx >= 0 ? idx : weeks.length - 1);
    }
  }, [weeks, selectedWeekIndex]);

  // Auto-select current month
  useEffect(() => {
    if (months.length > 0 && selectedMonthIndex === -1) {
      const today = new Date().toISOString().split('T')[0];
      const idx = months.findIndex((m) => m.startDate <= today && m.endDate >= today);
      setSelectedMonthIndex(idx >= 0 ? idx : months.length - 1);
    }
  }, [months, selectedMonthIndex]);

  // Determine date range based on period
  const dateRange = useMemo(() => {
    if (selectedPeriod === 'weekly') {
      const week = selectedWeekIndex >= 0 ? weeks[selectedWeekIndex] : undefined;
      return week ? { start: week.startDate, end: week.endDate } : undefined;
    }
    if (selectedPeriod === 'monthly') {
      const month = selectedMonthIndex >= 0 ? months[selectedMonthIndex] : undefined;
      return month ? { start: month.startDate, end: month.endDate } : undefined;
    }
    // total: use challenge start/end dates
    return { start: startDate, end: endDate };
  }, [selectedPeriod, selectedWeekIndex, selectedMonthIndex, weeks, months]);

  const isQueryEnabled =
    !!challengeId && !!dateRange?.start && !!dateRange?.end;

  // Points query
  const {
    data: pointsData,
    isLoading: pointsLoading,
    error: pointsError,
  } = useQuery({
    queryKey: ['leaderboard', 'points', challengeId, selectedPeriod, dateRange?.start, dateRange?.end],
    queryFn: () => fetchPointsLeaderboard(challengeId, selectedPeriod, dateRange?.start, dateRange?.end),
    enabled: isQueryEnabled && selectedMetric === 'points',
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Distance query
  const {
    data: distanceData,
    isLoading: distanceLoading,
    error: distanceError,
  } = useQuery({
    queryKey: ['leaderboard', 'distance', challengeId, selectedPeriod, dateRange?.start, dateRange?.end],
    queryFn: () => fetchDistanceLeaderboard(challengeId, selectedPeriod, dateRange?.start, dateRange?.end),
    enabled: isQueryEnabled && selectedMetric === 'distance',
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const isLoading = selectedMetric === 'points' ? pointsLoading : distanceLoading;
  const error = selectedMetric === 'points' ? pointsError : distanceError;

  // Transform points data
  const pointsLeaderboard = useMemo(() => {
    if (!pointsData || !Array.isArray(pointsData)) return [];

    type UserPointsMap = {
      [key: string]: { points: number; name: string; strengthWorkoutCount: number };
    };

    const userPoints: UserPointsMap = pointsData.reduce(
      (acc: UserPointsMap, workout: PointsWorkoutData) => {
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
      {} as UserPointsMap
    );

    return Object.entries(userPoints)
      .map(([userId, data]) => ({
        user_id: userId,
        user_name: data.name,
        total_points: data.points,
        strengthWorkoutCount: data.strengthWorkoutCount,
        rank: 0,
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [pointsData]);

  // Transform distance data
  const distanceLeaderboard = useMemo(() => {
    if (!distanceData || !Array.isArray(distanceData)) return [];
    return [...distanceData]
      .sort((a: DistanceLeaderboardEntry, b: DistanceLeaderboardEntry) => b.total_distance - a.total_distance)
      .map((entry: DistanceLeaderboardEntry, index: number) => ({ ...entry, rank: index + 1 }));
  }, [distanceData]);

  // Period label map
  const periodLabels: Record<PeriodType, string> = {
    weekly: '주간',
    monthly: '월간',
    total: '전체',
  };

  if (isLoading) {
    return (
      <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto shadow dark:shadow-neutral-900 border border-line">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-sunken rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-surface-raised rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] shadow dark:shadow-neutral-900 border border-line">
        <p className="text-red-500">리더보드를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  const renderEntries = () => {
    if (selectedMetric === 'points') {
      return pointsLeaderboard.map((entry) => (
        <div key={entry.user_id} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-1 text-center font-bold text-content-tertiary text-[14px]">
            {entry.rank}
          </div>
          <div className="col-span-3 font-medium text-content-tertiary text-[12px]">
            {entry.user_name.split(' ')[0]}
          </div>
          <div className="col-span-4 bg-surface-sunken rounded-full h-2 relative">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((entry.total_points / 100) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #FF007A 0%, #FF70AC 100%)',
              }}
            />
            {entry.total_points >= 100 && (
              <div className="absolute -right-2 -top-2">
                <Image src="/svg/fire.svg" alt="fire" width={15} height={20} />
              </div>
            )}
          </div>
          <div className="col-span-4 text-right text-[12px] text-content-tertiary">
            {entry.total_points.toFixed(1)}pt/{entry.strengthWorkoutCount}회
          </div>
        </div>
      ));
    }

    // distance
    return distanceLeaderboard.map((entry: DistanceLeaderboardEntry & { rank: number }) => (
      <div key={entry.user_id} className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-1 text-center font-bold text-content-tertiary text-[14px]">
          {entry.rank}
        </div>
        <div className="col-span-3 font-medium text-content-tertiary text-[12px]">
          {entry.user_name?.split(' ')[0] || '유저'}
        </div>
        <div className="col-span-5 bg-surface-sunken rounded-full h-2 relative">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((entry.total_distance / 100) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
            }}
          />
          {entry.total_distance >= 100 && (
            <div className="absolute -right-2 -top-2">
              <Image src="/svg/fire.svg" alt="fire" width={15} height={20} />
            </div>
          )}
        </div>
        <div className="col-span-3 text-right text-[12px] text-content-tertiary">
          {entry.total_distance.toFixed(2)}km
        </div>
      </div>
    ));
  };

  const isEmpty =
    (selectedMetric === 'points' && pointsLeaderboard.length === 0) ||
    (selectedMetric === 'distance' && distanceLeaderboard.length === 0);

  const selectedWeek = selectedWeekIndex >= 0 ? weeks[selectedWeekIndex] : undefined;

  return (
    <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-surface-raised dark:[&::-webkit-scrollbar-track]:bg-neutral-700 shadow dark:shadow-neutral-900 border border-line">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-content-tertiary pt-1 pl-1">
            리더보드
          </h2>
          <div className="flex items-center gap-1.5">
            {/* Metric toggle (only if 2+ metrics) */}
            {availableMetrics.length > 1 && (
              <div className="flex rounded-full bg-surface-raised p-0.5">
                {availableMetrics.map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                      selectedMetric === metric
                        ? metric === 'distance'
                          ? 'bg-surface text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'bg-surface text-pink-600 dark:text-pink-400 shadow-sm'
                        : 'text-content-tertiary hover:text-content-secondary'
                    }`}
                  >
                    {metric === 'points' ? '운동량' : '거리'}
                  </button>
                ))}
              </div>
            )}
            {/* Period toggle (only if 2+ periods for this metric) */}
            {availablePeriods.length > 1 && (
              <div className="flex rounded-full bg-surface-raised p-0.5">
                {availablePeriods.map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                      selectedPeriod === period
                        ? 'bg-surface text-content-secondary shadow-sm'
                        : 'text-content-tertiary hover:text-content-secondary'
                    }`}
                  >
                    {periodLabels[period]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Week dropdown */}
        {selectedPeriod === 'weekly' && weeks.length > 0 && (
          <div className="flex justify-end">
            <select
              value={selectedWeekIndex}
              onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
              className="px-2 py-1 rounded-lg text-[10px] bg-surface-raised text-content-secondary border-none outline-none cursor-pointer"
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

        {/* Month dropdown */}
        {selectedPeriod === 'monthly' && months.length > 0 && (
          <div className="flex justify-end">
            <select
              value={selectedMonthIndex}
              onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
              className="px-2 py-1 rounded-lg text-[10px] bg-surface-raised text-content-secondary border-none outline-none cursor-pointer"
            >
              {months.map((month, idx) => {
                const today = new Date().toISOString().split('T')[0];
                if (month.startDate > today) return null;
                return (
                  <option key={idx} value={idx}>
                    {month.label}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-right text-label-sm font-medium text-content-tertiary">
          {selectedMetric === 'points' ? '유산소포인트/근력횟수' : '총 거리 (km)'}
        </div>
        {renderEntries()}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-content-tertiary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mb-3 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">
              {selectedPeriod === 'weekly' && selectedWeek
                ? `${selectedWeek.label} 기록이 없습니다`
                : selectedPeriod === 'monthly' && selectedMonthIndex >= 0
                  ? `${months[selectedMonthIndex]?.label} 기록이 없습니다`
                  : '아직 기록이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
