'use client';
import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { WorkoutPageSkeleton } from '../layout/skeleton';
import {
  WeeklyChartData,
  LeaderboardEntry,
  TodayCountData,
  WeekInfo,
  RunningItem,
  RunningTableProps,
} from '@/types/runningTableTypes';
import { PaginationInfo } from '../hooks/useRunningDataQuery';

// Helper function to format date to MM.DD format
const formatDateToMMDD = (dateString: string | Date) => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}.${day}`;
};

// Helper function to generate week labels based on challenge period (서버 로직과 일치)
const generateWeekLabels = (startDateStr: string, endDateStr: string) => {
  const [year, month, day] = startDateStr.split('-').map(Number);
  const challengeStartDate = new Date(year, month - 1, day);

  const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
  const challengeEndDate = new Date(endYear, endMonth - 1, endDay);

  const weeks: WeekInfo[] = [];

  // 챌린지 시작일이 포함된 주의 월요일 찾기 (이 주가 W1이 됨)
  let currentStart = new Date(challengeStartDate);
  const startDay = challengeStartDate.getDay();
  const daysFromMonday = startDay === 0 ? 6 : startDay - 1;
  currentStart.setDate(challengeStartDate.getDate() - daysFromMonday);

  let weekNumber = 1;

  // 챌린지 종료일까지 주차별로 생성
  while (currentStart <= challengeEndDate) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentStart.getDate() + 6); // 일요일

    // 챌린지 종료일을 넘지 않도록 조정
    const actualEnd = currentEnd > challengeEndDate ? challengeEndDate : currentEnd;

    const formattedStart = formatDateToMMDD(currentStart);
    const formattedEnd = formatDateToMMDD(actualEnd);

    weeks.push({
      label: `${formattedStart}-${formattedEnd}`,
      startDate: new Date(currentStart),
      endDate: new Date(actualEnd),
      weekNumber: weekNumber,
    });

    // 다음 주 월요일로 이동
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentEnd.getDate() + 1);
    weekNumber++;
  }

  return weeks;
};

// Helper function to check if current date is within a week range
const isCurrentWeek = (startDate: Date, endDate: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return today >= start && today <= end;
};

// RunningTable component
type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

const RunningTable: React.FC<
  RunningTableProps & {
    weeklyChart?: any;
    leaderboard?: any;
    todayCount?: any;
    batchUserData?: any;
    paginatedUsers?: any[];
    pagination?: PaginationInfo;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    isLoading?: boolean;
    error?: any;
  }
> = ({
  challengeId,
  weeklyChart,
  leaderboard,
  todayCount,
  batchUserData,
  paginatedUsers,
  pagination,
  currentPage = 1,
  onPageChange,
  isLoading = false,
  error,
}) => {
  const [runningItems, setRunningItems] = useState<RunningItem[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [activeMembersPercent, setActiveMembersPercent] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: '',
    direction: 'asc',
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useRef(null);
  const router = useRouter();

  // Process data when React Query data changes
  const processRunningData = useCallback(async () => {
    if (!weeklyChart || !leaderboard || !todayCount) return;

    try {
      // Generate proper week info based on challenge period
      let generatedWeeks = [];
      if (
        weeklyChart.challengePeriod &&
        weeklyChart.challengePeriod.startDate &&
        weeklyChart.challengePeriod.endDate
      ) {
        generatedWeeks = generateWeekLabels(
          weeklyChart.challengePeriod.startDate,
          weeklyChart.challengePeriod.endDate
        );
        setWeekInfo(generatedWeeks);
      } else if (weeklyChart.weeks && weeklyChart.weeks.length > 0) {
        setWeekInfo(weeklyChart.weeks);
        generatedWeeks = weeklyChart.weeks;
      }

      // 페이지네이션 데이터가 있으면 사용, 없으면 기존 batchUserData 사용
      const userData = paginatedUsers && paginatedUsers.length > 0 ? paginatedUsers : batchUserData;

      // Process API data to running items using the generated weeks
      const runningData = await processApiDataToRunningItems(
        weeklyChart,
        leaderboard,
        todayCount,
        generatedWeeks,
        userData
      );

      setRunningItems(runningData);
      setTotalAchievements(calculateTotalAchievements(runningData));
      setActiveMembersPercent(calculateActiveMembersPercent(runningData));
      setHasMore(false);
    } catch (error) {
      // console.error('러닝 데이터 처리 실패:', error);
    }
  }, [weeklyChart, leaderboard, todayCount, batchUserData, paginatedUsers]);

  // Process API data to running items
  const processApiDataToRunningItems = async (
    weeklyChartData: WeeklyChartData,
    leaderboardData: LeaderboardEntry[],
    todayCountData: TodayCountData,
    generatedWeeks: WeekInfo[],
    batchUserData?: any
  ): Promise<RunningItem[]> => {
    // paginatedUsers 데이터가 있으면 직접 사용 (이미 user 정보와 weeklyRecords 포함)
    const usePaginatedData = batchUserData?.length > 0 && batchUserData[0]?.user;
    const users = usePaginatedData
      ? batchUserData.map((item: any) => ({
          id: item.userId,
          name: item.user?.name || '유저',
          username: item.user?.displayName || '-',
        }))
      : weeklyChartData.users || [];

    const cardioData = weeklyChartData.cardioData || [];
    const strengthData = weeklyChartData.strengthData || [];

    const userPointsMap: Record<string, number> = {};
    leaderboardData?.forEach((item) => {
      userPointsMap[item.user_id] = item.points;
    });

    const items = users.map((user: any) => {
      const userStatsData = batchUserData?.find(
        (data: any) => data.userId === user.id
      ) || { weeklyRecords: [] };

      const weeksCount = generatedWeeks.length || 1;

      const userWeeklyData = generatedWeeks.map((week, index) => {
        const userCardioInWeek = cardioData.filter((item) => {
          const workoutDate = new Date(item.date);
          return (
            item.userId === user.id &&
            workoutDate >= week.startDate &&
            workoutDate <= week.endDate
          );
        });

        const userStrengthInWeek = strengthData.filter((item) => {
          const workoutDate = new Date(item.date);
          return (
            item.userId === user.id &&
            workoutDate >= week.startDate &&
            workoutDate <= week.endDate
          );
        });

        const startDate = formatDateToMMDD(week.startDate);
        const endDate = formatDateToMMDD(week.endDate);

        const weekRecord = userStatsData.weeklyRecords?.find((record: any) => {
          const [recordStartYear, recordStartMonth, recordStartDay] = record.start_date.split('-').map(Number);
          const recordStartDate = new Date(recordStartYear, recordStartMonth - 1, recordStartDay);

          const [recordEndYear, recordEndMonth, recordEndDay] = record.end_date.split('-').map(Number);
          const recordEndDate = new Date(recordEndYear, recordEndMonth - 1, recordEndDay);

          const isMatching =
            recordEndDate >= week.startDate && recordStartDate <= week.endDate;

          return isMatching;
        });

        const totalCardioPoints = weekRecord?.cardio_points_total || 0;
        const strengthSessions = weekRecord?.strength_sessions_count || 0;
        const actualPercentage = Math.round(totalCardioPoints * 10) / 10;

        return {
          weekNumber: week.weekNumber,
          startDate,
          endDate,
          aerobicPercentage: totalCardioPoints,
          actualPercentage,
          strengthSessions,
          label: week.label,
        };
      });

      const lastWeek = userWeeklyData.at(-1);
      const isActiveThisWeek =
        userWeeklyData.length > 0 &&
        ((lastWeek?.aerobicPercentage ?? 0) > 0 ||
          (lastWeek?.strengthSessions ?? 0) > 0);

      const totalAchievement = userWeeklyData.reduce(
        (sum, week) => sum + week.aerobicPercentage,
        0
      );

      return {
        id: user.id,
        challenge_id: challengeId || 'default-challenge',
        userId: user.id,
        userName: user.username || '-',
        name: user.name || '유저',
        weeklyData: userWeeklyData,
        hasUploaded: userPointsMap[user.id] > 0,
        activeThisWeek: isActiveThisWeek,
        totalAchievements: totalAchievement,
      };
    });

    return items.sort((a, b) => {
      const aTotal = a.weeklyData.reduce(
        (sum, week) => sum + week.aerobicPercentage,
        0
      );
      const bTotal = b.weeklyData.reduce(
        (sum, week) => sum + week.aerobicPercentage,
        0
      );
      return bTotal - aTotal;
    });
  };

  // Calculate total achievements
  const calculateTotalAchievements = (items: RunningItem[]): number => {
    return items.reduce((sum, item) => {
      return sum + (item.totalAchievements || 0);
    }, 0);
  };

  const calculateActiveMembersPercent = (items: RunningItem[]): number => {
    if (!items || items.length === 0) return 0;
    const activeMembers = items.filter((item) => item.activeThisWeek).length;
    return Math.round((activeMembers / items.length) * 100);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRunningItems = useMemo(() => {
    if (!sortConfig.key) return runningItems;

    const sorted = [...runningItems].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'id') {
        aValue = a.userName || '';
        bValue = b.userName || '';
      } else if (sortConfig.key === 'name') {
        aValue = a.name || '';
        bValue = b.name || '';
      } else if (sortConfig.key.startsWith('week-')) {
        const weekIndex = parseInt(sortConfig.key.split('-')[1]);
        const aWeekData = a.weeklyData[weekIndex];
        const bWeekData = b.weeklyData[weekIndex];
        aValue = aWeekData ? aWeekData.aerobicPercentage : 0;
        bValue = bWeekData ? bWeekData.aerobicPercentage : 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [runningItems, sortConfig]);

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return (
        <Image
          src="/svg/arrow-down.svg"
          width={10}
          height={10}
          alt="sort"
          className="opacity-50"
        />
      );
    }
    return (
      <Image
        src="/svg/arrow-down.svg"
        width={10}
        height={10}
        alt="sort"
        className={`transition-transform ${
          sortConfig.direction === 'desc' ? 'rotate-180' : ''
        }`}
      />
    );
  };

  // Process data when React Query data is available
  useEffect(() => {
    processRunningData();
  }, [processRunningData]);

  // Media query detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Intersection observer handler
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && !isLoading && hasMore) {
        const currentScrollPosition = window.scrollY;
        setPage((prev) => {
          const nextPage = prev + 1;
          requestAnimationFrame(() => {
            window.scrollTo(0, currentScrollPosition);
          });
          return nextPage;
        });
      }
    },
    [isLoading, hasMore]
  );

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1,
    });
    observerRef.current = observer;

    const currentLastRow = lastRowRef.current;
    if (currentLastRow) {
      observer.observe(currentLastRow);
    }

    return () => {
      if (currentLastRow) {
        observer.unobserve(currentLastRow);
      }
    };
  }, [handleObserver, sortedRunningItems]);

  if (isLoading) {
    return <WorkoutPageSkeleton />;
  }

  if (error) {
    return (
      <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
        <h2 className="font-bold">API 오류 발생</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  // Mobile card component
  const MobileCard = ({ item, index }: { item: RunningItem; index: number }) => {
    const currentWeekIndex = weekInfo.findIndex((week) =>
      isCurrentWeek(week.startDate, week.endDate)
    );
    const currentWeekData = currentWeekIndex >= 0 ? item.weeklyData[currentWeekIndex] : null;
    const displayIndex = pagination
      ? (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
      : index + 1;

    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3 active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
        onClick={() => {
          if (currentWeekData) {
            router.push(
              `/${item.challenge_id}/running/${item.userId}/${currentWeekData.weekNumber}?label=${currentWeekData.label}`
            );
          }
        }}
      >
        {/* 헤더: 순위, 이름, ID */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 font-semibold text-sm">
              {displayIndex}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.userName}</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* 이번 주 데이터 */}
        {currentWeekData && (
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 mb-3">
            <div className="text-xs text-green-600 dark:text-green-300 font-medium mb-1">
              이번 주 (W{currentWeekData.weekNumber})
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-lg font-bold text-green-600 dark:text-green-300">
                  {currentWeekData.aerobicPercentage === 0
                    ? '-'
                    : `${currentWeekData.aerobicPercentage.toFixed(1)}%`}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">달성률</span>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
              <div>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
                  {currentWeekData.strengthSessions === 0
                    ? '-'
                    : currentWeekData.strengthSessions}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">세션</span>
              </div>
            </div>
          </div>
        )}

        {/* 주차별 미니 차트 */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {item.weeklyData.slice(-6).map((week, weekIndex) => {
            const actualIndex = Math.max(0, item.weeklyData.length - 6) + weekIndex;
            const weekData = weekInfo[actualIndex];
            const isCurrent = weekData ? isCurrentWeek(weekData.startDate, weekData.endDate) : false;
            const percentage = Math.min(week.aerobicPercentage, 100);

            return (
              <div
                key={weekIndex}
                className={`flex-1 min-w-[40px] ${isCurrent ? 'opacity-100' : 'opacity-70'}`}
              >
                <div className="text-[10px] text-center text-gray-500 dark:text-gray-400 mb-1">
                  W{week.weekNumber}
                </div>
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all ${
                      isCurrent ? 'bg-green-500' : 'bg-green-300 dark:bg-green-600'
                    }`}
                    style={{ height: `${percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-center text-gray-600 dark:text-gray-300 mt-1">
                  {week.aerobicPercentage === 0 ? '-' : `${week.aerobicPercentage.toFixed(0)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render mobile view
  if (isMobile) {
    return (
      <div className="mt-4 px-4">
        {/* 모바일 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            참가자 ({pagination?.totalItems || sortedRunningItems.length}명)
          </h2>
        </div>

        {/* 모바일 카드 리스트 */}
        <div className="space-y-3">
          {sortedRunningItems.map((item, index) => (
            <MobileCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {sortedRunningItems.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            참가자 데이터가 없습니다
          </div>
        )}

        {/* 모바일 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pb-4">
            <button
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100 dark:active:bg-gray-700"
            >
              이전
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100 dark:active:bg-gray-700"
            >
              다음
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop rendering
  return (
    <div className="mt-6 px-8 overflow-x-auto w-full">
      {/* Main running table */}
      <div className="w-full overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-white text-gray-500">
              <th className="w-[3%] p-3 text-center">
                <span className="text-sm">#</span>
              </th>
              <th className="w-[5%] p-3 text-left">
                <div className="flex items-center justify-start gap-1">
                  <span className="text-sm">ID</span>
                  <button
                    onClick={() => handleSort('id')}
                    className="hover:opacity-75 transition-opacity"
                  >
                    {getSortIcon('id')}
                  </button>
                </div>
              </th>
              <th className="w-[10%] p-3 text-left">
                <div className="flex items-center justify-start gap-1">
                  <span className="text-sm">이름</span>
                  <button
                    onClick={() => handleSort('name')}
                    className="hover:opacity-75 transition-opacity"
                  >
                    {getSortIcon('name')}
                  </button>
                </div>
              </th>
              {/* Dynamic week headers */}
              {weekInfo.map((week, index) => {
                const isCurrent = isCurrentWeek(week.startDate, week.endDate);
                return (
                  <th
                    key={index}
                    className={`w-[10%] p-3 text-center ${
                      isCurrent
                        ? 'bg-blue-50 border-l-2 border-r-2 border-blue-200'
                        : ''
                    }`}
                  >
                    <div className="text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <div
                          className={`font-semibold ${
                            isCurrent ? 'text-blue-600' : ''
                          }`}
                        >
                          W{week.weekNumber}
                        </div>
                        <button
                          onClick={() => handleSort(`week-${index}`)}
                          className="hover:opacity-75 transition-opacity"
                        >
                          {getSortIcon(`week-${index}`)}
                        </button>
                      </div>
                      <div
                        className={`text-[10px] font-normal mt-1 ${
                          isCurrent ? 'text-blue-500' : 'text-gray-500'
                        }`}
                      >
                        {typeof week.label === 'string'
                          ? week.label
                          : `${week.startDate}-${week.endDate}`}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRunningItems.map((item, index) => {
              return (
                <tr
                  key={index}
                  ref={
                    index === sortedRunningItems.length - 1 ? lastRowRef : null
                  }
                  className="border-b border-gray-200 hover:bg-[#F4F6FC]"
                >
                  <td className="p-3 text-center text-gray-500">
                    {pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1 : index + 1}
                  </td>
                  <td className="p-3">
                    <div className="text-black dark:text-black">
                      {item.userName || '-'}
                    </div>
                  </td>
                  <td className="p-3 text-black">{item.name}</td>
                  {item.weeklyData.map((week, weekIndex) => {
                    const currentWeekInfo = weekInfo[weekIndex];
                    const isCurrent = currentWeekInfo
                      ? isCurrentWeek(
                          currentWeekInfo.startDate,
                          currentWeekInfo.endDate
                        )
                      : false;

                    return (
                      <td
                        key={weekIndex}
                        className={`p-3 text-center cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-50 border-l-2 border-r-2 border-blue-200'
                            : ''
                        }`}
                        onClick={() =>
                          router.push(
                            `/${item.challenge_id}/running/${item.userId}/${week.weekNumber}?label=${week.label}`
                          )
                        }
                      >
                        <div className="flex flex-col">
                          <span
                            className={
                              week.aerobicPercentage === 0
                                ? 'text-gray-400'
                                : 'text-blue-500'
                            }
                          >
                            {week.aerobicPercentage === 0
                              ? '-'
                              : `${week.aerobicPercentage.toFixed(1)}%`}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {week.strengthSessions === 0
                              ? '-'
                              : `${week.strengthSessions}`}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  {[
                    ...Array(
                      Math.max(0, weekInfo.length - item.weeklyData.length)
                    ),
                  ].map((_, i) => {
                    const emptyWeekIndex = item.weeklyData.length + i;
                    const currentWeekInfo = weekInfo[emptyWeekIndex];
                    const isCurrent = currentWeekInfo
                      ? isCurrentWeek(
                          currentWeekInfo.startDate,
                          currentWeekInfo.endDate
                        )
                      : false;

                    return (
                      <td
                        key={`empty-${i}`}
                        className={`p-3 text-center ${
                          isCurrent
                            ? 'bg-blue-50 border-l-2 border-r-2 border-blue-200'
                            : ''
                        }`}
                      >
                        -
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 UI */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-600">
            총 {pagination.totalItems}명 중 {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}-
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}명
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              처음
            </button>
            <button
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`w-8 h-8 text-sm rounded-md ${
                      pageNum === pagination.currentPage
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
            <button
              onClick={() => onPageChange?.(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              마지막
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(RunningTable);
