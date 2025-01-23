'use client';
import { useEffect, useState } from 'react';
//import Stats from '@/components/graph/stats';
import SalesChart from '@/components/graph/salesChart';
import TrafficSourceChart from '@/components/graph/trafficSourceChart';
import DailyDietRecord from '@/components/graph/dailyDietRecord';
import WorkoutLeaderboeard from '@/components/graph/workoutLeaderboeard';
//import DietTable from '@/components/dietDashboard/dietTable';
import DateInput from '@/components/input/dateInput';
import SearchInput from '@/components/input/searchInput';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import Title from '@/components/layout/title';
import Sidebar from '@/components/fixedBars/sidebar';

// interface DietTableItem {
//   display_name: string;
//   name: string;
//   meals: number[];
//   coach_memo?: string;
//   feedback_counts: number;
// }

export default function User() {
  const [selectedDate, setSelectedDate] = useState<string>('2025-01-13');
  const [isOpen, setIsOpen] = useState(false);
  const [organizationName, SetOrganizationName] = useState('');
  //const [dietData, setDietData] = useState<DietTableItem[]>([]);
  // const [nameData, setNameData] = useState([]);

  // const fetchDietData = async () => {
  //   try {
  //     const response = await fetch(`/api/diet-table`);

  //     const data = await response.json();
  //     console.log(data);
  //     if (data) {
  //       console.log(data);
  //       setDietData(data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching diet data:', error);
  //   }
  // };
  const fetchCoachData = async () => {
    try {
      const response = await fetch('/api/coach-info');
      const data = await response.json();
      console.log(data);

      return SetOrganizationName(data);
    } catch (error) {
      console.error('failed!!!', error);
    }
  };
  useEffect(() => {
    fetchCoachData();
  }, []);

  const handleDateInput = (formattedDate: string) => {
    setSelectedDate(formattedDate);
    console.log(selectedDate);
  };

  const handleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-gray-100 dark:bg-blue-4 flex gap-[1rem] pr-[1rem] h-screen overflow-hidden">
      <Sidebar onClick={handleSidebar} />
      <div className="flex-1 overflow-auto">
        <div className="pt-[2rem]">
          <Title title={organizationName} />
          <div className="flex gap-[0.625rem] overflow-x-auto">
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

          <div className="dark:bg-blue-4 grid grid-cols-3 gap-[1rem] my-6">
            <TrafficSourceChart />
            <DailyDietRecord />
            <WorkoutLeaderboeard />
            <SalesChart />
          </div>
          <div className="dark:bg-blue-4 flex-1 p-6 bg-gray-100 pt-[7rem] bg-white-1">
            <div className="flex justify-between items-center mt-[1.5rem]">
              <DateInput onChange={handleDateInput} selectedDate="2025-01-19" />
              <SearchInput />
            </div>
            {/* <DietTable data={dietData} /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
