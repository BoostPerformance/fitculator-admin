import WorkoutLeaderboardItem from './workoutLeaderboardItem';

const WorkoutLeaderboeard = () => {
  const leaderboardData = [
    { rank: 1, name: '은지', score: '979.2pt' },
    { rank: 2, name: '희주', score: '879.2pt' },
    { rank: 3, name: '민희', score: '779.2pt' },
    { rank: 4, name: '다희', score: '679.2pt' },
    { rank: 5, name: '민재', score: '579.2pt' },
    { rank: 6, name: '영진', score: '479.2pt' },
    { rank: 7, name: '현지', score: '379.2pt' },
    { rank: 8, name: '유준', score: '279.2pt' },
    { rank: 9, name: '주형', score: '179.2pt' },
    { rank: 10, name: '희영', score: '99.2pt' },
    { rank: 11, name: '대희', score: '79.2pt' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-8">
      <h2 className="text-[#6F6F6F] text-lg font-semibold mb-6 dark:text-gray-5">
        운동리더보드
      </h2>
      <div className="overflow-y-auto max-h-96 dark:text-gray-5">
        {leaderboardData.map((item, index) => (
          <WorkoutLeaderboardItem
            key={index}
            rank={item.rank}
            name={item.name}
            score={item.score}
          />
        ))}
      </div>
    </div>
  );
};

export default WorkoutLeaderboeard;
