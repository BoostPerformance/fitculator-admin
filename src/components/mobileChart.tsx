import Image from 'next/image';
import { MobildDieDetailTableProps } from '@/types/dietDetaileTableTypes';
import { useRouter } from 'next/navigation';

export default function MobileChart({
  dietDetailItems,
  selectedDate,
}: MobildDieDetailTableProps) {
  const router = useRouter();
  const isMealUploaded = (mealName: string) => {
    //console.log('mealName', mealName !== '');

    return mealName !== '' ? (
      <>
        <Image
          src="/svg/check-orange.svg"
          width={30}
          height={30}
          alt="meal-done"
        />
      </>
    ) : (
      <>
        <Image
          src="/svg/incomplete-icon.svg"
          width={30}
          height={30}
          alt="meal-incompleted"
        />
      </>
    );
  };
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
  return (
    <div className="mt-[1.4rem] sm:bg-white ">
      <div className="flex flex-col gap-4">
        {dietDetailItems.map((meal: any, index: any) => {
          return (
            <>
              <div className="text-[#6F6F6F] text-1.125-700 pt-[1rem] pl-[1rem]">
                {meal.user.display_name}
              </div>
              <table className="flex flex-col gap-[1rem] items-center justify-center">
                <thead>
                  <tr className="flex gap-[2rem] items-center justify-center text-gray-11 text-1-500">
                    <th>아침</th>
                    <th>점심</th>
                    <th>저녁</th>
                    <th>간식</th>
                    <th>영양제</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    key={index}
                    className="flex gap-[2rem] items-center justify-center"
                    onClick={() =>
                      router.push(
                        `/user/${meal.challenge_id}/diet/${meal.user.id}/${selectedDate}`
                      )
                    }
                  >
                    <td>{isMealUploaded(meal.meals.breakfast)}</td>
                    <td>{isMealUploaded(meal.meals.lunch)}</td>
                    <td>{isMealUploaded(meal.meals.dinner)}</td>
                    <td>{isMealUploaded(meal.meals.snack)}</td>
                    <td>{isMealUploaded(meal.meals.supplement)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="w-full text-center">
                {isfeedback(meal.daily_record.feedbacks?.coach_feedback)}
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
}
