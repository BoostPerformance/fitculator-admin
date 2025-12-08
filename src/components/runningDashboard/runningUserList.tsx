'use client';
import React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// Helper function to generate week labels based on challenge period
const generateWeekLabels = (startDateStr: string, endDateStr: string) => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const weeks: WeekInfo[] = [];
  let weekNumber = 1; // W1부터 시작

  // Get the day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const startDay = startDate.getDay();

  // Calculate the Monday of the week containing the start date
  let currentStart = new Date(startDate);
  if (startDay !== 1) {
    // If not Monday, go back to the previous Monday
    const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
    currentStart.setDate(currentStart.getDate() - daysSinceMonday);
  }
  // If start date is not Monday, create W0 from that week's Monday
  if (startDay !== 1) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6); // Sunday

    const formattedStart = formatDateToMMDD(currentStart);
    const formattedEnd = formatDateToMMDD(currentEnd);

    weeks.push({
      label: `${formattedStart}-${formattedEnd}`,
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd),
      weekNumber: weekNumber,
    });
    weekNumber++;

    // Move to next Monday for W1
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  // Generate full weeks starting from Monday
  while (currentStart < endDate) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6); // Sunday (7-day week)

    // Don't exceed the end date
    const actualEnd = currentEnd > endDate ? endDate : currentEnd;

    const formattedStart = formatDateToMMDD(currentStart);
    const formattedEnd = formatDateToMMDD(actualEnd);

    weeks.push({
      label: `${formattedStart}-${formattedEnd}`,
      startDate: new Date(currentStart),
      endDate: new Date(actualEnd),
      weekNumber: weekNumber,
    });
    weekNumber++;

    // Move to next Monday
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return weeks;
};

const isRunningUploaded = (runningName: number) => {
  return runningName !== 0 ? (
    <>
      <div>
        <Image
          src="/svg/check-orange.svg"
          width={30}
          height={30}
          alt="running-done"
          className="w-[1.5rem] h-[1.5rem]"
        />
      </div>
    </>
  ) : (
    <>
      <Image
        src="/svg/incomplete-icon.svg"
        width={30}
        height={30}
        alt="running-incompleted"
        className="w-[1.5rem] h-[1.5rem]"
      />
    </>
  );
};

