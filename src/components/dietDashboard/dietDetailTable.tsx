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
    record_date: string,
    updated_date: string,
    updated_time: string
  ) => {
    const recordDate = new Date(record_date).toISOString().split('T')[0];
    const upatedDate = new Date(updated_date).toISOString().split('T')[0];
    const updateTime = new Date(updated_time);
    const hours = String(updateTime.getHours()).padStart(2, '0');
    const minutes = String(updateTime.getMinutes()).padStart(2, '0');

    return (
      <div className="whitespace-nowrap">
        기록일: {recordDate} <br />
        업데이트:
        <br /> {upatedDate} &nbsp;
        {hours}:{minutes}
      </div>
    );
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
                <span className="lg:text-base sm:text-sm">업데이트</span>
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
                  dietDetailTableItem.daily_record.record_date,
                  dietDetailTableItem.daily_record.updated_at,
                  dietDetailTableItem.daily_record.updated_at
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
