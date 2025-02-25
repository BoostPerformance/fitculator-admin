import Image from "next/image";
import {
  MobildDieDetailTableProps,
  ProcessedMeal,
} from "@/types/dietDetaileTableTypes";
import { useRouter } from "next/navigation";
import { MobileChartSkeleton } from "./layout/skeleton";

export default function MobileChart({
  dietDetailItems,
  selectedDate,
  loading,
}: MobildDieDetailTableProps) {
  const router = useRouter();
  if (loading) {
    return <MobileChartSkeleton />;
  }

  const isMealUploaded = (mealName: string) => {
    return mealName !== "" ? (
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

  const isfeedback = (feedback: string | null | undefined) => {
    console.log("피드백 데이터:", {
      rawFeedback: feedback,
      type: typeof feedback,
      isEmpty: feedback === "",
      isNull: feedback === null,
      isUndefined: feedback === undefined,
      length: feedback?.length,
      trimmedLength: feedback?.trim().length,
    });

    // 피드백이 존재하고, 공백이 아닌 문자가 하나라도 있는 경우에만 완료로 표시
    const hasFeedback = Boolean(feedback?.trim().length);
    return (
      <div
        className={`py-[0.375rem] px-[0.625rem] ${
          hasFeedback ? "bg-[#13BE6E]" : "bg-red-500"
        } text-white rounded-[0.3rem] text-0.875-500`}
      >
        <div>{hasFeedback ? "완료" : "미작성"}</div>
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

      let updatedDisplay = "날짜 정보 없음";
      let createdDisplay = "날짜 정보 없음";

      // updated_at 처리
      if (feedback_updated_at) {
        const date = new Date(feedback_updated_at);
        if (!isNaN(date.getTime())) {
          // 유효한 날짜인지 확인
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const formattedDate = kstDate.toISOString().split("T")[0];
          const hours = String(kstDate.getHours()).padStart(2, "0");
          const minutes = String(kstDate.getMinutes()).padStart(2, "0");
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
          const CreatedformattedDate = koreanTime.toISOString().split("T")[0];
          const created_hours = String(koreanTime.getHours()).padStart(2, "0");
          const created_minutes = String(koreanTime.getMinutes()).padStart(
            2,
            "0"
          );
          createdDisplay = `${CreatedformattedDate} ${created_hours}:${created_minutes}`;
        }
      }

      // 업데이트된 시간이 있으면 그것을 사용하고, 없으면 생성 시간을 사용
      const displayTime = feedback_updated_at ? updatedDisplay : createdDisplay;

      return (
        <div className="whitespace-nowrap">
          {displayTime.split(" ")[0]}
          <br />
          {displayTime.split(" ")[1]}
        </div>
      );
    } catch (error) {
      console.error("Date formatting error:", error);
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
            <div className="pt-[2rem] sm:pt-[0rem]" key={meal.user.id || index}>
              {/* <button
                onClick={() =>
                  router.push(
                    `/user/${meal.challenge_id}/diet/${meal.user.id}/${selectedDate}`
                  )
                }
                className="text-[#6F6F6F] text-1.125-500 bg-gray-8 p-2 rounded-[0.5rem]"
              >
                피드백 남기기 →
              </button> */}
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
                    <td>
                      {isMealUploaded(
                        meal.daily_records.meals.breakfast[0]?.description || ""
                      )}
                    </td>
                    <td>
                      {isMealUploaded(
                        meal.daily_records.meals.lunch[0]?.description || ""
                      )}
                    </td>
                    <td>
                      {isMealUploaded(
                        meal.daily_records.meals.dinner[0]?.description || ""
                      )}
                    </td>
                    <td>
                      {isMealUploaded(
                        meal.daily_records.meals.snack[0]?.description || ""
                      )}
                    </td>
                    <td>
                      {isMealUploaded(
                        meal.daily_records.meals.supplement[0]?.description ||
                          ""
                      )}
                    </td>
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
                {isfeedback(meal.daily_records.feedback?.coach_feedback)}
              </div>
              <div>
                {formatDateTime(
                  meal.daily_records.feedback?.updated_at,
                  meal.daily_records.feedback?.created_at
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
