import WorkoutLeaderboardItem from './workoutLeaderboardItem';

const WorkoutLeaderboeard = () => {
  const leaderboardData = [
    { rank: 1, name: '하은', score: 100.1 },
    { rank: 2, name: '설희', score: 38.6 },
    { rank: 3, name: '건호', score: 33.3 },
    { rank: 4, name: '채린', score: 28 },
    { rank: 5, name: '수경', score: 27.9 },
    { rank: 6, name: '종원', score: 26.7 },
    { rank: 7, name: '성훈', score: 24.7 },
    { rank: 8, name: 'suyeon', score: 20 },
    { rank: 8, name: 'Ahyun', score: 20 },
    { rank: 9, name: 'Hyeonwoo', score: 17.8 },
    { rank: 10, name: 'Mārtiņš', score: 10 },
    { rank: 11, name: '지니', score: 10 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-8 col-span-2">
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
