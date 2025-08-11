'use client';
import React from 'react';
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

const isWorkoutUploaded = (workoutName: number) => {
  return workoutName !== 0 ? (
    <>
      <div>
        <Image
          src="/svg/check-orange.svg"
          width={30}
          height={30}
          alt="meal-done"
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
        alt="meal-incompleted"
        className="w-[1.5rem] h-[1.5rem]"
      />
    </>
  );
};

// WorkoutTable component
const WorkoutUserList: React.FC<WorkoutTableProps> = ({ challengeId }) => {
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
          //console.log('Weekly chart data received:', weeklyChartData);

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
            aerobicPercentage: Math.min(Math.round(cardioPoints), 100),
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

  return (
    <div className="mt-[3rem]  sm:px-[1rem] lg:hidden md:hidden sm:block w-full">
      <div className="flex flex-col gap-4">
        {workoutItems.map((user, index) => {
          return (
            <div
              key={index}
              className="pt-[0rem] pb-[2rem] sm:bg-white rounded-md shadow"
              onClick={() =>
                router.push(`/user/${challengeId}/workout/${user.userId}`)
              }
            >
              <div className="text-[#6F6F6F] text-1.125-700 pt-[1rem] pl-[1rem] pb-[1rem]">
                {user.name} 회원
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
                            <td key={i} className="text-center p-3">
                              {isWorkoutUploaded(week.aerobicPercentage)}
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
    </div>
  );
};

export default WorkoutUserList;
