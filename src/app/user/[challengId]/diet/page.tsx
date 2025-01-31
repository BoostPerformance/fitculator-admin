'use client';
import { useState, useEffect } from 'react';
import DietDetaileTable from '@/components/dietDashboard/dietDetailTable';
import Sidebar from '@/components/fixedBars/sidebar';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import DateInput from '@/components/input/dateInput';

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

interface MealData {
  updated_at: string;
  daily_record_id: string;
  daily_records: DailyRecord;
  description: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'suppliment';
}
interface User {
  display_name: string;
  name: string;
}

interface Challenge {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

interface ChallengeParticipant {
  challenges: Challenge;
  users: User;
}

interface Feedback {
  id: string;
  ai_feedback?: string;
  coach_feedback?: string;
  coach_id: string;
  coach_memo?: string;
  daily_record_id: string;
  updated_at: string;
}

interface DailyRecord {
  id: string;
  participant_id: string;
  updated_at: string;
  challenge_participants: ChallengeParticipant;
  feedbacks: Feedback;
}
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'suppliment';

interface ProcessedMeal {
  user: {
    display_name: string;
    name: string;
  };
  daily_record: DailyRecord;
  meals: Record<MealType, string>;
  updated_at: string;
}

interface DietDetailTableProps {
  dietDetailItems: ProcessedMeal[];
}

export default function DietItem() {
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
    const mealResponse = async () => {
      const response = await fetch('/api/meals');
      const data = await response.json();
      setMeals(data);
    };

    const fetchData = async () => {
      try {
        const challengesResponse = await fetch('/api/challenges');
        if (!challengesResponse.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengeData = await challengesResponse.json();
        setChallenges(challengeData);

        const adminResponse = await fetch('/api/admin-users');
        if (!adminResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const adminData = await adminResponse.json();
        setAdminData(adminData);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
    mealResponse();
  }, []);

  const handleChallengeSelect = (challengeId: string) => {
    // 선택된 챌린지 찾기
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );
    console.log('challenges', challenges);

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
    console.log(userId);

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
          suppliment: '',
        },
        updated_at: meal.updated_at,
      };
    }

    // 각 meal_type에 해당하는 description 할당
    acc[userId].meals[meal.meal_type] = meal.description;
    console.log(acc);
    return acc;
  }, {});

  // console.log(filteredByChallengeId);
  const organizedMeals = Object.values(filteredMeals);
  console.log('organizedMeals', organizedMeals);
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
            counts="10"
            total="30명"
            title="진행현황"
            borderColor="border-green"
            textColor="text-green"
            grids="col-span-2"
          />
          <TotalFeedbackCounts
            counts="10"
            total="30명"
            title="진행현황"
            borderColor="border-green"
            textColor="text-green"
            grids="col-span-2"
          />
          <TotalFeedbackCounts
            counts="10"
            total="30명"
            title="진행현황"
            borderColor="border-green"
            textColor="text-green"
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
