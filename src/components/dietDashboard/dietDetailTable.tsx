'use client';
import Image from 'next/image';
import { DietDetailTableProps } from '@/types/dietDetaileTableTypes';
import { useRouter } from 'next/navigation';

const DietDetaileTable = ({
  dietDetailItems,
  selectedDate,
}: DietDetailTableProps) => {
  const router = useRouter();
  const isfeedback = (feedback: string | null) => {
    return (
      <div
        className={`py-[0.375rem] px-[0.625rem] ${
          feedback ? 'bg-[#13BE6E]' : 'bg-red-500'
        } text-white rounded-[0.3rem] text-0.875-500 whitespace-nowrap`}
      >
        <div>{feedback ? '완료' : '미완성'}</div>
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

      return (
        <div className="whitespace-nowrap">
          피드백 생성: &nbsp;{createdDisplay}
          <br />
          업데이트: &nbsp;{updatedDisplay}
        </div>
      );
    } catch (error) {
      console.error('Date formatting error:', error);
      return <div>날짜 정보 없음</div>;
    }
  };
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full bg-white shadow-md rounded-md min-w-[1000px]">
        <thead>
          <tr className="bg-white lg:text-left md:text-center text-[#A1A1A1]">
            <th className="w-[8%] p-4 lg:p-6">
              <div className="flex items-center justify-start gap-1 md:justify-center">
                <span className="lg:text-base sm:text-sm">닉네임</span>
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
            <th className="w-[8%] p-4 lg:p-6">
              <div className="flex items-center justify-start gap-2 md:justify-center">
                <span className="lg:text-base sm:text-sm ">이름</span>
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
            <th className="w-[15%] p-4 lg:p-6">
              <span className="lg:text-base sm:text-sm">아침</span>
            </th>
            <th className="w-[15%] p-4 lg:p-6">
              <span className="lg:text-base sm:text-sm">점심</span>
            </th>
            <th className="w-[15%] p-4 lg:p-6">
              <span className="lg:text-base sm:text-sm">저녁</span>
            </th>
            <th className="w-[8%] p-4 lg:p-6">
              <span className="lg:text-base sm:text-sm">간식</span>
            </th>
            <th className="w-[9%] p-4 lg:p-6">
              <span className="lg:text-base sm:text-sm">영양제</span>
            </th>
            <th className="w-[13%] p-4 lg:p-6">
              <div className="flex items-center justify-start gap-2 md:justify-center">
                <span className="lg:text-base sm:text-sm text-center">
                  피드백 <br />
                  업데이트
                </span>
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
            <th className="w-[10%] p-4 lg:p-6">
              <span className="lg:text-base sm:text-sm">
                피드백 <br className="lg:hidden sm:hidden md:inline" /> 현황
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dietDetailItems.map((dietDetailTableItem: any, index: number) => (
            <tr
              key={index}
              className="text-[#6F6F6F] hover:bg-[#F4F6FC] cursor-pointer  border-gray-13 border-b-[0.1rem]"
              onClick={() =>
                router.push(
                  `/user/${dietDetailTableItem.challenge_id}/diet/${dietDetailTableItem.user.id}/${selectedDate}`
                )
              }
            >
              <td className="p-4 lg:p-6 sm:text-sm ">
                <div className="truncate">
                  {dietDetailTableItem.user.username}
                </div>
              </td>
              <td className="p-4 lg:p-6 sm:text-sm">
                <div className="truncate">{dietDetailTableItem.user.name}</div>
              </td>
              <td className="p-4 lg:p-6 sm:text-sm">
                <div className="line-clamp-3">
                  {dietDetailTableItem.meals.breakfast}
                </div>
              </td>
              <td className="p-4 lg:p-6 sm:text-sm">
                <div className="line-clamp-3">
                  {dietDetailTableItem.meals.lunch}
                </div>
              </td>
              <td className="p-4 lg:p-6 sm:text-sm">
                <div className="line-clamp-3">
                  {dietDetailTableItem.meals.dinner}
                </div>
              </td>
              <td className="p-4 lg:p-6 sm:text-sm">
                <div className="line-clamp-2">
                  {dietDetailTableItem.meals.snack}
                </div>
              </td>
              <td className="p-4 lg:p-6 sm:text-sm">
                <div className="line-clamp-2">
                  {dietDetailTableItem.meals.supplement}
                </div>
              </td>
              <td className="p-4 lg:p-6 sm:text-sm">
                {formatDateTime(
                  dietDetailTableItem.daily_record.feedbacks?.updated_at,
                  dietDetailTableItem.daily_record.feedbacks?.created_at
                )}
              </td>
              <td className="p-4 lg:p-6 sm:text-sm text-center">
                {isfeedback(
                  dietDetailTableItem.daily_record.feedbacks?.coach_feedback
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietDetaileTable;
