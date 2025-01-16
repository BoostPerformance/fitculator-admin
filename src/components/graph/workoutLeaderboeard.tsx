import WorkoutLeaderboardItem from './workoutLeaderboardItem';

const WorkoutLeaderboeard = () => {
  const leaderboardData = [
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
    { rank: 1, name: '대화', score: '479.2pt' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-6">운동리더보드</h2>
      <div className="overflow-y-auto max-h-96">
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
