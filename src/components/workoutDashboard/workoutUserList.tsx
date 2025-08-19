'use client';
import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
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
    weekNumber++;
    
    // Move to next Monday
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
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [activeMembersPercent, setActiveMembersPercent] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useRef(null);
  const router = useRouter();
  
  // React Query 훅 사용으로 API 호출 최적화
  const { weeklyChart, leaderboard, todayCount, batchUserData, isLoading, error } = useWorkoutDataQuery(challengeId);

  // Process data when React Query data changes
  const processWorkoutData = useCallback(async () => {
// console.log('🔧 processWorkoutData 시작', { 
    //   weeklyChart: !!weeklyChart, 
    //   leaderboard: !!leaderboard, 
    //   todayCount: !!todayCount,
    //   challengeId 
    // });
    
    if (!weeklyChart || !leaderboard || !todayCount) {
// console.log('❌ 필수 데이터 없음, 종료');
      return;
    }

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
        const userData = batchUserData?.find((data: any) => data.userId === user.id);
        const totalCardioPoints = userData?.stats?.totalCardioPoints || 0;
        
        // 디버깅: 첫 번째 사용자만 로그 출력
        if (user.id === users[0]?.id) {
// console.log('🔍 WorkoutUserList 디버깅:', {
          //   userId: user.id,
          //   userName: user.name,
          //   hasBatchUserData: !!userData,
          //   weeklyRecordsCount: userData?.weeklyRecords?.length || 0,
          //   firstRecord: userData?.weeklyRecords?.[0]
          // });
        }

        const weeksCount = generatedWeeks.length || 1;

        const userWeeklyData = generatedWeeks.map((week, index) => {
          const startDate = formatDateToMMDD(week.startDate);
          const endDate = formatDateToMMDD(week.endDate);

          // batchUserData에서 해당 주차의 weeklyRecord 찾기
          const weekRecord = userData?.weeklyRecords?.find(
            (record: any) => {
              const recordStartDate = new Date(record.start_date);
              const recordEndDate = new Date(record.end_date);
              
              // W0의 경우 특별 처리
              if (week.weekNumber === 0) {
                const isW0Record = (
                  recordStartDate <= week.endDate && 
                  recordEndDate >= week.startDate
                );
                return isW0Record;
              }
              
              // W1 이후는 기존 로직
              const isOverlapping = (
                recordStartDate <= week.endDate && 
                recordEndDate >= week.startDate
              );
              return isOverlapping;
            }
          );

          const cardioPoints = weekRecord?.cardio_points_total || 0;
          const strengthSessions = weekRecord?.strength_sessions_count || 0;
          const actualPercentage = Math.round(totalCardioPoints * 10) / 10;

          return {
            weekNumber: week.weekNumber !== undefined ? week.weekNumber : index,
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
// console.log('🔄 WorkoutUserList 로딩 중...', { challengeId, isLoading });
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
        {workoutItems.map((user, index) => {
          return (
            <div
              key={index}
              className="pt-[0rem] pb-[2rem] sm:bg-white rounded-md shadow cursor-pointer"
              onClick={() => {
// console.log('👤 사용자 카드 클릭됨!', {
                //   user: user.name,
                //   userId: user.userId,
                //   challengeId,
                //   weeklyDataLength: user.weeklyData.length
                // });
                
                // 첫 번째 주차로 이동
                const firstWeek = user.weeklyData[0];
                if (firstWeek) {
                  const weekLabel = firstWeek.startDate && firstWeek.endDate 
                    ? `${firstWeek.startDate}-${firstWeek.endDate}` 
                    : `W${firstWeek.weekNumber}`;
                  
                  const targetUrl = `/${challengeId}/workout/${user.userId}/${firstWeek.weekNumber}?label=${weekLabel}`;
// console.log('🚀 이동할 URL (카드 클릭):', targetUrl);
                  
                  router.push(targetUrl);
                } else {
                  // fallback: 기본 사용자 페이지
                  const fallbackUrl = `/${challengeId}/workout/${user.userId}/0`;
// console.log('🚀 이동할 URL (fallback):', fallbackUrl);
                  router.push(fallbackUrl);
                }
              }}
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
                            <td 
                              key={i} 
                              className="text-center p-3 cursor-pointer hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation(); // 부모 클릭 이벤트 방지
// console.log('🎯 주차별 운동량 칸 클릭됨!', {
                                //   user: user.name,
                                //   userId: user.userId,
                                //   weekNumber: week.weekNumber,
                                //   challengeId,
                                //   week
                                // });
                                
                                // startDate와 endDate가 있으면 MM.DD-MM.DD 형식으로, 아니면 기본 라벨 사용
                                const weekLabel = week.startDate && week.endDate 
                                  ? `${week.startDate}-${week.endDate}` 
                                  : `W${week.weekNumber}`;
                                
                                const targetUrl = `/${challengeId}/workout/${user.userId}/${week.weekNumber}?label=${weekLabel}`;
// console.log('🚀 이동할 URL:', targetUrl);
                                
                                router.push(targetUrl);
                              }}
                            >
                              <div className="flex flex-col items-center">
                                {isWorkoutUploaded(week.aerobicPercentage)}
                                <div className="text-xs text-gray-400 mt-1">
                                  {week.strengthSessions === 0 ? '-' : `${week.strengthSessions}`}
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
    </div>
  );
};

export default WorkoutUserList;
