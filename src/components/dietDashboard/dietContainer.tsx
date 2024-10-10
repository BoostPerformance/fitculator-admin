'use client';
import React, { useState } from 'react';
import Title from '../layout/title';
import TotalFeedbackCounts from './totalFeedbackCount';
import DateInput from '../input/dateInput';
import SearchIput from '../input/searchInput';
import DietTable from './dietTable';
import DietItems from '@/components/mock/DietItems';

export default function DietContainer() {
  // 총 피드백 개수 계산
  const totalFeedbackCount = DietItems.reduce(
    (total, item) => total + parseInt(item.feedback.split('/')[0], 10),
    0
  );

  return (
    <div className="flex-1 p-6 bg-gray-100 pt-[7rem] pl-[10rem] bg-white-1 ">
      <div className="drop-shadow-md">
        <Title title="팻다챌 챌린지 식단 현황" />
        <TotalFeedbackCounts count={totalFeedbackCount.toString()} total="30" />
      </div>
      <div className="flex justify-between items-center mt-[1.5rem]">
        <DateInput />
        <SearchIput />
      </div>

      <DietTable
        data={DietItems.map((item) => ({
          id: item.id,
          discordId: item.discordId,
          name: item.name,
          morning: item.meals.breakfast.description,
          lunch: item.meals.lunch.description,
          dinner: item.meals.dinner.description,
          snack: item.meals.snack.description,
          updateTime: item.updatedAt.split('T')[1],
          feedback: item.feedback,
        }))}
      />
    </div>
  );
}
