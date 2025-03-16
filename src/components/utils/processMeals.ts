import {
  ProcessedMeal,
  Meal,
  DailyRecords,
  MealType,
} from '@/types/dietDetaileTableTypes';

import { useMemo } from 'react';

// 메모리 효율성을 위해 useMemo를 사용하는 훅으로 변경
export const useProcessedMeals = (filteredByChallengeId: ProcessedMeal[]) => {
  return useMemo(() => {
    // 참가자 데이터 추출 및 변환
    const processedMeals: ProcessedMeal[] = [];

    // 각 챌린지에 대해 처리
    for (const challenge of filteredByChallengeId) {
      const participants = challenge.challenges.challenge_participants || [];

      // 각 참가자에 대해 처리
      for (const participant of participants) {
        const participantWithChallenge = {
          ...participant,
          challenge_id: challenge.challenge_id,
        };

        // 각 일일 기록에 대해 처리
        for (
          let index = 0;
          index < participantWithChallenge.daily_records.length;
          index++
        ) {
          const record = participantWithChallenge.daily_records[index];

          // 식사 정보 처리
          // DailyRecords.meals는 이미 필요한 구조를 가지고 있으므로 그대로 사용

          // 처리된 식사 정보 추가
          processedMeals.push({
            challenge_id: participantWithChallenge.challenge_id,
            challenges: participantWithChallenge.challenges,
            user: {
              id: participantWithChallenge.users.id,
              username: participantWithChallenge.users.username,
              name: participantWithChallenge.users.name,
            },
            daily_records: record,
            // ProcessedMeal에는 meals 속성이 없으므로 제거
            record_date: record.record_date,
          });
        }
      }
    }

    // 날짜순으로 정렬
    return processedMeals.sort((a, b) =>
      a.record_date.localeCompare(b.record_date)
    );
  }, [filteredByChallengeId]); // 의존성 배열: filteredByChallengeId가 변경될 때만 재계산
};

// 기존 함수도 유지 (하위 호환성)
export const processMeals = (filteredByChallengeId: ProcessedMeal[]) => {
  // 참가자 데이터 추출 및 변환
  const processedMeals: ProcessedMeal[] = [];

  // 각 챌린지에 대해 처리
  for (const challenge of filteredByChallengeId) {
    const participants = challenge.challenges.challenge_participants || [];

    // 각 참가자에 대해 처리
    for (const participant of participants) {
      const participantWithChallenge = {
        ...participant,
        challenge_id: challenge.challenge_id,
      };

      // 각 일일 기록에 대해 처리
      for (
        let index = 0;
        index < participantWithChallenge.daily_records.length;
        index++
      ) {
        const record = participantWithChallenge.daily_records[index];

        // 식사 정보 처리
        // DailyRecords.meals는 이미 필요한 구조를 가지고 있으므로 그대로 사용

        // 처리된 식사 정보 추가
        processedMeals.push({
          challenge_id: participantWithChallenge.challenge_id,
          challenges: participantWithChallenge.challenges,
          user: {
            id: participantWithChallenge.users.id,
            username: participantWithChallenge.users.username,
            name: participantWithChallenge.users.name,
          },
          daily_records: record,
          // ProcessedMeal에는 meals 속성이 없으므로 제거
          record_date: record.record_date,
        });
      }
    }
  }

  // 날짜순으로 정렬
  return processedMeals.sort((a, b) =>
    a.record_date.localeCompare(b.record_date)
  );
};
