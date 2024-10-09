'use client';
import Stats from '@/components/graph/stats';
import SalesChart from '@/components/graph/salesChart';
import TrafficSourceChart from '@/components/graph/trafficSourceChart';
import TopReferrals from '@/components/graph/topReferrals';
import LatestProjects from '@/components/graph/latestProjects';

import FixedBars from '@/components/userPage/fixedBars';

export default function User() {
  return (
    <div className="flex">
      <FixedBars />
      <div className="flex-1 p-6 bg-gray-100 pt-[7rem] pl-[15rem]">
        <Stats />
        <div className="grid grid-cols-2 gap-4 my-6">
          <SalesChart />
          <TrafficSourceChart />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TopReferrals />
          <LatestProjects />
        </div>
      </div>
    </div>
  );
}
