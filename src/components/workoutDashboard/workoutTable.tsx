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
        date: '2024-03-18',
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
        date: '2024-03-19',
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
        date: '2024-03-17',
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
      { label: '03.01-03.07' },
      { label: '03.08-03.14' },
      { label: '03.15-03.21' },
      { label: '03.22-03.28' },
      { label: '03.29-04.04' },
    ],
    challengePeriod: {
      startDate: '2024-03-01',
      endDate: '2024-04-30',
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
    // 실제 네트워크 요청처럼 약간의 지연 추가
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

// WorkoutTable 컴포넌트
const WorkoutTable = ({
  selectedDate,
  challengeId,
  useMockData = true, // 목데이터 사용 여부 플래그 추가
}) => {
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

  // 데이터 가져오기 함수
  const fetchWorkoutData = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        setApiError(null);

        let weeklyChartData, todayCountData, leaderboardData;

        if (useMockData) {
          // 목데이터 사용
          weeklyChartData = await fetchMockApi('weekly-chart', { challengeId });
          todayCountData = await fetchMockApi('today-count', { challengeId });
          leaderboardData = await fetchMockApi('leaderboard', { challengeId });
        } else {
          // 실제 API 호출
          const weeklyResponse = await fetch(
            `/api/workout?type=weekly-chart&challengeId=${challengeId || ''}`
          );
          if (!weeklyResponse.ok) {
            throw new Error(`주간 차트 API 오류: ${weeklyResponse.status}`);
          }
          weeklyChartData = await weeklyResponse.json();

          const todayCountResponse = await fetch(
            `/api/workout?type=today-count&challengeId=${challengeId || ''}`
          );
          if (!todayCountResponse.ok) {
            throw new Error(
              `오늘 카운트 API 오류: ${todayCountResponse.status}`
            );
          }
          todayCountData = await todayCountResponse.json();

          const leaderboardResponse = await fetch(
            `/api/workout?type=leaderboard&challengeId=${challengeId || ''}`
          );
          if (!leaderboardResponse.ok) {
            throw new Error(`리더보드 API 오류: ${leaderboardResponse.status}`);
          }
          leaderboardData = await leaderboardResponse.json();
        }

        // 주차 정보 설정
        if (weeklyChartData.weeks && weeklyChartData.weeks.length > 0) {
          setWeekInfo(weeklyChartData.weeks);
        }

        // API 응답 데이터를 WorkoutItem 형식으로 변환
        const workoutData = processApiDataToWorkoutItems(
          weeklyChartData,
          leaderboardData,
          todayCountData
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
    [challengeId, selectedDate, useMockData]
  );

  // API 응답 데이터를 WorkoutItem 형식으로 변환하는 함수
  const processApiDataToWorkoutItems = (
    weeklyChartData,
    leaderboardData,
    todayCountData
  ) => {
    // 주별 데이터 추출
    const weeks = weeklyChartData.weeks || [];

    // 사용자 정보 추출
    const users = weeklyChartData.users || [];

    // 유산소 데이터 추출
    const cardioData = weeklyChartData.cardio || [];

    // 근력 데이터 추출
    const strengthData = weeklyChartData.strength || [];

    // 리더보드 데이터로 사용자별 총점 찾기
    const userPointsMap = {};
    if (leaderboardData && Array.isArray(leaderboardData)) {
      leaderboardData.forEach((item) => {
        userPointsMap[item.user_id] = item.points;
      });
    }

    // WorkoutItem 배열 생성
    const items = users.map((user) => {
      // 사용자별 주별 데이터 생성
      const userWeeklyData = weeks.map((week, index) => {
        // 해당 주에 대한 유저의 유산소 데이터 필터링
        const userCardioInWeek = cardioData.filter(
          (item) => item.userId === user.id && item.x === week.label
        );

        // 해당 주에 대한 유저의 근력 데이터 필터링
        const userStrengthInWeek = strengthData.filter(
          (item) => item.userId === user.id && item.x === week.label
        );

        // 유산소 달성률 계산 (100%를 기준으로)
        const cardioPoints = userCardioInWeek.reduce(
          (sum, item) => sum + item.y,
          0
        );
        const cardioPercentage =
          cardioPoints > 0 ? Math.min(Math.round(cardioPoints), 100) : 0;

        // 주간 근력 세션 횟수
        const strengthSessions = userStrengthInWeek.length;

        // 주차 날짜 범위 추출
        // MM.DD-MM.DD 형식에서 시작일과 종료일 분리
        const dateRange = week.label.split('-');
        const startDate = dateRange[0];
        const endDate = dateRange.length > 1 ? dateRange[1] : '';

        return {
          weekNumber: index + 1,
          startDate: startDate,
          endDate: endDate,
          aerobicPercentage: cardioPercentage,
          strengthSessions: strengthSessions,
        };
      });

      // 이번 주에 활성화 여부 확인 (최근 주에 데이터가 있으면 활성 상태로 간주)
      const isActiveThisWeek =
        userWeeklyData.length > 0 &&
        (userWeeklyData[userWeeklyData.length - 1].aerobicPercentage > 0 ||
          userWeeklyData[userWeeklyData.length - 1].strengthSessions > 0);

      // 전체 달성도 합계 계산
      const totalAchievement = userWeeklyData.reduce(
        (sum, week) => sum + week.aerobicPercentage,
        0
      );

      return {
        id: user.id,
        challenge_id: challengeId || 'mock-challenge',
        userId: user.id,
        userName: user.name.split(' ')[0] || 'User',
        name: user.name || '유저',
        weeklyData: userWeeklyData,
        hasUploaded: userPointsMap[user.id] > 0,
        activeThisWeek: isActiveThisWeek,
        totalAchievements: totalAchievement,
      };
    });

    // 유산소 달성률 기준으로 내림차순 정렬
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

  // 총 달성도 계산
  const calculateTotalAchievements = (items) => {
    return items.reduce((sum, item) => {
      return sum + (item.totalAchievements || 0);
    }, 0);
  };

  // 활성 멤버 비율 계산
  const calculateActiveMembersPercent = (items) => {
    if (!items || items.length === 0) return 0;
    const activeMembers = items.filter((item) => item.activeThisWeek).length;
    return Math.round((activeMembers / items.length) * 100);
  };

  // 초기 로드 및 날짜/챌린지 ID 변경 시 데이터 가져오기
  useEffect(() => {
    setPage(1);
    fetchWorkoutData(1);
  }, [fetchWorkoutData, selectedDate, challengeId]);

  // 미디어 쿼리 감지 로직
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px 이하를 모바일로 간주
    };

    // 초기 로드 시 한 번 체크
    checkIsMobile();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', checkIsMobile);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && hasMore) {
        const currentScrollPosition = window.scrollY;
        setPage((prev) => {
          const nextPage = prev + 1;
          // 페이지네이션이 필요한 경우 다음 페이지 불러오기
          // handleLoadMore(nextPage);

          // 스크롤 위치 복원
          requestAnimationFrame(() => {
            window.scrollTo(0, currentScrollPosition);
          });
          return nextPage;
        });
      }
    },
    [loading, hasMore]
  );

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
        <p className="mt-2">
          목데이터를 사용하시려면 useMockData prop을 true로 설정하세요.
        </p>
      </div>
    );
  }

  // 모바일 렌더링
  if (isMobile) {
    return (
      <div className="mt-6 w-full">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold">F&S 휘트니스 CSO 휘트니</h1>
          <h2 className="text-xl font-bold">운동현황</h2>
          {useMockData && (
            <div className="text-xs bg-yellow-100 p-1 mt-1 inline-block rounded">
              목데이터 사용 중
            </div>
          )}
        </div>

        {/* 모바일용 통계 카드 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <div className="text-gray-500 text-sm mb-1 text-center">
            전체 운동 달성도 수
          </div>
          <div className="text-2xl font-bold text-blue-500 mb-2 text-center">
            {totalAchievements}
            <span className="text-lg">개</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: '100%' }}
            ></div>
          </div>

          <div className="flex justify-between mb-2">
            <div className="w-[48%]">
              <div className="text-gray-500 text-sm mb-1">업로드 평균</div>
              <div className="text-xl font-bold text-blue-500 mb-2">
                {workoutItems.filter((item) => item.hasUploaded).length}
                <span className="text-base">/{workoutItems.length}명</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${
                      workoutItems.length > 0
                        ? (workoutItems.filter((item) => item.hasUploaded)
                            .length /
                            workoutItems.length) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="w-[48%]">
              <div className="text-gray-500 text-sm mb-1">이번주 활성 운동</div>
              <div className="text-xl font-bold text-green-500 mb-2">
                {activeMembersPercent}
                <span className="text-base">%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${activeMembersPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 모바일용 멤버 리스트 */}
        {workoutItems.map((item, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h3 className="text-md font-medium mb-3">{item.name}</h3>

            <div className="flex border-b border-gray-200 py-2">
              <div className="w-1/2 font-medium text-gray-500">주차</div>
              <div className="w-1/2 font-medium text-gray-500">
                유산소 / 근력
              </div>
            </div>

            {/* 주차별 데이터 */}
            {item.weeklyData.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="flex border-b border-gray-200 py-2"
              >
                <div className="w-1/2 text-blue-500">
                  {week.weekNumber}주차
                  <br />({week.startDate}~)
                </div>
                <div className="w-1/2 text-blue-500">
                  {week.aerobicPercentage}% / {week.strengthSessions}회
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // 데스크톱 렌더링
  return (
    <div className="mt-6 overflow-x-auto w-full">
      {useMockData && (
        <div className="mb-4 text-center bg-yellow-100 p-2 rounded">
          <span className="font-semibold">🔧 목데이터 사용 중</span> - API 연결
          없이 테스트 데이터로 UI를 렌더링합니다.
        </div>
      )}

      {/* 메인 워크아웃 테이블 */}
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
              {/* 주차 헤더 동적 생성 - 각 주차와 날짜 범위 표시 */}
              {weekInfo.map((week, index) => (
                <th key={index} className="w-[10%] p-3 text-center">
                  <span className="text-sm">
                    {index + 1}주차
                    <br />({week.label})
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
                {/* 주차 데이터가 주차 정보보다 적은 경우 빈 셀 추가 */}
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
