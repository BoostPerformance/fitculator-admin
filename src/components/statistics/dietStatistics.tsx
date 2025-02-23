"use client";
import { ProcessedMeal } from "@/types/dietDetaileTableTypes";
import TotalFeedbackCounts from "@/components/totalCounts/totalFeedbackCount";
import { ChallengeParticipant } from "@/types/userPageTypes";

interface DietStatsProps {
  processedMeals: ProcessedMeal[];
  selectedChallengeId?: string;
  dailyRecords?: ChallengeParticipant[];
  selectedDate: string;
}

export const DietStatistics = ({
  processedMeals,
  selectedChallengeId,
  dailyRecords,
  selectedDate,
}: DietStatsProps) => {
  const getTotalMealUploads = (meals: ProcessedMeal[]) => {
    return meals.reduce((total, meal) => {
      if (meal.record_date === selectedDate) {
        const hasAnyMeal = Object.values(meal.daily_records.meals).some(
          (mealArray) =>
            mealArray.some((mealItem) => mealItem.description.trim() !== "")
        );
        return total + (hasAnyMeal ? 1 : 0);
      }
      return total;
    }, 0);
  };

  const getTodayMemberUploads = (meals: ProcessedMeal[]) => {
    const selectedDateMembers = new Set();

    meals.forEach((meal) => {
      if (meal.record_date === selectedDate) {
        const hasAnyMeal = Object.values(meal.daily_records.meals).some(
          (mealArray) =>
            mealArray.some((mealItem) => mealItem.description.trim() !== "")
        );
        if (hasAnyMeal) {
          selectedDateMembers.add(meal.user.id);
        }
      }
    });

    // 챌린지에 참여한 전체 참가자 수 계산
    const totalNoRecords =
      dailyRecords?.filter(
        (record) => record.challenges.id === selectedChallengeId
      )?.length ?? 0;

    return {
      uploadCount: selectedDateMembers.size,
      totalMembers: totalNoRecords,
    };
  };
  const getFeedbackStats = (meals: ProcessedMeal[]) => {
    let completedFeedbacks = 0;
    let totalRecords = 0;

    meals.forEach((meal) => {
      if (meal.record_date !== selectedDate) return;

      const hasAnyMeal = Object.values(meal.daily_records.meals).some(
        (mealArray) =>
          mealArray.some((mealItem) => mealItem.description.trim() !== "")
      );

      if (hasAnyMeal) {
        totalRecords++;
        if (meal.daily_records.feedback?.coach_feedback) {
          completedFeedbacks++;
        }
      }
    });

    return {
      completed: completedFeedbacks,
      pending: totalRecords - completedFeedbacks,
      total: totalRecords,
    };
  };

  const totalMealUploads = getTotalMealUploads(processedMeals);
  const todayStats = getTodayMemberUploads(processedMeals);
  const feedbackStats = getFeedbackStats(processedMeals);

  return (
    <div className="flex gap-[0.625rem] overflow-x-auto sm:grid sm:grid-cols-2 sm:grid-rows-2 px-[2rem] pb-[3rem] sm:px-[0.5rem]">
      {/* <TotalFeedbackCounts
        counts={`${totalMealUploads}개`}
        title="오늘 식단 업로드 수"
        // TODO: 원래 "전체 식단 업로드 수"에서 변경
        borderColor="border-blue-500"
        textColor="text-blue-500"
        grids="col-span-2"
      /> */}

      <TotalFeedbackCounts
        counts={todayStats.uploadCount.toString()}
        total={`${todayStats.totalMembers}명`}
        title="오늘 식단 업로드"
        borderColor="border-green"
        textColor="text-green"
        grids="col-span-1"
      />

      <TotalFeedbackCounts
        counts={`${feedbackStats.pending}명`}
        total={""}
        title="피드백 미작성"
        borderColor="border-[#FDB810]"
        textColor="text-[#FDB810]"
        grids="col-span-1"
      />
    </div>
  );
};
