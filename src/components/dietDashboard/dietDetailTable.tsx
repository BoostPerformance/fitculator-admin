'use client';
import Image from 'next/image';
import { DietDetailTableProps } from '@/types/dietDetaileTableTypes';
import { useRouter } from 'next/navigation';

const DietDetaileTable = ({ dietDetailItems }: DietDetailTableProps) => {
  const router = useRouter();
  const isfeedback = (feedback: string | null) => {
    return (
      <div
        className={`py-[0.375rem] px-[0.625rem] ${
          feedback ? 'bg-[#13BE6E]' : 'bg-red-500'
        } text-white  rounded-[0.3rem] text-0.875-500`}
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
    // 날짜 포맷팅 (YYYY-MM-DD)
    const recordDate = new Date(record_date).toISOString().split('T')[0];

    // 시간 포맷팅 (HH:MM)
    const upatedDate = new Date(updated_date).toISOString().split('T')[0];
    const updateTime = new Date(updated_time);
    const hours = String(updateTime.getHours()).padStart(2, '0');
    const minutes = String(updateTime.getMinutes()).padStart(2, '0');

    return (
      <>
        기록일: {recordDate} <br />
        업데이트시간:
        <br /> {upatedDate} &nbsp;
        {hours}:{minutes}
      </>
    );
  };

  console.log('dietDetailItems', dietDetailItems);

  return (
    <div className="mt-[1.4rem]">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-white text-left text-1.125-500 text-[#A1A1A1]">
            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem] w-[10%]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2rem] sm:text-0.75-500 sm:p-0">
                  닉네임
                </div>
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
            <th className="p-[1rem]  sm:p-0 sm:pt-[1.4rem] w-[10%]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  이름
                </div>
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

            <th className="p-[1rem]  sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  아침
                </div>
              </div>
            </th>

            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  점심
                </div>
              </div>
            </th>

            <th className="p-[1rem]  sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  저녁
                </div>
              </div>
            </th>

            <th className="p-[1rem]  sm:p-0 sm:pt-[1.4rem] w-[10%]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  간식
                </div>
              </div>
            </th>
            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem] w-[10%]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  영양제
                </div>
              </div>
            </th>
            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  업데이트
                </div>
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
            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem]  w-[13%]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  피드백 현황
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="text-center ">
          {dietDetailItems.map((dietDetailTableItem: any, index: number) => (
            <tr
              key={index}
              className="text-[#6F6F6F] hover:bg-[#F4F6FC]"
              onClick={() =>
                router.push(
                  `/user/${dietDetailTableItem.challenge_id}/diet/${dietDetailTableItem.user.id}`
                )
              }
            >
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0 lg:py-[2rem] sm:py-[1rem]">
                {dietDetailTableItem.user.display_name}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {dietDetailTableItem.user.name}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {dietDetailTableItem.meals.breakfast}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {dietDetailTableItem.meals.lunch}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {dietDetailTableItem.meals.dinner}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {dietDetailTableItem.meals.snack}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {dietDetailTableItem.meals.supplement}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0 w-[13rem]">
                {formatDateTime(
                  dietDetailTableItem.daily_record.record_date,
                  dietDetailTableItem.daily_record.updated_at,
                  dietDetailTableItem.daily_record.updated_at
                )}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
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
