import React from 'react';
import Image from 'next/image';

interface LeaderboardItemProps {
  rank: number;
  name: string;
  score: string;
}

const WorkoutLeaderboardItem = ({
  rank,
  name,
  score,
}: LeaderboardItemProps) => {
  const scoreValue = parseFloat(score.replace(/[^0-9.]/g, ''));

  // 1000을 기준으로 퍼센트 계산
  const progressWidth = (scoreValue / 1000) * 100;

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-6">{rank}</div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <span>{name}</span>
      </div>

      <div className="flex-1 relative">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-pink-300 rounded-full"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <Image
          src="/svg/fire.svg"
          width={20}
          height={20}
          alt="fire"
          className="absolute -right-2 -top-2"
        />
      </div>

      <div className="w-20 text-right">{score}</div>
    </div>
  );
};

export default WorkoutLeaderboardItem;
