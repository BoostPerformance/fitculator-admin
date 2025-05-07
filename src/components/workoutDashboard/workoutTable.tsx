'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { WorkoutTableProps } from '@/types/workoutTableTypes';
import { useRouter } from 'next/navigation';
import { DietTableSkeleton } from '../layout/skeleton';

const WorkoutTable = ({
  workoutItems,
  selectedDate,
  loading,
  onLoadMore,
  hasMore,
}: WorkoutTableProps) => {
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useRef<HTMLTableRowElement | null>(null);

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
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && hasMore) {
        const currentScrollPosition = window.scrollY;
        setPage((prev) => {
          const nextPage = prev + 1;
          onLoadMore?.(nextPage);
          // 스크롤 위치 복원
          requestAnimationFrame(() => {
            window.scrollTo(0, currentScrollPosition);
          });
          return nextPage;
        });
      }
    },
    [loading, hasMore, onLoadMore]
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

  if (loading) {
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
            100<span className="text-lg">개</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: '100%' }}
            ></div>
          </div>

          <div className="flex justify-between mb-2">
            <div className="w-[48%]">
              <div className="text-gray-500 text-sm mb-1">업로드 평버</div>
              <div className="text-xl font-bold text-blue-500 mb-2">
                10<span className="text-base">/10명</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>

            <div className="w-[48%]">
              <div className="text-gray-500 text-sm mb-1">이번주 활성 운동</div>
              <div className="text-xl font-bold text-green-500 mb-2">
                60.7<span className="text-base">%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: '60.7%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 모바일용 멤버 리스트 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h3 className="text-md font-medium mb-3">잠글레어학원 휘트니3</h3>

          <div className="flex border-b border-gray-200 py-2">
            <div className="w-1/2 font-medium text-gray-500">주차</div>
            <div className="w-1/2 font-medium text-gray-500">유산소 / 근력</div>
          </div>

          {/* 주차별 데이터 */}
          <div className="flex border-b border-gray-200 py-2">
            <div className="w-1/2 text-blue-500">
              1주차
              <br />
              (03.20~)
            </div>
            <div className="w-1/2 text-blue-500">100% / 1회</div>
          </div>

          <div className="flex border-b border-gray-200 py-2">
            <div className="w-1/2 text-blue-500">
              2주차
              <br />
              (10.07~)
            </div>
            <div className="w-1/2 text-blue-500">100% / 1회</div>
          </div>

          <div className="flex border-b border-gray-200 py-2">
            <div className="w-1/2 text-blue-500">
              3주차
              <br />
              (10.14~)
            </div>
            <div className="w-1/2 text-blue-500">100% / 1회</div>
          </div>
        </div>

        {/* 두 번째 멤버 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-md font-medium mb-3">잠글레어학원 휘트니3</h3>

          <div className="flex border-b border-gray-200 py-2">
            <div className="w-1/2 font-medium text-gray-500">주차</div>
            <div className="w-1/2 font-medium text-gray-500">유산소 / 근력</div>
          </div>

          {/* 주차별 데이터 */}
          <div className="flex border-b border-gray-200 py-2">
            <div className="w-1/2 text-blue-500">
              1주차
              <br />
              (03.20~)
            </div>
            <div className="w-1/2 text-blue-500">100% / 1회</div>
          </div>

          <div className="flex border-b border-gray-200 py-2">
            <div className="w-1/2 text-blue-500">
              2주차
              <br />
              (10.07~)
            </div>
            <div className="w-1/2 text-blue-500">100% / 1회</div>
          </div>

          <div className="flex border-b border-gray-200 py-2">
            <div className="w-1/2 text-blue-500">
              3주차
              <br />
              (10.14~)
            </div>
            <div className="w-1/2 text-blue-500">100% / 1회</div>
          </div>
        </div>

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
      {/* 운동 통계 섹션 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">전체 운동 달성률</div>
          <div className="text-2xl font-bold text-blue-500 mb-2">
            100<span className="text-lg">개</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">
            오늘 운동 달성도 평이
          </div>
          <div className="text-2xl font-bold text-blue-500 mb-2">
            10<span className="text-lg">/10명</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">이번주 운동 참여율</div>
          <div className="text-2xl font-bold text-green-500 mb-2">
            60.1<span className="text-lg">%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: '60.1%' }}
            ></div>
          </div>
        </div>
      </div>

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
                  (10.28~)
                </span>
              </th>
              <th className="w-[10%] p-3 text-center">
                <span className="text-sm">
                  7주차
                  <br />
                  (10.28~)
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 첫 번째와 두 번째 행: 높은 달성률 */}
            <tr
              className="border-b border-gray-200 hover:bg-[#F4F6FC] cursor-pointer"
              onClick={() =>
                router.push(
                  `/user/${dietDetailTableItem.challenge_id}/diet/${dietDetailTableItem.daily_records.id}/${selectedDate}`
                )
              }
            >
              <td className="p-3">
                <div>
                  Ashly
                  <br />
                  #0227
                </div>
              </td>
              <td className="p-3">영등포어학원 휘트니</td>
              <td className="p-3 text-center text-blue-500">100% / 1회</td>
              <td className="p-3 text-center text-blue-500">100% / 2회</td>
              <td className="p-3 text-center text-blue-500">150% / 2회</td>
              <td className="p-3 text-center text-blue-500">90% / 1회</td>
              <td className="p-3 text-center text-blue-500">100% / 2회</td>
              <td className="p-3 text-center text-blue-500">100% / 2회</td>
              <td className="p-3 text-center text-blue-500">100% / 2회</td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-[#F4F6FC] cursor-pointer">
              <td className="p-3">
                <div>
                  Ashly
                  <br />
                  #0227
                </div>
              </td>
              <td className="p-3">영등포어학원 휘트니2</td>
              <td className="p-3 text-center text-blue-500">100% / 1회</td>
              <td className="p-3 text-center text-blue-500">100% / 2회</td>
              <td className="p-3 text-center text-blue-500">150% / 2회</td>
              <td className="p-3 text-center text-blue-500">90% / 1회</td>
              <td className="p-3 text-center text-blue-500">100% / 2회</td>
              <td className="p-3 text-center text-blue-500">100% / 2회</td>
              <td className="p-3 text-center text-blue-500">88% / 2회</td>
            </tr>

            {/* 나머지 행: 낮은 달성률 */}
            {[3, 4, 5].map((idx) => (
              <tr
                key={idx}
                ref={idx === 5 ? lastRowRef : null}
                className="border-b border-gray-200 hover:bg-[#F4F6FC] cursor-pointer"
              >
                <td className="p-3">
                  <div>
                    Ashly
                    <br />
                    #0227
                  </div>
                </td>
                <td className="p-3">영등포어학원 휘트니3</td>
                <td className="p-3 text-center text-blue-500">20% / 0회</td>
                <td className="p-3 text-center text-blue-500">10% / 0회</td>
                <td className="p-3 text-center text-blue-500">40% / 2회</td>
                <td className="p-3 text-center text-blue-500">90% / 1회</td>
                <td className="p-3 text-center text-blue-500">50% / 0회</td>
                <td className="p-3 text-center text-blue-500">50% / 0회</td>
                <td className="p-3 text-center text-blue-500">50% / 0회</td>
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
