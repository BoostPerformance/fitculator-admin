import React from 'react';

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
      weeklyActivity: [0, 0, 1, 0, 1, 0, 0],
      progress: 43,
    },
    {
      name: '은지',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 1, 0, 1, 0, 0],
      progress: 67,
    },
    {
      name: '에쉬',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 1, 0, 1, 0, 0],
      progress: 67,
    },
    {
      name: '현지',
      totalScore: '30/45',
      weeklyActivity: [0, 0, 1, 0, 1, 0, 0],
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
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-6">일별 신단 기록 현황</h2>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-4">
            {/* Profile Image */}
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />

            {/* Name */}
            <span className="w-12 text-sm">{activity.name}</span>

            {/* Weekly Activity Grid */}
            <div className="flex gap-1">
              {activity.weeklyActivity.map((day, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 border rounded ${
                    day ? 'bg-yellow-400 border-yellow-500' : 'border-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full"
                style={{ width: `${activity.progress}%` }}
              />
            </div>

            {/* Total Score */}
            <span className="text-sm text-gray-600 w-16">
              {activity.totalScore}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 justify-end text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-gray-200 rounded" />
          <span>완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 border border-yellow-500 rounded" />
          <span>성공도</span>
        </div>
      </div>
    </div>
  );
};

export default DailyDietRecord;
