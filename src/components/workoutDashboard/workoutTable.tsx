'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { WorkoutPageSkeleton } from '../layout/skeleton';
import {
  WeekLabel,
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

  // Adjust to the beginning of the week (Sunday or Monday depending on your preference)
  const adjustedStartDate = new Date(startDate);

  const weeks: WeekInfo[] = [];
  let currentStart = adjustedStartDate;
  let weekNumber = 1;

  while (currentStart < endDate) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6); // 7-day week

    const formattedStart = formatDateToMMDD(currentStart.toISOString());
    const formattedEnd = formatDateToMMDD(currentEnd.toISOString());

    weeks.push({
      label: `${formattedStart}-${formattedEnd}`,
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd),
      weekNumber: weekNumber,
    });

    // Move to next week
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
    weekNumber++;
  }

  return weeks;
};

// WorkoutTable component
const WorkoutTable: React.FC<WorkoutTableProps> = ({ challengeId }) => {
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [activeMembersPercent, setActiveMembersPercent] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useRef(null);
  const router = useRouter();

  // Fetch workout data
  const fetchWorkoutData = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        setApiError(null);

        let weeklyChartData, todayCountData, leaderboardData;

        try {
          // console.log('Fetching weekly chart data...');
          const weeklyResponse = await fetch(
            `/api/workouts/user-detail?type=weekly-chart${
              challengeId ? `&challengeId=${challengeId}` : ''
            }`
          );
          if (!weeklyResponse.ok) {
            throw new Error(`주간 차트 API 오류: ${weeklyResponse.status}`);
          }
          weeklyChartData = await weeklyResponse.json();
          // console.log('Weekly chart data received:', weeklyChartData);

          // ... other API calls
          const todayCountResponse = await fetch(
            `/api/workouts/user-detail?type=today-count${
              challengeId ? `&challengeId=${challengeId}` : ''
            }`
          );
          if (!todayCountResponse.ok) {
            throw new Error(
              `오늘 카운트 API 오류: ${todayCountResponse.status}`
            );
          }
          todayCountData = await todayCountResponse.json();
          // console.log('Today count data received:', todayCountData);

          const leaderboardResponse = await fetch(
            `/api/workouts/user-detail?type=leaderboard${
              challengeId ? `&challengeId=${challengeId}` : ''
            }`
          );
          if (!leaderboardResponse.ok) {
            throw new Error(`리더보드 API 오류: ${leaderboardResponse.status}`);
          }
          leaderboardData = await leaderboardResponse.json();
          // console.log('Leaderboard data received:', leaderboardData);
        } catch (error) {
          console.error('API 호출 중 오류 발생:', error);

          console.warn('API 호출 실패: 빈 데이터로 대체');

          weeklyChartData = {
            cardio: [],
            strength: [],
            users: [],
            weeks: [],
            challengePeriod: {
              startDate: '',
              endDate: '',
            },
          };
          todayCountData = {
            count: 0,
            total: 0,
          };
          leaderboardData = [];
        }

        // Generate proper week info based on challenge period
        let generatedWeeks = [];
        if (
          weeklyChartData.challengePeriod &&
          weeklyChartData.challengePeriod.startDate &&
          weeklyChartData.challengePeriod.endDate
        ) {
          generatedWeeks = generateWeekLabels(
            weeklyChartData.challengePeriod.startDate,
            weeklyChartData.challengePeriod.endDate
          );
          setWeekInfo(generatedWeeks);
        } else if (weeklyChartData.weeks && weeklyChartData.weeks.length > 0) {
          // Fallback to existing weeks if challenge period is not available
          setWeekInfo(weeklyChartData.weeks);
          generatedWeeks = weeklyChartData.weeks;
        }

        // Process API data to workout items using the generated weeks
        const workoutData = await processApiDataToWorkoutItems(
          weeklyChartData,
          leaderboardData,
          todayCountData,
          generatedWeeks
        );

        setWorkoutItems(workoutData);
        setTotalAchievements(calculateTotalAchievements(workoutData));
        setActiveMembersPercent(calculateActiveMembersPercent(workoutData));

        setHasMore(false);
        setLoading(false);
      } catch (error) {
        console.error('운동 데이터 불러오기 실패:', error);

        if (error instanceof Error) {
          setApiError(error.message);
        } else {
          setApiError('알 수 없는 오류가 발생했습니다.');
        }

        setLoading(false);
      }
    },
    [challengeId]
  );

  // Process API data to workout items
  const processApiDataToWorkoutItems = async (
    weeklyChartData: WeeklyChartData,
    leaderboardData: LeaderboardEntry[],
    todayCountData: TodayCountData,
    generatedWeeks: WeekInfo[]
  ): Promise<WorkoutItem[]> => {
    const users = weeklyChartData.users || [];
    const cardioData = weeklyChartData.cardio || [];
    const strengthData = weeklyChartData.strength || [];

    const userPointsMap: Record<string, number> = {};
    leaderboardData?.forEach((item) => {
      userPointsMap[item.user_id] = item.points;
    });

    const items = await Promise.all(
      users.map(async (user) => {
        const userStatsResponse = await fetch(
          `/api/workouts/user-detail?userId=${user.id}&challengeId=${challengeId}`
        );
        const userStatsData = await userStatsResponse.json();

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

          const strengthSessions = userStrengthInWeek.length;

          const startDate = formatDateToMMDD(week.startDate);
          const endDate = formatDateToMMDD(week.endDate);

          // 해당 주차의 weeklyRecord 찾기
          const weekRecord = userStatsData.weeklyRecords?.find(
            (record: any) => {
              const recordStartDate = new Date(record.start_date);
              const recordEndDate = new Date(record.end_date);
              return (
                recordStartDate.getTime() === week.startDate.getTime() &&
                recordEndDate.getTime() === week.endDate.getTime()
              );
            }
          );

          const totalCardioPoints = weekRecord?.cardio_points_total || 0;
          const actualPercentage = Math.round(totalCardioPoints * 10) / 10;

          return {
            weekNumber: index + 1,
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
      })
    );

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

  // Initial load and when date/challengeId changes
  useEffect(() => {
    setPage(1);
    fetchWorkoutData(1);
  }, [fetchWorkoutData, challengeId]);

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
      if (target.isIntersecting && !loading && hasMore) {
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
    [loading, hasMore]
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

  if (loading) {
    return <WorkoutPageSkeleton />;
  }

  if (apiError) {
    return (
      <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
        <h2 className="font-bold">API 오류 발생</h2>
        <p>{apiError}</p>
      </div>
    );
  }

  // Desktop rendering
  return (
    <div className="mt-6 px-8 overflow-x-auto w-full">
      {/* Main workout table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full bg-white rounded-lg border border-gray-200 min-w-[1000px]">
          <thead>
            <tr className="bg-white text-[#A1A1A1]">
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
              {weekInfo.map((week, index) => (
                <th key={index} className="w-[10%] p-3 text-center">
                  <div className="text-sm">
                    <div className="font-semibold">W{index + 1}</div>
                    <div className="text-[10px] font-normal text-gray-500 mt-1">
                      {typeof week.label === 'string'
                        ? week.label
                        : `${week.startDate}-${week.endDate}`}
                    </div>
                  </div>
                </th>
              ))}
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
                  <td className="p-3 text-center text-gray-500">
                    {index + 1}
                  </td>
                  <td className="p-3">
                    <div className="text-black dark:text-black">
                      {item.userName || '-'}
                    </div>
                  </td>
                  <td className="p-3 text-black">{item.name}</td>
                  {item.weeklyData.map((week, weekIndex) => (
                    <td
                      key={weekIndex}
                      className="p-3 text-center text-blue-500 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/user/${item.challenge_id}/workout/${item.userId}/${week.weekNumber}?label=${week.label}`
                        )
                      }
                    >
                      {week.aerobicPercentage.toFixed(1)}% /
                      <br className="md:block lg:hidden" />
                      {week.strengthSessions}회
                    </td>
                  ))}
                  {[
                    ...Array(
                      Math.max(0, weekInfo.length - item.weeklyData.length)
                    ),
                  ].map((_, i) => (
                    <td key={`empty-${i}`} className="p-3 text-center">
                      -
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkoutTable;
