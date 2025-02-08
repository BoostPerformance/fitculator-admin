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

  // console.log('filteredByChallengeId', filteredByChallengeId);
  const filteredMeals = allParticipants.reduce(
    (acc: Record<string, ProcessedMeal>, participant) => {
      console.log('allParticipants', allParticipants);

      participant.daily_records.forEach(
        (record: DailyRecords, index: number) => {
          const uniqueId = `${participant.users.id}_${record.record_date}_${index}`;

          acc[uniqueId] = {
            challenge_id: participant.challenge_id,
            challenges: participant.challenges,
            user: {
              id: participant.users.id,
              display_name: participant.users.display_name,
              name: participant.users.name,
            },
            daily_record: record,
            meals: {
              breakfast: '',
              lunch: '',
              dinner: '',
              snack: '',
              supplement: '',
            },
            record_date: record.record_date,
          };

          // 식사 정보가 있는 경우 처리
          if (record.meals && record.meals.length > 0) {
            record.meals.forEach((meal: Meals) => {
              if (meal.meal_type && meal.description) {
                acc[uniqueId].meals[meal.meal_type] = meal.description;
              }
            });
          }
        }
      );
      //console.log('participant', participant);
      return acc;
    },
    {}
  );

  // 날짜순으로 정렬된 배열로 변환
  return Object.values(filteredMeals).sort(
    (a: ProcessedMeal, b: ProcessedMeal) =>
      a.record_date.localeCompare(b.record_date)
  );
};
