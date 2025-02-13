import Image from 'next/image';
import {
  MobildDieDetailTableProps,
  ProcessedMeal,
} from '@/types/dietDetaileTableTypes';
import { useRouter } from 'next/navigation';

export default function MobileChart({
  dietDetailItems,
  selectedDate,
}: MobildDieDetailTableProps) {
  const router = useRouter();
  const isMealUploaded = (mealName: string) => {
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

  //console.log('dietDetailItems', dietDetailItems);
  return (
    <div className="mt-[3rem] sm:bg-white sm:px-[1rem]">
      <div className="flex flex-col gap-4">
        {dietDetailItems.map((meal: ProcessedMeal, index: number) => {
          //console.log('dietDetailItems', dietDetailItems);
          return (
            <div className="pt-[2rem]" key={meal.user.id || index}>
              <button
                onClick={() =>
                  router.push(
                    `/user/${meal.challenge_id}/diet/${meal.user.id}/${selectedDate}`
                  )
                }
                className="text-[#6F6F6F] text-1.125-500 bg-gray-8 p-2 rounded-[0.5rem]"
              >
                피드백 남기기 →
              </button>
              <div
                onClick={() =>
                  router.push(
                    `/user/${meal.challenge_id}/diet/${meal.user.id}/${selectedDate}`
                  )
                }
                className="text-[#6F6F6F] text-1.125-700 pt-[1rem] pl-[1rem] pb-[1rem]"
              >
                {meal.user.name}
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
                  >
                    <td>{isMealUploaded(meal.meals.breakfast)}</td>
                    <td>{isMealUploaded(meal.meals.lunch)}</td>
                    <td>{isMealUploaded(meal.meals.dinner)}</td>
                    <td>{isMealUploaded(meal.meals.snack)}</td>
                    <td>{isMealUploaded(meal.meals.supplement)}</td>
                  </tr>
                </tbody>
              </table>
              <div
                className="w-full text-center pt-[2rem]"
                onClick={() =>
                  router.push(
                    `/user/${meal.challenge_id}/diet/${meal.user.id}/${selectedDate}`
                  )
                }
              >
                {isfeedback(meal.daily_record.feedbacks?.coach_feedback)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
