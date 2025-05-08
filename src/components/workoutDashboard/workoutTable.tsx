'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { WorkoutTableProps } from '@/types/workoutTableTypes';
import { useRouter } from 'next/navigation';
import { DietTableSkeleton } from '../layout/skeleton';

const WorkoutTable = ({ selectedDate }: WorkoutTableProps) => {
  const [workoutItems, setWorkoutItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const observerRef = useRef(null);
  const lastRowRef = useRef(null);

  // 데이터 가져오기 함수
  const fetchWorkoutData = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/workout?page=${pageNum}&date=${selectedDate || ''}`
        );

        if (!response.ok) {
          throw new Error('서버 응답 에러');
        }

        const data = await response.json();

        if (pageNum === 1) {
          setWorkoutItems(data.items || []);
        } else {
          setWorkoutItems((prev) => [...prev, ...(data.items || [])]);
        }

        setHasMore(data.hasMore || false);
        setLoading(false);
      } catch (error) {
        console.error('운동 데이터 불러오기 실패:', error);
        setLoading(false);
      }
    },
    [selectedDate]
  );

  // 초기 로드 및 날짜 변경 시 데이터 가져오기
  useEffect(() => {
    setPage(1);
    fetchWorkoutData(1);
  }, [fetchWorkoutData, selectedDate]);

  // 무한 스크롤 핸들러
  const handleLoadMore = (nextPage) => {
    fetchWorkoutData(nextPage);
  };

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
          handleLoadMore(nextPage);
          // 스크롤 위치 복원
          requestAnimationFrame(() => {
            window.scrollTo(0, currentScrollPosition);
          });
          return nextPage;
        });
      }
    },
    [loading, hasMore, handleLoadMore]
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

  const router = useRouter();

  if (loading && page === 1) {
    return <DietTableSkeleton />;
  }

  // 모바일 렌더링
  if (isMobile) {
    return (
      <div className="mt-6 w-full">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold">F&S 휘트니스 CSO 휘트니</h1>
          <h2 className="text-xl font-bold">운동현황</h2>
        </div>

        {/* 모바일용 통계 카드 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <div className="text-gray-500 text-sm mb-1 text-center">
            전체 운동 달성도 수
          </div>
          <div className="text-2xl font-bold text-blue-500 mb-2 text-center">
            {workoutItems.length > 0
              ? workoutItems.reduce(
                  (total, item) => total + (item.totalAchievements || 0),
                  0
                )
              : 0}
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
                {workoutItems.length > 0
                  ? `${workoutItems.filter((item) => item.hasUploaded).length}`
                  : 0}
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
                {workoutItems.length > 0
                  ? (
                      (workoutItems.filter((item) => item.activeThisWeek)
                        .length /
                        workoutItems.length) *
                      100
                    ).toFixed(1)
                  : 0}
                <span className="text-base">%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      workoutItems.length > 0
                        ? (workoutItems.filter((item) => item.activeThisWeek)
                            .length /
                            workoutItems.length) *
                          100
                        : 0
                    }%`,
                  }}
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
            {item.weeklyData &&
              item.weeklyData.map((week, weekIndex) => (
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

        {loading && hasMore && (
          <div className="w-full text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        )}
      </div>
    );
  }

  // 데스크톱 렌더링
  return (
    <div className="mt-6 overflow-x-auto w-full">
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
              <th className="w-[10%] p-3 text-center">
                <span className="text-sm">
                  1주차
                  <br />
                  (03.20~)
                </span>
              </th>
              <th className="w-[10%] p-3 text-center">
                <span className="text-sm">
                  2주차
                  <br />
                  (10.07~)
                </span>
              </th>
              <th className="w-[10%] p-3 text-center">
                <span className="text-sm">
                  3주차
                  <br />
                  (10.14~)
                </span>
              </th>
              <th className="w-[10%] p-3 text-center">
                <span className="text-sm">
                  4주차
                  <br />
                  (10.21~)
                </span>
              </th>
              <th className="w-[10%] p-3 text-center">
                <span className="text-sm">
                  5주차
                  <br />
                  (10.28~)
                </span>
              </th>
              <th className="w-[10%] p-3 text-center">
                <span className="text-sm">
                  6주차
                  <br />
                  (11.04~)
                </span>
              </th>
              <th className="w-[10%] p-3 text-center">
                <span className="text-sm">
                  7주차
                  <br />
                  (11.11~)
                </span>
              </th>
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
                  router.push(
                    `/user/${item.challenge_id}/workout/${item.id}/${selectedDate}`
                  )
                }
              >
                <td className="p-3">
                  <div>
                    {item.userName || 'Ashly'}
                    <br />#{item.userId || '0227'}
                  </div>
                </td>
                <td className="p-3">{item.name || '유저'}</td>
                {item.weeklyData &&
                  item.weeklyData.map((week, weekIndex) => (
                    <td
                      key={weekIndex}
                      className="p-3 text-center text-blue-500"
                    >
                      {week.aerobicPercentage}% / {week.strengthSessions}회
                    </td>
                  ))}
                {/* 주차 데이터가 7개 미만인 경우 빈 셀 추가 */}
                {item.weeklyData &&
                  [...Array(7 - item.weeklyData.length)].map((_, i) => (
                    <td key={`empty-${i}`} className="p-3 text-center">
                      -
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && hasMore && (
          <div className="w-full text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTable;
