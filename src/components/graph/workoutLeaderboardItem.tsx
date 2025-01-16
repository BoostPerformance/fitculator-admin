import React from 'react';

interface LeaderboardItemProps {
  rank: number;
  name: string;
  score: string;
}

const WorkoutLeaderboardItem = ({
  rank,
  name,
  score,
}: LeaderboardItemProps) => (
  <div className="flex items-center gap-4 mb-3">
    <span className="text-gray-600 w-4">{rank}</span>
    <div className="w-8 h-8 rounded-full bg-gray-200" />
    <span className="text-sm w-12">{name}</span>
    <div className="flex-1 relative h-2 bg-gray-100 rounded-full">
      <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-pink-500 to-pink-300 rounded-full" />
    </div>
    <div className="flex items-center gap-1">
      <svg
        className="w-4 h-4 text-pink-500"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" />
      </svg>
      <span className="text-sm text-gray-600">{score}</span>
    </div>
  </div>
);

export default WorkoutLeaderboardItem;
