'use client';
import Stats from '@/components/graph/stats';
import SalesChart from '@/components/graph/salesChart';
import TrafficSourceChart from '@/components/graph/trafficSourceChart';
//import TopReferrals from '@/components/graph/topReferrals';
//import LatestProjects from '@/components/graph/latestProjects';
import DailyDietRecord from '@/components/graph/dailyDietRecord';
//import FixedBars from '@/components/fixedBars/fixedBars';
import WorkoutLeaderboeard from '@/components/graph/workoutLeaderboeard';
import DietContainer from '@/components/dietDashboard/dietContainer';
import TotalCounts from '@/components/totalCounts/totalCounts';
export default function User() {
  return (
    <div className="flex">
      <div>
        <TotalCounts counts={'10'} />
      </div>
      <div className="flex-1 p-6 bg-gray-100 pt-[7rem]">
        <Stats />
        <div className="grid grid-cols-3 gap-[1rem] my-6">
          <TrafficSourceChart />
          <DailyDietRecord />
          <WorkoutLeaderboeard />
          <SalesChart />
        </div>
        <div>
          <DietContainer />
        </div>
      </div>
    </div>
  );
}
