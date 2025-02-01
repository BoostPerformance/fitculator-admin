'use client';
import { useState, useEffect } from 'react';
import DietDetaileTable from '@/components/dietDashboard/dietDetailTable';
import Sidebar from '@/components/fixedBars/sidebar';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import DateInput from '@/components/input/dateInput';
import {
  ProcessedMeal,
  MealData,
  Challenges,
} from '@/types/dietDetaileTableTypes';
import { useParams } from 'next/navigation';

type PageParams = {
  challengeId: string;
};

export default function DietItem() {
  const params = useParams();
  const [meals, setMeals] = useState<MealData[]>([]);
  const [challenges, setChallenges] = useState<{ challenges: Challenges }[]>(
    []
  );
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [adminData, setAdminData] = useState({
    admin_role: '',
    display_name: '',
  });

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
        }

        const adminResponse = await fetch('/api/admin-users');
        if (!adminResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const adminData = await adminResponse.json();
        setAdminData(adminData);

        const mealsResponse = await fetch('/api/meals');
        const mealsData = await mealsResponse.json();
        setMeals(mealsData);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChallengeSelect = (challengeId: string) => {
    // 선택된 챌린지 찾기
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
    }
  };

  const filteredByChallengeId = meals.filter(
    (meal: MealData) =>
      meal.daily_records.challenge_participants.challenges.id ===
      selectedChallengeId
  );

  const filteredMeals = filteredByChallengeId.reduce<
    Record<string, ProcessedMeal>
  >((acc, meal) => {
    const userId = meal.daily_records.challenge_participants.users.display_name;

    if (!acc[userId]) {
      acc[userId] = {
        user: {
          display_name:
            meal.daily_records.challenge_participants.users.display_name,
          name: meal.daily_records.challenge_participants.users.name,
        },
        daily_record: meal.daily_records,
        meals: {
          breakfast: '',
          lunch: '',
          dinner: '',
          snack: '',
          supplement: '',
        },
        updated_at: meal.updated_at,
      };
    }

    // 각 meal_type에 해당하는 description 할당
    acc[userId].meals[meal.meal_type] = meal.description;
    // console.log(acc);
    return acc;
  }, {});

  // console.log(filteredByChallengeId);
  const organizedMeals = Object.values(filteredMeals);
  //console.log('organizedMeals', organizedMeals);
  // console.log(filteredMeals);

  return (
    <div className="bg-white-1 flex ">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        coach={adminData.display_name}
      />
      <div className="flex flex-col gap-[2rem]">
        <div className="flex gap-[0.625rem] overflow-x-auto sm:grid sm:grid-cols-2 sm:grid-rows-3">
          <TotalFeedbackCounts
            counts="100개"
            title="전체식단 업로드 수"
            borderColor="border-blue-500"
            textColor="text-blue-500"
            grids="col-span-2"
          />
          <TotalFeedbackCounts
            counts="10"
            total="30명"
            title="오늘 업로드 식단 멤버"
            borderColor="border-green"
            textColor="text-green"
            grids="col-span-2"
          />
          <TotalFeedbackCounts
            counts="10"
            total="30명"
            title="피드백 미작성"
            borderColor="border-[#FDB810]"
            textColor="text-[#FDB810]"
            grids="col-span-2"
          />
        </div>
        <div>
          <DateInput
            onChange={() => {
              console.log('click');
            }}
            selectedDate="2025-1-29"
          />
          <DietDetaileTable dietDetailItems={organizedMeals} />
        </div>
      </div>
    </div>
  );
}
