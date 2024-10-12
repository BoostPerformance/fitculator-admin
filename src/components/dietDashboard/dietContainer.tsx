'use client';
import React, { useState, useEffect } from 'react';
import Title from '../layout/title';
import TotalFeedbackCounts from './totalFeedbackCount';
import DateInput from '../input/dateInput';
import SearchIput from '../input/searchInput';
import DietTable from './dietTable';
import { Meals, AI_Feedback, Diet_Feedback } from '@/components/mock/DietItems';

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월을 2자리로 맞춤
  const day = String(date.getDate()).padStart(2, '0'); // 일을 2자리로 맞춤
  return `${year}-${month}-${day}`;
};

export default function DietContainer() {
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today); // 기본값을 오늘 날짜로 설정
  const [combinedData, setCombinedData] = useState<any[]>([]);

  const groupMealsByUser = (meals: any[]) => {
    const grouped: any = {};

    meals.forEach((meal) => {
      const key = `${meal.user_id}-${meal.date}`; // user_id와 date를 기준으로 그룹화
      if (!grouped[key]) {
        grouped[key] = {
          id: meal.user_id,
          name: meal.user_id, // 이름을 임의로 넣었으니 실제로는 적절히 변경
          breakfast: '',
          lunch: '',
          dinner: '',
          snack: '',
          date: meal.date,
          updateTime: meal.updated_at.split('T')[1],
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

  useEffect(() => {
    const combined = groupMealsByUser(Meals).map((meal: any) => {
      const aiFeedback = AI_Feedback.find(
        (feedback) =>
          feedback.user_id === meal.id && feedback.date === meal.date
      );

      const dietFeedback = Diet_Feedback.find(
        (feedback) =>
          feedback.user_id === meal.id && feedback.date === meal.date
      );

      return {
        ...meal,
        aiFeedbackText: aiFeedback?.ai_feedback_text || 'no ai_feedback_text',
        coachFeedbackText: dietFeedback?.feedback_text || 'no feedback_text',
        feedback: dietFeedback,
      };
    });

    setCombinedData(combined);
  }, []);

  const filteredData = selectedDate
    ? combinedData.filter((item) => item.date === selectedDate)
    : combinedData;

  const totalFeedbackCount = combinedData.reduce(
    (total, item) => total + (item.feedback ? 1 : 0), // 피드백이 있는 경우만 카운트
    0
  );

  return (
    <div className="flex-1 p-6 bg-gray-100 pt-[7rem] pl-[10rem] bg-white-1">
      <div>
        <Title title="팻다챌 챌린지 식단 현황" />
        <TotalFeedbackCounts count={totalFeedbackCount.toString()} total="30" />
      </div>
      <div className="flex justify-between items-center mt-[1.5rem]">
        <DateInput
          onChange={(date) => setSelectedDate(formatDate(date))}
          selectedDate={selectedDate}
        />
        <SearchIput />
      </div>

      <DietTable data={filteredData} />
    </div>
  );
}
