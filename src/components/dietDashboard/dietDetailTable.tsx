'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { DietDetailTableProps, Feedbacks } from '@/types/dietDetaileTableTypes';
import { useRouter } from 'next/navigation';
import { DietTableSkeleton } from '../layout/skeleton';

const DietDetaileTable = ({
  dietDetailItems,
  selectedDate,
  loading,
  onLoadMore,
  hasMore,
}: DietDetailTableProps) => {
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useRef<HTMLTableRowElement | null>(null);

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
  }, [handleObserver, dietDetailItems]);
  const router = useRouter();
  const isfeedback = (feedback: Feedbacks | null) => {
    // console.log('피드백 상태 체크:', {
    //   feedback,
    //   coach_feedback: feedback?.coach_feedback,
    //   feedback_exists: !!feedback,
    //   feedback_type: typeof feedback?.coach_feedback,
    //   feedback_length: feedback?.coach_feedback?.length,
    // });

    // feedback 객체가 존재하고 coach_feedback이 빈 문자열이 아닌 경우 완료로 표시
    const hasFeedback =
      !!feedback?.coach_feedback && feedback.coach_feedback.trim().length > 0;
    return (
      <div
        className={`py-[0.375rem] px-[0.625rem] ${
          hasFeedback ? 'bg-[#13BE6E]' : 'bg-red-500'
        } text-white rounded-[0.3rem] text-0.875-500 whitespace-nowrap`}
      >
        <div>{hasFeedback ? '완료' : '미작성'}</div>
      </div>
    );
  };

  const formatDateTime = (
    feedback_updated_at: string | null | undefined,
    feedback_created_at: string | null | undefined
  ) => {
    try {
      // 둘 다 없는 경우 early return
      if (!feedback_updated_at && !feedback_created_at) {
        return <div></div>;
      }

      let updatedDisplay = '날짜 정보 없음';
      let createdDisplay = '날짜 정보 없음';

      // updated_at 처리
      if (feedback_updated_at) {
        const date = new Date(feedback_updated_at);
        if (!isNaN(date.getTime())) {
          // 유효한 날짜인지 확인
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const formattedDate = kstDate.toISOString().split('T')[0];
          const hours = String(kstDate.getHours()).padStart(2, '0');
          const minutes = String(kstDate.getMinutes()).padStart(2, '0');
          updatedDisplay = `${formattedDate} ${hours}:${minutes}`;
        }
      }

      // created_at 처리
      if (feedback_created_at) {
        const created_date = new Date(feedback_created_at);
        if (!isNaN(created_date.getTime())) {
          // 유효한 날짜인지 확인
          const koreanTime = new Date(
            created_date.getTime() + 9 * 60 * 60 * 1000
          );
          const CreatedformattedDate = koreanTime.toISOString().split('T')[0];
          const created_hours = String(koreanTime.getHours()).padStart(2, '0');
          const created_minutes = String(koreanTime.getMinutes()).padStart(
            2,
            '0'
          );
          createdDisplay = `${CreatedformattedDate} ${created_hours}:${created_minutes}`;
        }
      }

      // 업데이트된 시간이 있으면 그것을 사용하고, 없으면 생성 시간을 사용
      const displayTime = feedback_updated_at ? updatedDisplay : createdDisplay;

      return (
        <div className="whitespace-nowrap">
          {displayTime.split(' ')[0]}
          <br />
          {displayTime.split(' ')[1]}
        </div>
      );
    } catch (error) {
      console.error('Date formatting error:', error);
      return <div>날짜 정보 없음</div>;
    }
  };
  if (loading) {
    return <DietTableSkeleton />;
  }

  return (
    <div className="mt-6 overflow-x-auto w-full">
      <div className="min-w-[1000px] max-w-full">
        {' '}
        {/* 컨테이너 추가 */}
        <table className="w-full bg-white shadow-md rounded-md border border-gray-200">
          <thead>
            <tr className="bg-white text-[#A1A1A1]">
              <th className="w-[6%] p-3">
                <div className="flex items-center justify-start gap-1">
                  <span className="text-sm">ID</span>
                  {/* <button>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={10}
                      height={10}
                      alt="arrow-down"
                    />
                  </button> */}
                </div>
              </th>
              <th className="w-[4%] p-3">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm">이름</span>
                  {/* <button>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={10}
                      height={10}
                      alt="arrow-down"
                    />
                  </button> */}
                </div>
              </th>
              <th className="w-[17%] p-3">
                <span className="text-sm">아침</span>
              </th>
              <th className="w-[17%] p-3">
                <span className="text-sm">점심</span>
              </th>
              <th className="w-[17%] p-3">
                <span className="text-sm">저녁</span>
              </th>
              <th className="w-[10%] p-3">
                <span className="text-sm">간식</span>
              </th>
              <th className="w-[10%] p-3">
                <span className="text-sm">영양제</span>
              </th>
              <th className="w-[11%] p-3">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm text-center">
                    피드백
                    <br /> &nbsp;
                    <br className="lg:hidden md:inline" />
                    업데이트
                  </span>
                  {/* <button>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={10}
                      height={10}
                      alt="arrow-down"
                    />
                  </button> */}
                </div>
              </th>
              <th className="w-[8%] p-3">
                <span className="text-sm">
                  피드백&nbsp;
                  <br className="lg:hidden md:inline" />
                  현황
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {dietDetailItems
              .filter((item) => {
                // meal 데이터가 하나라도 있는지 확인
                const meals = item.daily_records.meals;
                return (
                  meals.breakfast[0]?.description ||
                  meals.lunch[0]?.description ||
                  meals.dinner[0]?.description ||
                  meals.snack[0]?.description ||
                  meals.supplement[0]?.description
                );
              })
              .map((dietDetailTableItem, index) => (
                <tr
                  key={index}
                  ref={index === dietDetailItems.length - 1 ? lastRowRef : null}
                  className="text-[#6F6F6F] hover:bg-[#F4F6FC] cursor-pointer border-gray-13 border-b-[0.1rem]"
                  onClick={() =>
                    router.push(
                      `/user/${dietDetailTableItem.challenge_id}/diet/${dietDetailTableItem.daily_records.id}/${selectedDate}`
                    )
                  }
                >
                  <td className="p-3 sm:text-sm w-[3%]">
                    <div className="truncate ">
                      {dietDetailTableItem.user.username}
                    </div>
                  </td>
                  <td className="p-3 sm:text-sm  w-[3%]">
                    <div className="truncate">
                      {dietDetailTableItem.user.name}
                    </div>
                  </td>
                  <td className="p-3 sm:text-sm">
                    <div className="line-clamp-3">
                      {dietDetailTableItem.daily_records.meals.breakfast[0]
                        ?.description || ''}
                    </div>
                  </td>
                  <td className="p-3 sm:text-sm">
                    <div className="line-clamp-3">
                      {dietDetailTableItem.daily_records.meals.lunch[0]
                        ?.description || ''}
                    </div>
                  </td>
                  <td className="p-3 sm:text-sm">
                    <div className="line-clamp-3">
                      {dietDetailTableItem.daily_records.meals.dinner[0]
                        ?.description || ''}
                    </div>
                  </td>
                  <td className="p-3 sm:text-sm">
                    <div className="line-clamp-2">
                      {dietDetailTableItem.daily_records.meals.snack[0]
                        ?.description || ''}
                    </div>
                  </td>
                  <td className="p-3 sm:text-sm">
                    <div className="line-clamp-2">
                      {dietDetailTableItem.daily_records.meals.supplement[0]
                        ?.description || ''}
                    </div>
                  </td>
                  <td className="p-3 sm:text-sm">
                    {(() => {
                      const rawDate =
                        dietDetailTableItem.daily_records.feedback?.updated_at;
                      if (!rawDate) return null;

                      const utcDate = new Date(rawDate);

                      // UTC 기준으로 시간 구성
                      const yyyy = utcDate.getUTCFullYear();
                      const mm = (utcDate.getUTCMonth() + 1)
                        .toString()
                        .padStart(2, '0');
                      const dd = utcDate
                        .getUTCDate()
                        .toString()
                        .padStart(2, '0');
                      const hh = (utcDate.getUTCHours() + 9)
                        .toString()
                        .padStart(2, '0'); // KST 변환
                      const min = utcDate
                        .getUTCMinutes()
                        .toString()
                        .padStart(2, '0');

                      return (
                        <div className="whitespace-nowrap">
                          {`${yyyy}-${mm}-${dd}`}
                          <br />
                          {`${hh}:${min}`}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-4 lg:p-6 sm:text-sm text-center">
                    {isfeedback(dietDetailTableItem.daily_records.feedback)}
                  </td>
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

export default DietDetaileTable;