// RunningUserList component
const RunningUserList: React.FC<
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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useRef(null);
  const router = useRouter();

  // 주차 정보를 useMemo로 메모화하여 무한 렌더링 방지
  const generatedWeeks = useMemo(() => {
    if (!weeklyChart) return [];

    if (
      weeklyChart.challengePeriod &&
      weeklyChart.challengePeriod.startDate &&
      weeklyChart.challengePeriod.endDate
    ) {
      const generated = generateWeekLabels(
        weeklyChart.challengePeriod.startDate,
        weeklyChart.challengePeriod.endDate
      );
      return generated;
    } else if (weeklyChart.weeks && weeklyChart.weeks.length > 0) {
      return weeklyChart.weeks;
    }

    return [];
  }, [
    weeklyChart?.challengePeriod?.startDate,
    weeklyChart?.challengePeriod?.endDate,
    weeklyChart?.weeks,
  ]);

  // weekInfo 업데이트는 별도 useEffect로 분리
  useEffect(() => {
    if (generatedWeeks.length > 0) {
      setWeekInfo(generatedWeeks);
    }
  }, [generatedWeeks]);

  // Process API data to running items 함수를 메모화
  const processApiDataToRunningItems = useCallback(
    async (
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

      // 대용량 데이터 처리를 위한 배치 처리
      const BATCH_SIZE = 20;
      const results: RunningItem[] = [];

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const userBatch = users.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
          userBatch.map(async (user) => {
            const userData = batchUserData?.find(
              (data: any) => data.userId === user.id
            );
            const totalCardioPoints = userData?.stats?.totalCardioPoints || 0;

            // 주차별 데이터 처리
            const weeklyData = generatedWeeks.map((week, idx) => {
              // 날짜 범위로 운동 데이터 매칭
              const cardioPoints = cardioData
                .filter((c) => {
                  if (c.userId !== user.id) return false;
                  const apiStartDate = new Date(c.startDate + 'T00:00:00Z');
                  const apiEndDate = new Date(c.endDate + 'T00:00:00Z');
                  const weekStartDate = new Date(week.startDate);
                  const weekEndDate = new Date(week.endDate);

                  return (
                    apiStartDate.getTime() <= weekEndDate.getTime() &&
                    apiEndDate.getTime() >= weekStartDate.getTime()
                  );
                })
                .reduce((sum, c) => sum + c.y, 0);

              const strengthSessions = strengthData.filter((s) => {
                if (s.userId !== user.id) return false;
                const apiStartDate = new Date(s.startDate + 'T00:00:00Z');
                const apiEndDate = new Date(s.endDate + 'T00:00:00Z');
                const weekStartDate = new Date(week.startDate);
                const weekEndDate = new Date(week.endDate);

                return (
                  apiStartDate.getTime() <= weekEndDate.getTime() &&
                  apiEndDate.getTime() >= weekStartDate.getTime()
                );
              }).length;

              const weekRecord = userData?.weeklyRecords?.find(
                (record: any) => {
                  const recordStartDate = new Date(record.start_date);
                  const recordEndDate = new Date(record.end_date);
                  return (
                    recordStartDate.getTime() === week.startDate.getTime() &&
                    recordEndDate.getTime() === week.endDate.getTime()
                  );
                }
              );

              const finalWeekNumber = week.weekNumber
                ? parseInt(week.weekNumber.replace('W', ''))
                : idx + 1;

              return {
                weekNumber: finalWeekNumber,
                startDate: week.label.split('-')[0],
                endDate: week.label.split('-')[1],
                aerobicPercentage: cardioPoints,
                actualPercentage: cardioPoints,
                strengthSessions,
                cardio_points_total: weekRecord?.cardio_points_total || 0,
              };
            });

            return {
              id: user.id,
              challenge_id: challengeId,
              userId: user.id,
              userName: user.name?.split(' ')[0] || '유저',
              name: user.name || '유저',
              weeklyData,
              hasUploaded: (userPointsMap[user.id] || 0) > 0,
              totalAchievements: totalCardioPoints,
              activeThisWeek: true,
            };
          })
        );

        results.push(...batchResults);

        // 브라우저가 다른 작업을 처리할 수 있도록 잠깐 대기
        if (i + BATCH_SIZE < users.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      return results;
    },
    [challengeId]
  );

  // Process data when React Query data changes
  const processRunningData = useCallback(async () => {
    if (
      !weeklyChart ||
      !leaderboard ||
      !todayCount ||
      generatedWeeks.length === 0
    ) {
      return;
    }

    try {
      // 페이지네이션 데이터가 있으면 사용, 없으면 기존 batchUserData 사용
      const userData = paginatedUsers && paginatedUsers.length > 0 ? paginatedUsers : batchUserData;

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
  }, [
    weeklyChart,
    leaderboard,
    todayCount,
    batchUserData,
    paginatedUsers,
    generatedWeeks,
    processApiDataToRunningItems,
  ]);

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
  }, [handleObserver, runningItems]);

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

  return (
    <div className="mt-[3rem]  sm:px-[1rem] lg:hidden md:hidden sm:block w-full">
      <div className="flex flex-col gap-4">
        {runningItems.map((user, index) => {
          return (
            <div
              key={index}
              className="pt-[0rem] pb-[2rem] sm:bg-white rounded-md shadow cursor-pointer"
              onClick={() => {
                const firstWeek = user.weeklyData[0];
                if (firstWeek) {
                  const weekLabel =
                    firstWeek.startDate && firstWeek.endDate
                      ? `${firstWeek.startDate}-${firstWeek.endDate}`
                      : `W${firstWeek.weekNumber}`;

                  const targetUrl = `/${challengeId}/running/${user.userId}/${firstWeek.weekNumber}?label=${weekLabel}`;
                  router.push(targetUrl);
                } else {
                  const fallbackUrl = `/${challengeId}/running/${user.userId}/0`;
                  router.push(fallbackUrl);
                }
              }}
            >
              <div className="text-[#6F6F6F] text-1.125-700 pt-[1rem] pl-[1rem] pb-[1rem]">
                {user.name}
              </div>
              <table className="w-full">
                <tbody>
                  {Array.from({
                    length: Math.ceil(user.weeklyData.length / 7),
                  }).map((_, groupIdx) => {
                    const start = groupIdx * 7;
                    const end = start + 7;
                    const weekSlice = user.weeklyData.slice(start, end);
                    return (
                      <React.Fragment key={groupIdx}>
                        <tr className="sm:pl-[0.5rem] flex w-full justify-start gap-[0.9rem] text-gray-11 text-1-500">
                          {weekSlice.map((week, i) => (
                            <th key={i} className="text-center min-w-[2.5rem]">
                              {week.weekNumber}주
                            </th>
                          ))}
                        </tr>
                        <tr className="flex w-full justify-start  gap-[0.5rem]">
                          {weekSlice.map((week, i) => (
                            <td
                              key={i}
                              className="text-center p-3 cursor-pointer hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                const weekLabel =
                                  week.startDate && week.endDate
                                    ? `${week.startDate}-${week.endDate}`
                                    : `W${week.weekNumber}`;

                                const targetUrl = `/${challengeId}/running/${user.userId}/${week.weekNumber}?label=${weekLabel}`;
                                router.push(targetUrl);
                              }}
                            >
                              <div className="flex flex-col items-center">
                                {isRunningUploaded(week.aerobicPercentage)}
                                <div className="text-xs text-gray-400 mt-1">
                                  {week.strengthSessions === 0
                                    ? '-'
                                    : `${week.strengthSessions}`}
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 UI (모바일) */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 mt-6 pb-6">
          <div className="text-sm text-gray-600">
            총 {pagination.totalItems}명 중 {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}-
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}명
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-3 py-2 text-sm font-medium">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunningUserList;
