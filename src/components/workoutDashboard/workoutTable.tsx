'use client';
import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { WorkoutPageSkeleton } from '../layout/skeleton';
import { useWorkoutDataQuery } from '../hooks/useWorkoutDataQuery';
import {
  WeeklyChartData,
  LeaderboardEntry,
  TodayCountData,
  WeekInfo,
  WorkoutItem,
  WorkoutTableProps,
} from '@/types/workoutTableTypes';

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
  let weekNumber = 0;

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

    // Move to next Monday
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
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

// WorkoutTable component
const WorkoutTable: React.FC<WorkoutTableProps> = ({ challengeId }) => {
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [activeMembersPercent, setActiveMembersPercent] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useRef(null);
  const router = useRouter();

  // React Query 훅 사용으로 API 호출 최적화
  const {
    weeklyChart,
    leaderboard,
    todayCount,
    batchUserData,
    isLoading,
    error,
  } = useWorkoutDataQuery(challengeId);

  // Process data when React Query data changes
  const processWorkoutData = useCallback(async () => {
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
        // Fallback to existing weeks if challenge period is not available
        setWeekInfo(weeklyChart.weeks);
        generatedWeeks = weeklyChart.weeks;
      }

      // Process API data to workout items using the generated weeks
      const workoutData = await processApiDataToWorkoutItems(
        weeklyChart,
        leaderboard,
        todayCount,
        generatedWeeks,
        batchUserData
      );

      setWorkoutItems(workoutData);
      setTotalAchievements(calculateTotalAchievements(workoutData));
      setActiveMembersPercent(calculateActiveMembersPercent(workoutData));
      setHasMore(false);
    } catch (error) {
// console.error('운동 데이터 처리 실패:', error);
    }
  }, [weeklyChart, leaderboard, todayCount, batchUserData]);

  // Process API data to workout items
  const processApiDataToWorkoutItems = async (
    weeklyChartData: WeeklyChartData,
    leaderboardData: LeaderboardEntry[],
    todayCountData: TodayCountData,
    generatedWeeks: WeekInfo[],
    batchUserData?: any
  ): Promise<WorkoutItem[]> => {
    const users = weeklyChartData.users || [];
    const cardioData = weeklyChartData.cardio || [];
    const strengthData = weeklyChartData.strength || [];

    const userPointsMap: Record<string, number> = {};
    leaderboardData?.forEach((item) => {
      userPointsMap[item.user_id] = item.points;
    });

    const items = users.map((user) => {
      // batchUserData에서 해당 사용자 데이터 찾기
      const userStatsData = batchUserData?.find(
        (data: any) => data.userId === user.id
      ) || { weeklyRecords: [] };

      // 데이터 연결 확인을 위한 로그 (첫 번째 사용자만)
      if (user.id === users[0]?.id) {
// console.log('첫 번째 사용자 데이터:', {
        //   userId: user.id,
        //   userName: user.name,
        //   weeklyRecordsCount: userStatsData.weeklyRecords?.length || 0,
        //   generatedWeeksCount: generatedWeeks.length,
        //   weeklyRecords: userStatsData.weeklyRecords,
        // });
      }

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

        // 해당 주차의 weeklyRecord 찾기 (W0 포함 개선된 매핑)
        const weekRecord = userStatsData.weeklyRecords?.find((record: any) => {
          const recordStartDate = new Date(record.start_date);
          const recordEndDate = new Date(record.end_date);

          // W0의 경우 특별 처리: W0 기간과 실제로 겹치는 기록 찾기
          if (week.weekNumber === 0) {
            // W0 기간(월요일~일요일)과 record 기간이 겹치는지 확인
            const isW0Record =
              recordStartDate <= week.endDate &&
              recordEndDate >= week.startDate;

            return isW0Record;
          }

          // W1 이후는 기존 로직 사용
          const isOverlapping =
            recordStartDate <= week.endDate && recordEndDate >= week.startDate;

          return isOverlapping;
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
  const calculateTotalAchievements = (items: WorkoutItem[]): number => {
    return items.reduce((sum, item) => {
      return sum + (item.totalAchievements || 0);
    }, 0);
  };

  const calculateActiveMembersPercent = (items: WorkoutItem[]): number => {
    if (!items || items.length === 0) return 0;
    const activeMembers = items.filter((item) => item.activeThisWeek).length;
    return Math.round((activeMembers / items.length) * 100);
  };

  // Process data when React Query data is available
  useEffect(() => {
    processWorkoutData();
  }, [processWorkoutData]);

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
  }, [handleObserver, workoutItems]);

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

  // Desktop rendering
  return (
    <div className="mt-6 px-8 overflow-x-auto w-full">
      {/* Main workout table */}
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
                  <button>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={10}
                      height={10}
                      alt="arrow-down"
                    />
                  </button>
                </div>
              </th>
              <th className="w-[10%] p-3 text-left">
                <div className="flex items-center justify-start gap-1">
                  <span className="text-sm">이름</span>
                  <button>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={10}
                      height={10}
                      alt="arrow-down"
                    />
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
                      <div
                        className={`font-semibold ${
                          isCurrent ? 'text-blue-600' : ''
                        }`}
                      >
                        W{week.weekNumber}
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
            {workoutItems.map((item, index) => {
              // console.log('item', item);
              return (
                <tr
                  key={index}
                  ref={index === workoutItems.length - 1 ? lastRowRef : null}
                  className="border-b border-gray-200 hover:bg-[#F4F6FC]"
                >
                  <td className="p-3 text-center text-gray-500">{index + 1}</td>
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
                            `/${item.challenge_id}/workout/${item.userId}/${week.weekNumber}?label=${week.label}`
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
    </div>
  );
};

export default memo(WorkoutTable);
