import React from 'react';
import Image from 'next/image';
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const DailyDietRecord = () => {
  const activities = [
    {
      name: '다희',
      totalScore: '23/23',
      weeklyActivity: [0, 0, 1, 0, 1, 0, 0],
      progress: 100,
    },
    {
      name: '희주',
      totalScore: '10/23',
      weeklyActivity: [0, 0, 1, 1, 1, 0, 0],
      progress: 43,
    },
    {
      name: '은지',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 0, 0, 1, 1, 0],
      progress: 67,
    },
    {
      name: '에쉬',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 1, 1, 1, 1, 0],
      progress: 67,
    },
    {
      name: '현지',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 1, 0, 1, 0, 1],
      progress: 67,
    },
    {
      name: '영진',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 1, 0, 1, 0, 0],
      progress: 67,
    },
    {
      name: '소희',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 1, 0, 1, 0, 0],
      progress: 67,
    },
    {
      name: '민재',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 1, 0, 1, 0, 0],
      progress: 67,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg dark:bg-gray-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold  text-gray-5 px-3 py-1 rounded">
          일별 식단 기록 현황
        </h2>
      </div>

      <div className="space-y-6 ">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-4 flex-col w-full ">
            <div className="flex items-center lg:gap-[2rem] sm:gap-[4rem] justify-between">
              {/* Profile and Name */}
              <div className="flex items-center gap-2 w-20">
                <Image
                  width={20}
                  height={30}
                  src="/image/logo-icon.png"
                  alt={activity.name}
                  className="w-[1rem] h-[1rem] rounded-full bg-gray-200"
                />
                <span className="text-sm">{activity.name}</span>
              </div>

              {/* Weekly Activity Boxes */}

              <div className="flex gap-[0.5rem] ">
                {activity.weeklyActivity.map((isActive, idx) => (
                  <div
                    key={idx}
                    className={`w-[1.5rem] h-[1.5rem] rounded flex items-center justify-center
                    ${
                      isActive
                        ? 'text-gray-1'
                        : idx === 5
                        ? ' text-white'
                        : idx === 6
                        ? 'text-white bg-[#FF979D]'
                        : 'text-gray-1'
                    }
                    ${
                      isActive
                        ? 'bg-orange-400 text-white'
                        : idx === 5
                        ? 'border-[0.1rem] border-[#FF979D] text-[#FF979D] '
                        : idx === 6
                        ? 'border-[0.1rem] border-[#FF979D] text-white bg-orange-400'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {days[idx]}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end w-full">
              <div className="flex items-center gap-2  sm:w-[13rem] w-full">
                <div className="flex-1 h-2 bg-gray-100 rounded-full">
                  <div
                    className="bg-orange-400 rounded-full border-[0.3rem] border-orange-400"
                    style={{ width: `${activity.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {activity.totalScore}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyDietRecord;
