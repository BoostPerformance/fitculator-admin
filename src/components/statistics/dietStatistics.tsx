"use client";
import { ProcessedMeal } from "@/types/dietDetaileTableTypes";
import TotalFeedbackCounts from "@/components/totalCounts/totalFeedbackCount";
import { ChallengeParticipant } from "@/types/userPageTypes";
import Image from "next/image";

interface DietStatsProps {
  processedMeals: ProcessedMeal[];
  selectedChallengeId?: string;
  dailyRecords?: ChallengeParticipant[];
  selectedDate: string;
}

const WeeklyDietRecord = ({
  dailyRecords,
}: {
  dailyRecords?: ChallengeParticipant[];
}) => {
  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(today.setDate(diff));
  };

  const getWeekDates = () => {
    const today = new Date();
    let weekStart = getMondayOfCurrentWeek();

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const hasRecordForDate = (date: string) => {
    if (!dailyRecords) return false;

    // 미래 날짜는 항상 false 반환
    const recordDate = new Date(date);
    const today = new Date();
    if (recordDate > today) return false;

    // 해당 날짜의 기록이 있는지 확인
    return dailyRecords.some((record) =>
      record.daily_records.some(
        (dailyRecord) =>
          dailyRecord.record_date === date &&
          dailyRecord.meals &&
          dailyRecord.meals.length > 0
      )
    );
  };

  return (
    <div></div>
    // <div className="w-full bg-white rounded-lg p-4 mt-4">
    //   <div className="flex flex-col gap-4">
    //     <div className="flex items-center gap-2">
    //       <Image
    //         src="/svg/subtitle-icon.svg"
    //         width={24}
    //         height={24}
    //         alt="subtitle icon"
    //       />
    //       <h2 className="text-lg font-bold">식단 기록 현황</h2>
    //     </div>
    //     <div className="grid grid-cols-7 gap-2">
    //       {weekDates.map((date, i) => (
    //         <div
    //           key={i}
    //           className={`aspect-square ${
    //             hasRecordForDate(date) ? "bg-[#FAAA16]" : "bg-gray-100"
    //           } rounded-lg`}
    //           title={`${date} ${
    //             hasRecordForDate(date) ? "식단 기록 있음" : "식단 기록 없음"
    //           }`}
    //         ></div>
    //       ))}
    //     </div>
    //     <div className="grid grid-cols-7 text-xs text-center">
    //       {["월", "화", "수", "목", "금", "토", "일"].map((day, i) => (
    //         <div key={i}>{day}</div>
    //       ))}
    //     </div>
    //   </div>
    // </div>
  );
};

const DietStatistics = ({
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
    <>
      <div className="flex flex-row gap-[0.625rem] overflow-x-auto sm:flex sm:flex-col sm:gap-[0.3rem] sm:justify-between px-[2rem] pb-[3rem] sm:px-0">
        {/* <TotalFeedbackCounts
        counts={`${totalMealUploads}개`}
        title="오늘 식단 업로드 수"
        // TODO: 원래 "전체 식단 업로드 수"에서 변경
        borderColor="border-blue-500"
        textColor="text-blue-500"
      /> */}

        <TotalFeedbackCounts
          counts={todayStats.uploadCount.toString()}
          total={`${todayStats.totalMembers}명`}
          title="오늘 식단 업로드"
          borderColor="border-green"
          textColor="text-green"
        />

        <TotalFeedbackCounts
          counts={`${feedbackStats.pending}명`}
          total={""}
          title="피드백 미작성"
          borderColor="border-[#FDB810]"
          textColor="text-[#FDB810]"
        />
      </div>
      <WeeklyDietRecord dailyRecords={dailyRecords} />
    </>
  );
};

export { DietStatistics };
