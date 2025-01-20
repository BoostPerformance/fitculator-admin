'use client';
import Stats from '@/components/graph/stats';
import SalesChart from '@/components/graph/salesChart';
import TrafficSourceChart from '@/components/graph/trafficSourceChart';
//import TopReferrals from '@/components/graph/topReferrals';
//import LatestProjects from '@/components/graph/latestProjects';
import DailyDietRecord from '@/components/graph/dailyDietRecord';
//import FixedBars from '@/components/fixedBars/fixedBars';
import WorkoutLeaderboeard from '@/components/graph/workoutLeaderboeard';
import DietTable from '@/components/dietDashboard/dietTable';
import DateInput from '@/components/input/dateInput';
import SearchInput from '@/components/input/searchInput';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import Title from '@/components/layout/title';
import DietTableMockData from '@/components/mock/DietTableMockData';
import { useState } from 'react';
import Sidebar from '@/components/fixedBars/sidebar';

export default function User() {
  const [selectedDate, setSelectedDate] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const handleDateInput = (formattedDate: any) => {
    setSelectedDate(formattedDate);
  };
  const handleSidebar = () => {
    console.log('sidebar');
    setIsOpen(isOpen);
  };

  return (
    <div className="bg-gray-100 dark:bg-blue-4 flex gap-[2rem]">
      <Sidebar onClick={handleSidebar} />

      <div className="pt-[2rem] lg:w-[75%]">
        <Title title="F45 을지로 C50 챌린지" />
        <div className="flex gap-[0.625rem]">
          <TotalFeedbackCounts
            counts={'10'}
            total={'30'}
            title={'진행현황'}
            borderColor="border-green"
          />
          <TotalFeedbackCounts
            counts={'10'}
            total={'30'}
            title={'오늘 운동 업로드 멤버'}
            borderColor="border-blue-5"
          />
          <TotalFeedbackCounts
            counts={'10'}
            total={'30'}
            title={'오늘 식단 업로드 멤버'}
            borderColor="border-yellow"
          />
          <TotalFeedbackCounts
            counts={'10'}
            total={'30'}
            title={'전체 운동 업로드 수'}
            borderColor="border-blue-5"
          />
          <TotalFeedbackCounts
            counts={'10'}
            total={'30'}
            title={'전체 식단 업로드 수'}
            borderColor="border-yellow"
          />
        </div>
        {/* <Stats /> */}
        <div className="dark:bg-blue-4  grid grid-cols-3 gap-[1rem] my-6">
          <TrafficSourceChart />
          <DailyDietRecord />
          <WorkoutLeaderboeard />
          <SalesChart />
        </div>
        <div className="dark:bg-blue-4  flex-1 p-6 bg-gray-100 pt-[7rem] bg-white-1">
          <div className=" flex justify-between items-center mt-[1.5rem]">
            <DateInput onChange={handleDateInput} selectedDate="2025-01-19" />
            <SearchInput />
          </div>
          <DietTable data={DietTableMockData} />
        </div>
      </div>
    </div>
  );
}
