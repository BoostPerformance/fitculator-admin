'use client';
import React, { useState } from 'react';
import Title from '../layout/title';
import TotalFeedbackCounts from './totalFeedbackCount';
import DateInput from '../input/dateInput';
import SearchIput from '../input/searchInput';
import DietTable from './dietTable';
import DietItems from '@/components/mock/DietItems';

export default function DietContainer() {
  return (
    <div className="flex-1 p-6 bg-gray-100 pt-[7rem] pl-[10rem] bg-white-1">
      <Title title="팻다챌 챌린지 식단 현황" />
      <TotalFeedbackCounts count="10" total="30" />
      <div className="flex justify-between items-center mt-[1.5rem]">
        <DateInput />
        <SearchIput />
      </div>

      <DietTable data={DietItems} />
    </div>
  );
}
