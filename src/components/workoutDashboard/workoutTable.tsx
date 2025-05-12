'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DietTableSkeleton } from '../layout/skeleton';
// 목데이터 정의
const MOCK_DATA = {
  weeklyChart: {
    cardio: [
      {
        userId: 'user1',
        x: '03.01-03.07',
        y: 70,
        user: '김철수',
        date: '2024-03-01',
        dayLabel: '월',
      },
      {
        userId: 'user1',
        x: '03.08-03.14',
        y: 90,
        user: '김철수',
        date: '2024-03-10',
        dayLabel: '수',
      },
      {
        userId: 'user1',
        x: '03.15-03.21',
        y: 100,
        user: '김철수',
        date: '2024-03-17',
        dayLabel: '금',
      },
      {
        userId: 'user2',
        x: '03.01-03.07',
        y: 60,
        user: '이영희',
        date: '2024-03-03',
        dayLabel: '수',
      },
      {
        userId: 'user2',
        x: '03.08-03.14',
        y: 40,
        user: '이영희',
        date: '2024-03-12',
        dayLabel: '토',
      },
      {
        userId: 'user2',
        x: '03.15-03.21',
        y: 80,
        user: '이영희',
        date: '2024-02-18',
        dayLabel: '토',
      },
      {
        userId: 'user3',
        x: '03.01-03.07',
        y: 20,
        user: '박지민',
        date: '2024-03-05',
        dayLabel: '금',
      },
      {
        userId: 'user3',
        x: '03.08-03.14',
        y: 30,
        user: '박지민',
        date: '2024-03-09',
        dayLabel: '화',
      },
      {
        userId: 'user3',
        x: '03.15-03.21',
        y: 50,
        user: '박지민',
        date: '2024-03-16',
        dayLabel: '목',
      },
    ],
    strength: [
      {
        userId: 'user1',
        x: '03.01-03.07',
        y: 1,
        user: '김철수',
        date: '2024-03-02',
        dayLabel: '화',
      },
      {
        userId: 'user1',
        x: '03.08-03.14',
        y: 1,
        user: '김철수',
        date: '2024-03-11',
        dayLabel: '목',
      },
      {
        userId: 'user1',
        x: '03.15-03.21',
        y: 1,
        user: '김철수',
        date: '2024-02-19',
        dayLabel: '토',
      },
      {
        userId: 'user2',
        x: '03.01-03.07',
        y: 1,
        user: '이영희',
        date: '2024-03-04',
        dayLabel: '목',
      },
      {
        userId: 'user2',
        x: '03.15-03.21',
        y: 1,
        user: '이영희',
        date: '2024-02-17',
        dayLabel: '금',
      },
    ],
    users: [
      { id: 'user1', name: '김철수', strengthWorkoutCount: 3 },
      { id: 'user2', name: '이영희', strengthWorkoutCount: 2 },
      { id: 'user3', name: '박지민', strengthWorkoutCount: 0 },
      { id: 'user4', name: '최민준', strengthWorkoutCount: 0 },
      { id: 'user5', name: '정수연', strengthWorkoutCount: 0 },
    ],
    weeks: [
      { label: '02.10-02.17' },
      { label: '02.18-02.25' },
      { label: '02.26-03.05' },
      { label: '03.06-03.13' },
      { label: '03.14-03.21' },
      { label: '03.22-03.29' },
    ],
    challengePeriod: {
      startDate: '2024-02-10',
      endDate: '2024-03-30',
    },
  },
  todayCount: {
    count: 2,
    total: 5,
  },
  leaderboard: [
    {
      user_id: 'user1',
      user: { name: '김철수', strengthWorkoutCount: 3 },
      points: 260,
    },
    {
      user_id: 'user2',
      user: { name: '이영희', strengthWorkoutCount: 2 },
      points: 180,
    },
    {
      user_id: 'user3',
      user: { name: '박지민', strengthWorkoutCount: 0 },
      points: 100,
    },
    {
      user_id: 'user4',
      user: { name: '최민준', strengthWorkoutCount: 0 },
      points: 0,
    },
    {
      user_id: 'user5',
      user: { name: '정수연', strengthWorkoutCount: 0 },
      points: 0,
    },
  ],
};

// 목 API 함수 정의
const fetchMockApi = (type, params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (type) {
        case 'weekly-chart':
          resolve(MOCK_DATA.weeklyChart);
          break;
        case 'today-count':
          resolve(MOCK_DATA.todayCount);
          break;
        case 'leaderboard':
          resolve(MOCK_DATA.leaderboard);
          break;
        default:
          resolve([]);
      }
    }, 500);
  });
};

