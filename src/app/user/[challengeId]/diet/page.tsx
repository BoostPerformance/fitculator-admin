'use client';
import { useState, useEffect } from 'react';
import DietDetaileTable from '@/components/dietDashboard/dietDetailTable';
import Sidebar from '@/components/fixedBars/sidebar';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import DateInput from '@/components/input/dateInput';
import {
  ProcessedMeal,
  Meals,
  DailyRecords,
} from '@/types/dietDetaileTableTypes';
import { useParams } from 'next/navigation';
import MobileChart from '@/components/mobileChart';

export default function DietItem() {
  const params = useParams();
  //const [meals, setMeals] = useState<MealData[]>([]);
  const [challenges, setChallenges] = useState<ProcessedMeal[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('2025-1-13');
  const [mobileSize, setMobileSize] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [adminData, setAdminData] = useState({
    admin_role: '',
    display_name: '',
  });

  useEffect(() => {
    // 화면 크기 변경 감지
    const handleResize = () => {
      setMobileSize(window.innerWidth <= 640); // sm 브레이크포인트 (640px)
    };

    // 초기 화면 크기 설정
    handleResize();

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);

    // 클린업 함수
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengesResponse = await fetch('/api/challenges');
        if (!challengesResponse.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengeData = await challengesResponse.json();
        setChallenges(challengeData);

        const currentChallenge = challengeData.find(
          (challenge: any) => challenge.challenge_id === params.challengeId
        );
        if (currentChallenge) {
          setSelectedChallengeId(currentChallenge.challenges.id);
          //setChallengeTitle(currentChallenge.challenges.title);
        }

        const adminResponse = await fetch('/api/admin-users');
        if (!adminResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const adminData = await adminResponse.json();
        setAdminData(adminData);

        // const mealsResponse = await fetch('/api/meals');
        // const mealsData = await mealsResponse.json();
        // setMeals(mealsData);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChallengeSelect = (challengeId: string) => {
    //console.log('Selected ID:', challengeId);

    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    // console.log('Found Challenge:', selectedChallenge);

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
      setChallengeTitle(selectedChallenge.challenges.title);
      //console.log('Setting title to:', selectedChallenge.challenges.title);
    }
  };

  const filteredByChallengeId = challenges.filter(
    (item) => item.challenge_id === selectedChallengeId
  );

  const currentChallengeIndex = challenges.find(
    (challenge) => challenge.challenge_id === selectedChallengeId
  );

  // console.log('selectedChallengeId', selectedChallengeId);
  //console.log(challenges);
  // 해당 인덱스의 챌린지 날짜 가져오기
  const challengeDates = {
    startDate: currentChallengeIndex?.challenges?.start_date || '',
    endDate: currentChallengeIndex?.challenges?.end_date || '',
  };

  // console.log(
  //   'challengeDates, challengeID:',
  //   selectedChallengeId,
  //   challengeDates
  // );

  const allParticipants = filteredByChallengeId.flatMap(
    (challenge) => challenge.challenges.challenge_participants || []
  );

  //console.log('challenges', challenges);
  //console.log('filteredByChallengeId', filteredByChallengeId);
  //console.log('allParticipants', allParticipants);

  const filteredMeals = allParticipants.reduce(
    (acc: Record<string, ProcessedMeal>, participant) => {
      participant.daily_records.forEach(
        (record: DailyRecords, index: number) => {
          const uniqueId = `${participant.users.id}_${record.record_date}_${index}`;

          acc[uniqueId] = {
            challenge_id: selectedChallengeId,
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
          // console.log('record', record);
          // 해당 record에 meals 배열이 있는 경우
          if (record.meals && record.meals.length > 0) {
            record.meals.forEach((meal: Meals) => {
              if (meal.meal_type && meal.description) {
                acc[uniqueId].meals[meal.meal_type] = meal.description;
              }
            });
          }
        }
      );

      return acc;
    },
    {}
  );

  //console.log('filteredMeals:', filteredMeals);

  const organizedMeals = Object.values(filteredMeals).sort((a: any, b: any) =>
    a.daily_record.record_date.localeCompare(b.daily_record.record_date)
  );

  // organizedMeals를 선택된 날짜로 필터링
  const filteredByDate = organizedMeals.filter((meal) => {
    const mealDate = meal.daily_record.record_date;
    return mealDate === selectedDate;
  });
  //console.log('organizedMeals', organizedMeals);

  // 전체 끼니 업로드 수 계산 (각 끼니를 따로 카운트)
  const getTotalMealUploads = (processedMeals: ProcessedMeal[]) => {
    return processedMeals.reduce((total, meal) => {
      // 각 끼니별로 카운트
      const mealCount = Object.values(meal.meals).filter(
        (value) => value !== ''
      ).length;
      return total + mealCount;
    }, 0);
  };
  const getTodayMemberUploads = (processedMeals: ProcessedMeal[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayMembers = new Set();

    processedMeals.forEach((meal) => {
      if (meal.record_date === today) {
        // 하나라도 끼니가 있으면 해당 멤버 카운트
        const hasMeal = Object.values(meal.meals).some((value) => value !== '');
        if (hasMeal) {
          todayMembers.add(meal.user.id);
        }
      }
    });

    return {
      uploadCount: todayMembers.size,
      totalMembers: new Set(processedMeals.map((meal) => meal.user.id)).size,
    };
  };

  const getFeedbackStats = (processedMeals: ProcessedMeal[]) => {
    let completedFeedbacks = 0; // 피드백 완료 수
    let totalRecords = processedMeals.length; // 식단 기록이 있는 전체 레코드 수

    processedMeals.forEach((meal) => {
      // 하나라도 식단이 입력된 경우만 카운트
      if (meal.daily_record.feedbacks?.coach_feedback) {
        completedFeedbacks++;
      }
    });

    // console.log(processedMeals);

    // console.log('Feedback Stats:', {
    //   total: totalRecords,
    //   completed: completedFeedbacks,
    //   pending: totalRecords - completedFeedbacks,
    // });

    return {
      completed: completedFeedbacks,
      pending: totalRecords - completedFeedbacks,
      total: totalRecords,
    };
  };

  const totalMealUploads = getTotalMealUploads(organizedMeals);
  const todayStats = getTodayMemberUploads(organizedMeals);
  const feedbackStats = getFeedbackStats(organizedMeals);
  //console.log('filteredByDate', filteredByDate);

  return (
    <div className="bg-white-1 flex sm:flex-col">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        coach={adminData.display_name}
        onSelectChallengeTitle={handleChallengeSelect}
      />
      <div className="flex flex-col gap-[1rem]">
        <div className="px-[2rem] pt-[2rem]">
          <div className="text-gray-2 text-1.25-700">{challengeTitle}</div>
          <div className="text-black-4 text-1.75-700">식단 현황</div>
        </div>

        <div className="flex gap-[0.625rem] overflow-x-auto sm:grid sm:grid-cols-2 sm:grid-rows-2 px-[2rem] pb-[3rem]">
          <TotalFeedbackCounts
            counts={`${totalMealUploads}개`}
            title="전체식단 업로드 수"
            borderColor="border-blue-500"
            textColor="text-blue-500"
            grids="col-span-2"
          />
          <TotalFeedbackCounts
            counts={todayStats.uploadCount.toString()}
            total={`${todayStats.totalMembers}명`}
            title="오늘 식단 업로드"
            borderColor="border-green"
            textColor="text-green"
            grids="col-span-1"
          />
          <TotalFeedbackCounts
            counts={feedbackStats.completed.toString()}
            total={`${feedbackStats.total}명`}
            title="피드백 미작성"
            borderColor="border-[#FDB810]"
            textColor="text-[#FDB810]"
            grids="col-span-1"
          />
        </div>
        <div className="px-[2rem]">
          <div className="flex sm:justify-center sm:items-center">
            <DateInput
              onChange={(newDate: string) => {
                setSelectedDate(newDate);
              }}
              selectedDate={selectedDate}
              challengeStartDate={challengeDates.startDate}
              challengeEndDate={challengeDates.endDate}
              defaultCurrentDate="2025-01-13"
            />
          </div>
          {mobileSize ? (
            <MobileChart dietDetailItems={filteredByDate} />
          ) : (
            <DietDetaileTable dietDetailItems={filteredByDate} />
          )}
        </div>
      </div>
    </div>
  );
}
