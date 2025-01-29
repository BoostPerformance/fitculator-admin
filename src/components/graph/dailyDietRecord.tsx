import React from 'react';
import Image from 'next/image';
const days = ['월', '화', '수', '목', '금', '토', '일'];

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
    <div className="bg-white sm:p-6 rounded-lg p-3 lg:py-[1.7rem]">
      <h2 className="text-xl font-medium mb-6 text-[#6F6F6F]">
        일별 식단 기록 현황
      </h2>

      <div className="sm:space-y-4 lg:space-y-6">
        {/* Days of week header */}
        <div className="flex items-center sm:pl-[4rem] pl-[3.2rem]">
          <div className="flex sm:gap-[0.5rem] gap-[0.6rem]">
            {days.map((day, idx) => (
              <div key={idx} className="w-6 text-center text-gray-500">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Activity rows */}
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center">
            <div className="sm:w-[4rem] w-[2.4rem]">
              <span className="text-gray-700">{activity.name}</span>
            </div>

            <div className="flex items-center">
              <div className="flex gap-2 mr-4">
                {activity.weeklyActivity.map((isActive, idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded flex items-center justify-center
                      ${isActive ? 'bg-orange-400' : 'bg-gray-100'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center p-1">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-full h-full text-white"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-gray-600">23일</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyDietRecord;
