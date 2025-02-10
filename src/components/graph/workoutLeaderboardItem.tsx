import React from 'react';
import Image from 'next/image';

interface LeaderboardItemProps {
  rank: number;
  name: string;
  score: number;
}

const WorkoutLeaderboardItem = ({
  rank,
  name,
  score,
}: LeaderboardItemProps) => {
  // const scoreValue = parseFloat(score.replace(/[^0-9.]/g, ''));

  // 1000을 기준으로 퍼센트 계산
  const progressWidth = (score / 100) * 100;

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-6">{rank}</div>
      <div className="flex items-center gap-2">
        <span>{name}</span>
      </div>

      <div className="flex-1 relative">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${
              score > 100
                ? 'from-pink-500 to-pink-300'
                : 'from-blue-400 to-blue-200'
            }  rounded-full`}
            style={{ width: `${progressWidth}%` }}
          />
          {score > 100 && (
            <Image
              src="/svg/fire.svg"
              width={20}
              height={20}
              alt="fire"
              className="absolute -right-2 -top-2"
              style={{
                left: `calc(${progressWidth}% - 10px)`,
                position: 'absolute',
              }}
            />
          )}
        </div>
      </div>

      <div className="w-20 text-right">{score}</div>
    </div>
  );
};

export default WorkoutLeaderboardItem;
