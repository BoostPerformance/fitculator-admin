'use client';
import Image from 'next/image';

interface UserProps {
  name: string;
  display_name: string;
}

interface ChallengesProps {
  title: string;
  start_date: string;
  end_date: string;
}
interface ChallengeParticipantsProps {
  challenge: ChallengesProps;
  users: UserProps;
}
interface FeedbacksProps {
  id: string;
  ai_feedback?: string;
  coach_feedback?: string;
  coach_id: string;
  coach_memo?: string;
  daily_record_id: string;
  updated_at: string;
}
interface DailyRecord {
  id: string;
  participant_id: string;
  updated_at: string;
  challenge_participants: ChallengeParticipantsProps;
  feedbacks: FeedbacksProps;
}

// interface DietDetailTableProps {
//   dietDetailItems: {
//     updated_at: string;
//     daily_record_id: string;
//     daily_records: DailyRecord;
//     description: string;
//     meal_type: string;
//   }[];
// }

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement';
interface ProcessedMeal {
  user: {
    display_name: string;
    name: string;
  };
  daily_record: DailyRecord;
  meals: Record<MealType, string>;
  updated_at: string;
}
interface DietDetailTableProps {
  dietDetailItems: ProcessedMeal[];
}

const DietDetaileTable = ({ dietDetailItems }: DietDetailTableProps) => {
  const isfeedback = (feedback: any) => {
    if (feedback) {
      return (
        <div className="py-[0.375rem] px-[0.625rem] bg-[#13BE6E] text-white  rounded-[0.3rem] text-0.875-500">
          <button>완료</button>
        </div>
      );
    } else {
      return (
        <div className="py-[0.375rem] px-[0.625rem] bg-[#FF5757] text-white rounded-[0.3rem] text-0.875-500">
          <button>미작성</button>
        </div>
      );
    }
  };

  const updatedAt = (time: any) => {
    const date = new Date(time);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  return (
    <div className="mt-[1.4rem]">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-white text-left text-1.125-500 text-[#A1A1A1]">
            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.5rem] sm:text-0.75-500 sm:p-0">
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
            <th className="p-[1rem]  sm:p-0 sm:pt-[1.4rem]">
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

            <th className="p-[1rem]  sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  간식
                </div>
              </div>
            </th>
            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem]">
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
            <th className="p-[1rem] sm:p-0 sm:pt-[1.4rem]">
              <div className="relative flex items-center justify-between sm:flex-col sm:gap-[1rem]">
                <div className="lg:pl-[2.7rem] sm:text-0.75-500 sm:p-0">
                  피드백 현황
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="text-center ">
          {dietDetailItems.map((dietDetailTableItem: ProcessedMeal) => (
            <tr key={1} className="text-[#6F6F6F] hover:bg-[#F4F6FC] ">
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
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {updatedAt(dietDetailTableItem.updated_at)}
              </td>
              <td className="p-[1rem] sm:text-0.625-500 sm:p-0">
                {isfeedback(
                  dietDetailTableItem.daily_record.feedbacks?.coach_feedback
                ) || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietDetaileTable;
