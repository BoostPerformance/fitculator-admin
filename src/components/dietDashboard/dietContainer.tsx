'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Title from '../layout/title';
import TotalFeedbackCounts from './totalFeedbackCount';
import DateInput from '../input/dateInput';
import SearchInput from '../input/searchInput';
import DietTable from './dietTable';
import { AI_Feedback, Diet_Feedback } from '@/components/mock/DietItems';
import { CombinedData, Meal, Feedback, User } from '@/types/dietTypes';

// 날짜를 'YYYY-MM-DD' 형식으로 변환하는 함수
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DietContainer() {
  const today = formatDate(new Date()); // 오늘 날짜
  const [selectedDate, setSelectedDate] = useState<string>(today); // 선택된 날짜 상태
  const [combinedData, setCombinedData] = useState<CombinedData[]>([]);

  const fetchMeals = useCallback(async () => {
    try {
      const response = await fetch('/api/dietList');
      const { meals, users } = await response.json(); // API에서 meals와 users를 가져옴

      const combinedData = meals.map((meal: Meal) => {
        const user = users.find((user: User) => user.id === meal.user_id);
        return {
          ...meal,
          name: user ? user.name : 'Unknown',
        };
      });

      const groupedMeals = groupMealsByUser(combinedData);
      const enrichedMeals = addFeedbackToMeals(groupedMeals);
      setCombinedData(enrichedMeals);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // 식단 데이터를 그룹화하는 함수
  const groupMealsByUser = (combinedData: CombinedData[]): CombinedData[] => {
    const grouped: Record<string, CombinedData> = {};
    combinedData.forEach((meal) => {
      const key = `${meal.user_id}-${meal.date}`;

      if (!grouped[key]) {
        grouped[key] = {
          id: meal.user_id,
          name: meal.name,
          breakfast: '',
          lunch: '',
          dinner: '',
          snack: '',
          date: meal.date,
          updateTime: meal.updated_at.split('T')[1].slice(0, 5),
          aiFeedbackText: 'no ai_feedback_text',
          coachFeedbackText: 'no feedback_text',
          feedback: null,
          user_id: meal.user_id,
          meal_type: meal.meal_type,
          description: meal.description || '',
          updated_at: meal.updated_at,
          image_url_1: '',
          image_url_2: '',
          image_url_3: '',
          image_url_4: '',
        };
      }
      if (meal.meal_type === 'BREAKFAST')
        grouped[key].breakfast = meal.description;
      if (meal.meal_type === 'LUNCH') grouped[key].lunch = meal.description;
      if (meal.meal_type === 'DINNER') grouped[key].dinner = meal.description;
      if (meal.meal_type === 'SNACK') grouped[key].snack = meal.description;
    });
    return Object.values(grouped);
  };

  const addFeedbackToMeals = (meals: CombinedData[]): CombinedData[] => {
    return meals.map((meal) => {
      const aiFeedback = AI_Feedback.find(
        (feedback: Feedback) =>
          feedback.user_id === meal.id && feedback.date === meal.date
      );
      const dietFeedback = Diet_Feedback.find(
        (feedback: Feedback) =>
          feedback.user_id === meal.id && feedback.date === meal.date
      );
      return {
        ...meal,
        aiFeedbackText: aiFeedback?.ai_feedback_text || 'no ai_feedback_text',
        coachFeedbackText: dietFeedback?.feedback_text || 'no feedback_text',
        feedback: dietFeedback || null,
      };
    });
  };

  // 선택된 날짜와 일치하는 데이터를 필터링
  const filteredData = combinedData.filter(
    (item) => item.date === selectedDate
  );

  // 날짜 선택 시 호출되는 함수
  const handleDateInput = (formattedDate: string) => {
    setSelectedDate(formattedDate);
  };

  return (
    <div className="flex-1 p-6 bg-gray-100 pt-[7rem] pl-[10rem] bg-white-1">
      <div>
        <Title title="팻다챌 챌린지 식단 현황" />
        <TotalFeedbackCounts
          count={filteredData.length.toString()}
          total="30"
        />
      </div>
      <div className="flex justify-between items-center mt-[1.5rem]">
        <DateInput onChange={handleDateInput} selectedDate={selectedDate} />
        <SearchInput />
      </div>
      <DietTable data={filteredData} />
    </div>
  );
}
