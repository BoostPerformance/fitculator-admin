interface Meal {
  description: string;
  id: string;
  meal_type: string;
  updated_at: string;
}

interface DailyRecord {
  id: string;
  record_date: string;
  meals?: Meal[];
  feedbacks: {
    coach_feedback: string;
    created_at: string;
    id: string;
  }[];
}

interface ChallengeParticipant {
  id: string;
  users: {
    id: string;
    name: string;
    display_name: string;
  };
  challenges: {
    id: string;
    title: string;
    end_date: string;
    start_date: string;
    challenge_type: string;
  };
  daily_records: DailyRecord[];
}

interface Challenge {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

export const calculateTodayDietUploads = (
  dailyRecords: ChallengeParticipant[],
  challenges: Challenge[],
  selectedChallengeId: string
) => {
  const selectedChallenge = challenges.find(
    (challenge) => challenge.challenges.id === selectedChallengeId
  );

  if (!selectedChallenge) return { counts: '0', total: '0명' };

  const today = new Date().toISOString().split('T')[0];
  const startDate = new Date(selectedChallenge.challenges.start_date);
  const endDate = new Date(selectedChallenge.challenges.end_date);
  const currentDate = new Date(today);

  // 오늘이 챌린지 기간 안에 있는지 확인
  if (currentDate < startDate || currentDate > endDate) {
    return { counts: '0', total: '0명' };
  }

  // 해당 챌린지의 데일리 레코드만 필터링
  const challengeRecords = dailyRecords.filter(
    (record) => record.challenges.id === selectedChallengeId
  );

  // 전체 참가자 수 (분모)
  const totalParticipants = challengeRecords.length;

  // 오늘 식단을 업로드한 참가자 수 계산 (분자)
  const todayUploads = challengeRecords.filter((record) => {
    const todayRecords = record.daily_records.filter((dailyRecord) => {
      if (dailyRecord.record_date.split('T')[0] !== today) return false;

      // meals 배열이 존재하고, description이 있는 항목이 하나라도 있는지 확인
      return (
        dailyRecord.meals?.some(
          (meal) => meal.description && meal.description.trim() !== ''
        ) || false
      );
    });

    return todayRecords.length > 0;
  });

  return {
    counts: todayUploads.length.toString(),
    total: `${totalParticipants}명`,
  };
};

export const calculateTotalDietUploads = (
  dailyRecords: ChallengeParticipant[],
  challenges: Challenge[],
  selectedChallengeId: string
) => {
  const selectedChallenge = challenges.find(
    (challenge) => challenge.challenges.id === selectedChallengeId
  );

  if (!selectedChallenge) return { counts: '0', total: '0개' };

  const startDate = new Date(selectedChallenge.challenges.start_date);
  const endDate = new Date(selectedChallenge.challenges.end_date);
  const today = new Date();

  // 챌린지 시작일부터 오늘 또는 종료일 중 더 이른 날짜까지의 총 일수 계산
  const lastDate = today < endDate ? today : endDate;
  const totalDays =
    Math.floor(
      (lastDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  // 해당 챌린지의 데일리 레코드만 필터링
  const challengeRecords = dailyRecords.filter(
    (record) => record.challenges.id === selectedChallengeId
  );

  // 전체 예상 식단 기록 수 계산 (분모) - 하루 1회 기준
  const totalParticipants = challengeRecords.length;
  const totalExpectedRecords = totalParticipants * totalDays; // 하루 1회 기준

  // 실제 업로드된 일일 식단 수 계산 (분자)
  let totalUploads = 0;
  challengeRecords.forEach((record) => {
    // 각 날짜별로 한 번이라도 식단을 올렸는지 확인
    const uniqueDates = new Set();

    record.daily_records.forEach((dailyRecord) => {
      const recordDate = new Date(dailyRecord.record_date);
      if (recordDate >= startDate && recordDate <= lastDate) {
        // 해당 날짜에 하나라도 description이 있는 meal이 있으면 카운트
        const hasValidMeal = dailyRecord.meals?.some(
          (meal) => meal.description && meal.description.trim() !== ''
        );

        if (hasValidMeal) {
          // 날짜를 문자열로 변환하여 Set에 추가
          uniqueDates.add(dailyRecord.record_date.split('T')[0]);
        }
      }
    });

    // 식단을 올린 날짜 수를 전체 업로드 수에 추가
    totalUploads += uniqueDates.size;
  });

  return {
    counts: totalUploads.toString(),
    total: `${totalExpectedRecords}개`,
  };
};
