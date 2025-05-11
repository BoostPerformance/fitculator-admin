'use client';
import { ProcessedMeal } from '@/types/dietDetaileTableTypes';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import { ChallengeParticipant } from '@/types/userPageTypes';
import Image from 'next/image';

interface ExcerciseStatsProps {
  processedMeals: ProcessedMeal[];
  selectedChallengeId?: string;
  dailyRecords?: ChallengeParticipant[];
  selectedDate: string;
}

const ExcerciseStatistics = ({
  processedMeals,
  selectedChallengeId,
  dailyRecords,
  selectedDate,
}: ExcerciseStatsProps) => {
  const getTotalMealUploads = (meals: ProcessedMeal[]) => {
    return meals.reduce((total, meal) => {
      if (meal.record_date === selectedDate) {
        const hasAnyMeal = Object.values(meal.daily_records.meals).some(
          (mealArray) =>
            mealArray.some((mealItem) => mealItem.description.trim() !== '')
        );
        return total + (hasAnyMeal ? 1 : 0);
      }
      return total;
    }, 0);
  };

  const getTotalWorkoutUploadCount = (meals: ProcessedMeal[]) => {
    const selectedDateMembers = new Set();

    meals.forEach((meal) => {
      if (meal.record_date === selectedDate) {
        const hasAnyMeal = Object.values(meal.daily_records.meals).some(
          (mealArray) =>
            mealArray.some((mealItem) => mealItem.description.trim() !== '')
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
          mealArray.some((mealItem) => mealItem.description.trim() !== '')
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

  const todayStats = getTotalWorkoutUploadCount(processedMeals);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-1 gap-4 px-[2rem] pb-[3rem] sm:px-3">
        <div>
          <TotalFeedbackCounts
            counts={`${todayStats.totalMembers}개`}
            title="전체 운동 업로드 수"
            borderColor="border-blue-5"
            textColor="text-blue-5"
          />
        </div>
        <div>
          <TotalFeedbackCounts
            counts={`${10}`}
            total={'10 명'}
            title="오늘 운동 업로드 멤버"
            borderColor="border-blue-5"
            textColor="text-blue-5"
          />
        </div>
        <div>
          <TotalFeedbackCounts
            counts={`${60.1}%`}
            total={''}
            title="이번주 평균 운동량"
            borderColor="border-green"
            textColor="text-green"
          />
        </div>
      </div>
    </>
  );
};

export { ExcerciseStatistics };
