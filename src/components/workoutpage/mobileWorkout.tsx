'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DietTableSkeleton } from '../layout/skeleton';
import {
  WeekLabel,
  WeeklyChartData,
  LeaderboardEntry,
  TodayCountData,
  WeekInfo,
  WorkoutItem,
  MobileWorkoutProps,
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

  const adjustedStartDate = new Date(startDate);

  const weeks: WeekLabel[] = [];
  let currentStart = adjustedStartDate;

  while (currentStart < endDate) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6); // 7-day week

    const formattedStart = formatDateToMMDD(currentStart.toISOString());
    const formattedEnd = formatDateToMMDD(currentEnd.toISOString());

    weeks.push({
      label: `${formattedStart}-${formattedEnd}`,
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd),
    });

    // Move to next week
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return weeks;
};

// WorkoutTable component
const MobileWorkout: React.FC<MobileWorkoutProps> = ({
  challengeId,
  workoutItem,
}) => {
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
          console.log('Fetching weekly chart data...');
          const weeklyResponse = await fetch(
            `/api/workouts/user-detail?type=weekly-chart${
              challengeId ? `&challengeId=${challengeId}` : ''
            }`
          );
          if (!weeklyResponse.ok) {
            throw new Error(`주간 차트 API 오류: ${weeklyResponse.status}`);
          }
          weeklyChartData = await weeklyResponse.json();
          console.log('Weekly chart data received:', weeklyChartData);

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
          `/api/workouts/user-detail?userId=${user.id}`
        );
        const userStatsData = await userStatsResponse.json();
        const totalCardioPoints = userStatsData.stats?.totalCardioPoints || 0;

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

          const cardioPoints = userCardioInWeek.reduce(
            (sum, item) => sum + item.y,
            0
          );
          const strengthSessions = userStrengthInWeek.length;

          const startDate = formatDateToMMDD(week.startDate);
          const endDate = formatDateToMMDD(week.endDate);

          const actualPercentage = Math.round(totalCardioPoints * 10) / 10;

          return {
            weekNumber: index + 1,
            startDate,
            endDate,
            aerobicPercentage: cardioPoints,
            actualPercentage,
            strengthSessions,
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
          userName: user.name.split(' ')[0] || 'User',
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
    return (activeMembers / items.length) * 100;
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
    return <DietTableSkeleton />;
  }

  if (apiError) {
    return (
      <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
        <h2 className="font-bold">API 오류 발생</h2>
        <p>{apiError}</p>
      </div>
    );
  }

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
                {weekInfo.map((week, idx) => {
                  const data = workoutItem.weeklyData.find(
                    (d) => `${d.startDate}-${d.endDate}` === week.label
                  );

                  return (
                    <div
                      key={idx}
                      className="min-w-[100px] flex-shrink-0 text-center text-blue-600 font-semibold cursor-pointer hover:underline border rounded px-2 py-1"
                      onClick={() =>
                        router.push(
                          `/user/${workoutItem.challenge_id}/workout/${
                            idx + 1
                          }/${workoutItem.userId}`
                        )
                      }
                    >
                      {idx + 1}주차
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
