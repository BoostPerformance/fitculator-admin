'use client';
import React, { useState } from 'react';
import Title from '../layout/title';
import TotalFeedbackCounts from './totalFeedbackCount';
import DateInput from '../input/dateInput';
import SearchIput from '../input/searchInput';
import DietTable from './dietTable';
import DietItems from '@/components/mock/DietItems';

export default function DietContainer() {
  const [selectedDate, setSelectedDate] = useState<Date | null | undefined>(
    null
  ); // Date | null로 타입 설정

  const totalFeedbackCount = DietItems.reduce(
    (total, item) => total + parseInt(item.feedback.split('/')[0], 10),
    0
  );

  const filteredData = selectedDate
    ? DietItems.filter((item) => {
        const updatedDate = item.updatedAt.split('T')[0];
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        return updatedDate === selectedDateString;
      })
    : DietItems;

  return (
    <div className="flex-1 p-6 bg-gray-100 pt-[7rem] pl-[10rem] bg-white-1">
      <div>
        <Title title="팻다챌 챌린지 식단 현황" />
        <TotalFeedbackCounts count={totalFeedbackCount.toString()} total="30" />
      </div>
      <div className="flex justify-between items-center mt-[1.5rem]">
        <DateInput onChange={(date) => setSelectedDate(date)} />
        <SearchIput />
      </div>

      <DietTable
        data={filteredData.map((item) => ({
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