// Helper function to format date to MM.DD format
const formatDateToMMDD = (dateString) => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}.${day}`;
};

// Helper function to generate week labels based on challenge period
const generateWeekLabels = (startDateStr, endDateStr) => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Adjust to the beginning of the week (Sunday or Monday depending on your preference)
  const adjustedStartDate = new Date(startDate);

  const weeks = [];
  let currentStart = adjustedStartDate;

  while (currentStart < endDate) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6); // 7-day week

    const formattedStart = formatDateToMMDD(currentStart);
    const formattedEnd = formatDateToMMDD(currentEnd);

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

// Function to determine which week a workout belongs to
const getWeekForDate = (date, weeks) => {
  const workoutDate = new Date(date);

  for (let i = 0; i < weeks.length; i++) {
    const weekStart = weeks[i].startDate;
    const weekEnd = weeks[i].endDate;

    if (workoutDate >= weekStart && workoutDate <= weekEnd) {
      return {
        index: i,
        label: weeks[i].label,
      };
    }
  }

  // If no match, return null or a default
  return null;
};

// WorkoutTable component
const WorkoutTable = ({ challengeId, useMockData = false }) => {
  const [workoutItems, setWorkoutItems] = useState([]);
  const [weekInfo, setWeekInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [activeMembersPercent, setActiveMembersPercent] = useState(0);
  const [apiError, setApiError] = useState(null);
  const observerRef = useRef(null);
  const lastRowRef = useRef(null);
  const router = useRouter();

  // Fetch workout data
  const fetchWorkoutData = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        setApiError(null);

        let weeklyChartData, todayCountData, leaderboardData;

        if (useMockData) {
          // Use mock data
          weeklyChartData = await fetchMockApi('weekly-chart', { challengeId });
          todayCountData = await fetchMockApi('today-count', { challengeId });
          leaderboardData = await fetchMockApi('leaderboard', { challengeId });
        } else {
          // Real API calls
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
            console.log('Today count data received:', todayCountData);

            const leaderboardResponse = await fetch(
              `/api/workouts/user-detail?type=leaderboard${
                challengeId ? `&challengeId=${challengeId}` : ''
              }`
            );
            if (!leaderboardResponse.ok) {
              throw new Error(
                `리더보드 API 오류: ${leaderboardResponse.status}`
              );
            }
            leaderboardData = await leaderboardResponse.json();
            console.log('Leaderboard data received:', leaderboardData);
          } catch (error) {
            console.error('API 호출 중 오류 발생:', error);
            setApiError(`API 호출 오류: ${error.message}`);
            // Fallback to mock data
            console.log('API 오류로 인해 목데이터 사용');
            weeklyChartData = await fetchMockApi('weekly-chart', {
              challengeId,
            });
            todayCountData = await fetchMockApi('today-count', { challengeId });
            leaderboardData = await fetchMockApi('leaderboard', {
              challengeId,
            });
          }
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
        const workoutData = processApiDataToWorkoutItems(
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
        setApiError(error.message);
        setLoading(false);
      }
    },
    [challengeId, useMockData]
  );

  // Process API data to workout items
  const processApiDataToWorkoutItems = (
    weeklyChartData,
    leaderboardData,
    todayCountData,
    generatedWeeks
  ) => {
    // Extract users
    const users = weeklyChartData.users || [];

    // Extract cardio data
    const cardioData = weeklyChartData.cardio || [];

    // Extract strength data
    const strengthData = weeklyChartData.strength || [];

    // Find user points from leaderboard
    const userPointsMap = {};
    if (leaderboardData && Array.isArray(leaderboardData)) {
      leaderboardData.forEach((item) => {
        userPointsMap[item.user_id] = item.points;
      });
    }

    // Create workout items
    const items = users.map((user) => {
      // Create weekly data for each user
      const userWeeklyData = generatedWeeks.map((week, index) => {
        // Find cardio data for this user and week
        const userCardioInWeek = cardioData.filter((item) => {
          // Check if the workout date falls within this week
          const workoutDate = new Date(item.date);
          return (
            item.userId === user.id &&
            workoutDate >= week.startDate &&
            workoutDate <= week.endDate
          );
        });

        // Find strength data for this user and week
        const userStrengthInWeek = strengthData.filter((item) => {
          // Check if the workout date falls within this week
          const workoutDate = new Date(item.date);
          return (
            item.userId === user.id &&
            workoutDate >= week.startDate &&
            workoutDate <= week.endDate
          );
        });

        // Calculate cardio percentage (max 100%)
        const cardioPoints = userCardioInWeek.reduce(
          (sum, item) => sum + item.y,
          0
        );
        const cardioPercentage =
          cardioPoints > 0 ? Math.min(Math.round(cardioPoints), 100) : 0;

        // Weekly strength sessions count
        const strengthSessions = userStrengthInWeek.length;

        // Extract date range
        const startDate = formatDateToMMDD(week.startDate);
        const endDate = formatDateToMMDD(week.endDate);

        return {
          weekNumber: index + 1, // Week number is now correctly the index + 1
          startDate: startDate,
          endDate: endDate,
          aerobicPercentage: cardioPercentage,
          strengthSessions: strengthSessions,
        };
      });

      // Check if user is active this week (has data in the most recent week)
      const isActiveThisWeek =
        userWeeklyData.length > 0 &&
        (userWeeklyData[userWeeklyData.length - 1].aerobicPercentage > 0 ||
          userWeeklyData[userWeeklyData.length - 1].strengthSessions > 0);

      // Calculate total achievements
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

    // Sort by total aerobic percentage (descending)
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
  const calculateTotalAchievements = (items) => {
    return items.reduce((sum, item) => {
      return sum + (item.totalAchievements || 0);
    }, 0);
  };

  // Calculate active members percentage
  const calculateActiveMembersPercent = (items) => {
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
    (entries) => {
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

  if (apiError && !useMockData) {
    return (
      <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
        <h2 className="font-bold">API 오류 발생</h2>
        <p>{apiError}</p>
        <p className="mt-2">
          목데이터를 사용하시려면 useMockData prop을 true로 설정하세요.
        </p>
      </div>
    );
  }

  // Mobile rendering
  if (isMobile) {
    return (
      <div className="mt-6 w-full">
        {useMockData && (
          <div className="mb-4 text-center bg-yellow-100 p-2 rounded">
            <span className="font-semibold">🔧 목데이터 사용 중</span> - API
            연결 없이 테스트 데이터로 UI를 렌더링합니다.
          </div>
        )}

        {/* Mobile member list */}
        {workoutItems.map((item, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h3 className="text-md text-[#6F6F6F] text-1.125-700 mb-3 pl-3 py-4">
              {item.name} 회원님
            </h3>

            <div className="flex border-b border-gray-200 py-2 px-4 items-center">
              <div className="w-1/2 text-gray-11 text-1.125-500 text-center">
                주차
              </div>
              <div className="w-1/2 text-gray-11 text-1.125-500 text-center">
                유산소 / 근력
              </div>
            </div>

            {/* Weekly data */}
            {item.weeklyData.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="flex border-b border-gray-200 py-2 text-center"
              >
                <div className="w-1/2 text-gray-11 text-1.125-500">
                  {week.weekNumber}주차
                  <br />({week.startDate}~{week.endDate})
                </div>
                <div className="w-1/2 text-gray-11 text-1.125-700">
                  <span className="text-blue-500">
                    {week.aerobicPercentage}%
                  </span>
                  / {week.strengthSessions}회
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Desktop rendering
  return (
    <div className="mt-6 overflow-x-auto w-full">
      {useMockData && (
        <div className="mb-4 text-center bg-yellow-100 p-2 rounded">
          <span className="font-semibold">🔧 목데이터 사용 중</span> - API 연결
          없이 테스트 데이터로 UI를 렌더링합니다.
        </div>
      )}

      {/* Main workout table */}
      <div className="min-w-[1000px] max-w-full">
        <table className="w-full bg-white shadow-md rounded-md border border-gray-200">
          <thead>
            <tr className="bg-white text-[#A1A1A1]">
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
                <th
                  key={index}
                  className="w-[10%] p-3 text-center cursor-pointer hover:bg-gray-100"
                  onClick={() =>
                    router.push(
                      `/workout/workout-categories?challengeId=${challengeId}&weekLabel=${
                        typeof week.label === 'string'
                          ? week.label
                          : `${week.startDate}-${week.endDate}`
                      }`
                    )
                  }
                >
                  <span className="text-sm">
                    {index + 1}주차
                    <br />(
                    {typeof week.label === 'string'
                      ? week.label
                      : `${week.startDate}-${week.endDate}`}
                    )
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workoutItems.map((item, index) => (
              <tr
                key={index}
                ref={index === workoutItems.length - 1 ? lastRowRef : null}
                className="border-b border-gray-200 hover:bg-[#F4F6FC] cursor-pointer"
                onClick={() =>
                  item.id &&
                  router.push(`/user/${item.challenge_id}/workout/${item.id}`)
                }
              >
                <td className="p-3">
                  <div>
                    {item.userName}
                    <br />#{item.userId.substring(0, 4)}
                  </div>
                </td>
                <td className="p-3">{item.name}</td>
                {item.weeklyData.map((week, weekIndex) => (
                  <td key={weekIndex} className="p-3 text-center text-blue-500">
                    {week.aerobicPercentage}% / {week.strengthSessions}회
                  </td>
                ))}
                {/* Add empty cells if weekly data is less than week info */}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkoutTable;
