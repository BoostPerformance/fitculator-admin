import { ChallengeParticipant, Challenges } from "@/types/userPageTypes";

export const calculateTodayDietUploads = (
  dailyRecords: ChallengeParticipant[],
  challenges: Challenges[],
  selectedChallengeId: string
) => {
  const selectedChallenge = challenges.find(
    (challenge) => challenge.challenges.id === selectedChallengeId
  );

  if (!selectedChallenge) return { counts: "0", total: "0명" };

  const today = new Date().toISOString().split("T")[0];
  const startDate = new Date(selectedChallenge.challenges.start_date);
  const endDate = new Date(selectedChallenge.challenges.end_date);
  const currentDate = new Date(today);

  // 오늘이 챌린지 기간 안에 있는지 확인
  if (currentDate < startDate || currentDate > endDate) {
    return { counts: "0", total: "0명" };
  }

  // 해당 챌린지의 데일리 레코드만 필터링
  const challengeRecords = Array.isArray(dailyRecords)
    ? dailyRecords.filter(
        (record) => record.challenges.id === selectedChallengeId
      )
    : [];

  // 전체 참가자 수 (분모)
  const totalParticipants = challengeRecords.length;

  // 오늘 식단을 업로드한 참가자 수 계산 (분자)
  const todayUploads = challengeRecords.filter((record) => {
    const todayRecords = record.daily_records.filter((dailyRecord) => {
      if (dailyRecord.record_date.split("T")[0] !== today) return false;

      // meals 배열이 존재하고, description이 있는 항목이 하나라도 있는지 확인
      return (
        dailyRecord.meals?.some(
          (meal) => meal.description && meal.description.trim() !== ""
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
  challenges: Challenges[],
  selectedChallengeId: string
) => {
  const selectedChallenge = challenges.find(
    (challenge) => challenge.challenges.id === selectedChallengeId
  );

  if (!selectedChallenge) return { counts: "0", total: "0개" };

  const startDate = new Date(selectedChallenge.challenges.start_date);
  const endDate = new Date(selectedChallenge.challenges.end_date);
  const today = new Date();

  const lastDate = today < endDate ? today : endDate;
  const totalDays =
    Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  const challengeRecords = Array.isArray(dailyRecords)
    ? dailyRecords.filter(
        (record) => record.challenges.id === selectedChallengeId
      )
    : [];
  //분모: 전체 챌린지 일 수 * 챌린지 참여자
  const totalParticipants = challengeRecords.length;
  const totalExpectedRecords = totalParticipants * totalDays;

  let totalUploads = 0;

  // console.log('selectedChallengeId:', selectedChallengeId);
  // console.log('challengeRecords:', challengeRecords);
  challengeRecords.forEach((participant) => {
    const uploadedDates = new Set();

    //console.log('Participant daily records:', participant.daily_records);

    // daily_records가 있는지 확인
    if (participant.daily_records && Array.isArray(participant.daily_records)) {
      participant.daily_records.forEach((dailyRecord) => {
        //console.log('Daily Record:', dailyRecord);
        if (dailyRecord && dailyRecord.record_date) {
          const recordDate = new Date(dailyRecord.record_date);

          // console.log('Checking record:', {
          //   recordDate,
          //   meals: dailyRecord.meals,
          //   isInRange: recordDate >= startDate && recordDate <= lastDate,
          // });

          if (recordDate >= startDate && recordDate <= lastDate) {
            // meals 배열이 존재하는지 확인
            const hasAnyMeal =
              dailyRecord.meals &&
              dailyRecord.meals.some(
                (meal) => meal.description && meal.description.trim() !== ""
              );

            // console.log('Meal check:', {
            //   date: dailyRecord.record_date,
            //   hasAnyMeal,
            //   meals: dailyRecord.meals,
            // });

            //  console.log('hasAnyMeal:', hasAnyMeal);
            if (hasAnyMeal) {
              uploadedDates.add(dailyRecord.record_date.split("T")[0]);
              // console.log('Added date:', dailyRecord.record_date.split('T')[0]);
              // console.log('Current uploadedDates:', uploadedDates);
            }
          }
        }
      });
    }
    // console.log('Final uploadedDates for participant:', uploadedDates);

    totalUploads += uploadedDates.size;
  });

  // console.log({
  //   challengePeriod: {
  //     start: startDate,
  //     end: endDate,
  //     today,
  //     lastDate,
  //     totalDays,
  //   },
  //   participants: totalParticipants,
  //   expectedRecords: totalExpectedRecords,
  //   actualUploads: totalUploads,
  // });
  const result = {
    counts: totalUploads.toString(),
    total: `${totalExpectedRecords}개`,
  };

  // console.log('Final result:', result);
  return result;
};
