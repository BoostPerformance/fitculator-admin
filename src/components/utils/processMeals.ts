import {
  ProcessedMeal,
  Meals,
  DailyRecords,
} from '@/types/dietDetaileTableTypes';

export const processMeals = (filteredByChallengeId: ProcessedMeal[]) => {
  const allParticipants = filteredByChallengeId.flatMap((challenge) =>
    (challenge.challenges.challenge_participants || []).map((participant) => ({
      ...participant,
      challenge_id: challenge.challenge_id, // 원래의 challenge_id를 보존
    }))
  );

  const filteredMeals = allParticipants.reduce(
    (acc: Record<string, ProcessedMeal>, participant) => {
      // console.log('allParticipants', allParticipants);

      participant.daily_records.forEach(
        (record: DailyRecords, index: number) => {
          const uniqueId = `${participant.users.id}_${record.record_date}_${index}`;

          acc[uniqueId] = {
            challenge_id: participant.challenge_id,
            challenges: participant.challenges,
            user: {
              id: participant.users.id,
              username: participant.users.username,
              name: participant.users.name,
            },
            daily_records: record,
            meals: {
              breakfast: { description: '', updated_at: '', meal_time: '' },
              lunch: { description: '', updated_at: '', meal_time: '' },
              dinner: { description: '', updated_at: '', meal_time: '' },
              snack: { description: '', updated_at: '', meal_time: '' },
              supplement: { description: '', updated_at: '', meal_time: '' },
            },
            record_date: record.record_date,
          };

          // 식사 정보가 있는 경우 처리
          if (record.meals && record.meals.length > 0) {
            record.meals.forEach((meal: Meals) => {
              if (meal.meal_type && meal.description) {
                acc[uniqueId].meals[meal.meal_type] = {
                  description: meal.description,
                  updated_at: meal.updated_at || '',
                  meal_time: meal.meal_time || '',
                };
                // console.log(
                //   'here here',
                //   (acc[uniqueId].meals[meal.meal_type] = {
                //     description: meal.description,
                //     updated_at: meal.updated_at || '',
                //     meal_time: meal.meal_time || '',
                //   })
                // );\
              }
            });
          }
        }
      );

      return acc;
    },
    {}
  );

  // 날짜순으로 정렬된 배열로 변환
  const processedMeals = Object.values(filteredMeals).sort(
    (a: ProcessedMeal, b: ProcessedMeal) =>
      a.record_date.localeCompare(b.record_date)
  );

  // const byDate = processedMeals.filter((item) => {
  //   return item.daily_records.record_date === '2025-02-19';
  // });

  // type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement';
  // const mealTypes: MealType[] = [
  //   'breakfast',
  //   'lunch',
  //   'dinner',
  //   'snack',
  //   'supplement',
  // ];

  // // 2월 19일에 입력된 총 끼니 수 계산
  // const totalMealCount = byDate.reduce((total, item) => {
  //   const filledMeals = mealTypes.filter(
  //     (type) => item.meals[type].description.trim() !== ''
  //   );

  //   return total + filledMeals.length;
  // }, 0);

  // console.log('Total Meal Count on 2025-02-19:', totalMealCount);
  // console.log('Processed Meals Length:', byDate);

  return processedMeals;
};
