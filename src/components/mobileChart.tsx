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

  //console.log('dietDetailItems', dietDetailItems);
  return (
    <div className="mt-[3rem] sm:bg-white sm:px-[1rem]">
      <div className="flex flex-col gap-4">
        {dietDetailItems.map((meal: ProcessedMeal, index: number) => {
          // console.log('dietDetailItems', dietDetailItems);
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
                    <td>{isMealUploaded(meal.meals.breakfast.description)}</td>
                    <td>{isMealUploaded(meal.meals.lunch.description)}</td>
                    <td>{isMealUploaded(meal.meals.dinner.description)}</td>
                    <td>{isMealUploaded(meal.meals.snack.description)}</td>
                    <td>{isMealUploaded(meal.meals.supplement.description)}</td>
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
              <div>
                {formatDateTime(
                  meal.daily_record.feedbacks?.updated_at,
                  meal.daily_record.feedbacks?.created_at
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
