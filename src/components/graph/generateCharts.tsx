import { DailyWorkout } from '@/types/workoutDetailPageType';
import Image from 'next/image';
import { WorkoutTypes } from '@/types/useWorkoutDataTypes';

const generateBarChart = (
  dailyWorkouts: DailyWorkout[],
  totalStrength: number,
  showAsEmpty = false
): JSX.Element => {
  if (dailyWorkouts.length === 0 || showAsEmpty) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-400 text-sm">
        운동 기록이 등록되면 여기에 표시됩니다.
      </div>
    );
  }

  const maxValue = 100;
  const statusColors: Record<string, string> = {
    complete: 'bg-[#26CBFF]',
    incomplete: 'bg-[#FF1469]',
    rest: 'bg-gray-300',
  };

  const distributedStrengthCounts = dailyWorkouts.map((_, index) => {
    return index < totalStrength ? 1 : 0;
  });

  return (
    <div className="relative h-64 w-full">
      {/* Y축 눈금 */}
      <div className="absolute left-0 h-[90%] flex flex-col justify-between text-gray-500 text-xs">
        <div>100</div>
        <div>50</div>
        <div>0</div>
      </div>

      {/* 바 차트 */}
      <div className="absolute left-8 right-0 h-[90%] flex items-end justify-between">
        {dailyWorkouts.map((day, index) => {
          const barHeight = (day.value / maxValue) * 100;

          return (
            <div
              key={index}
              className="flex flex-col items-center h-full relative group"
            >
              <div className="flex flex-col items-center w-10 h-full justify-end relative">
                {/* bar 자체 */}
                <div
                  className={`relative w-full sm:w-[2rem] ${
                    statusColors[day.status] || 'bg-gray-300'
                  }`}
                  style={{
                    height: `${barHeight}%`,
                    minHeight: '2px',
                    borderRadius: '4px 4px 0 0',
                  }}
                >
                  {/* 덤벨 - bar 위에 띄우기 */}
                  {distributedStrengthCounts[index] > 0 && (
                    <div
                      className="absolute bottom-full mb-1 flex flex-col items-center gap-1 pl-3 sm:pl-2"
                      style={{
                        transform: `translateY(-${
                          (day.value / maxValue) * 100
                        }%)`,
                      }}
                    >
                      {Array.from({
                        length: distributedStrengthCounts[index],
                      }).map((_, i) => (
                        <div key={i} className="w-5 h-5">
                          <Image
                            src="/svg/dumbell.svg"
                            width={20}
                            height={20}
                            alt="근력운동"
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 툴팁 - bar 바깥으로 빼기 */}
                  <div className="absolute bottom-0 mb-2 px-[0.5rem] py-[0.1rem] text-0.625-500 text-white bg-black rounded opacity-0 group-hover:opacity-50 transition-opacity z-10">
                    {typeof day.value === 'number'
                      ? day.value.toFixed(1)
                      : '0.0'}
                    p
                  </div>
                </div>
              </div>

              {/* 요일 */}
              <div className="text-xs text-gray-500 mt-2 absolute -bottom-6 left-0 right-0 text-center">
                {day.day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const generateDonutChart = (
  workoutTypes: WorkoutTypes,
  showAsEmpty = false,
  totalPoints: number
) => {
  const radius = 35;
  const center = 50;
  const strokeWidth = 23;
  const safeTotalPoints = Math.min(totalPoints, 100); // 최대 100%
  const total = Object.values(workoutTypes).reduce((sum, v) => sum + v, 0);

  if (total === 0 || showAsEmpty || totalPoints === 0) {
    return (
      <div className="relative w-full flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
        <svg className="w-45 h-45" viewBox="0 0 100 100">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="bold"
          >
            0%
          </text>
        </svg>
        <p className="mt-4">운동 기록이 등록되면 여기에 표시됩니다.</p>
      </div>
    );
  }

  const colors: Record<string, string> = {
    달리기: '#80FBD0',
    HIIT: '#26CBFF',
    테니스: '#4CAF50',
    등산: '#795548',
    사이클: '#FF9800',
    수영: '#03A9F4',
    크로스핏: '#9C27B0',
    걷기: '#7BA5FF',
    기타: '#607D8F',
  };

  const toRadians = (degree: number) => (degree * Math.PI) / 180;

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = {
      x: center + radius * Math.cos(toRadians(startAngle)),
      y: center + radius * Math.sin(toRadians(startAngle)),
    };
    const end = {
      x: center + radius * Math.cos(toRadians(endAngle)),
      y: center + radius * Math.sin(toRadians(endAngle)),
    };

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    ].join(' ');
  };

  let currentAngle = -90;
  const segmentInfo = Object.entries(workoutTypes).map(([type, value], i) => {
    const ratio = value / total;
    const sweepAngle = ratio * 360 * (safeTotalPoints / 100); // 100% 기준 내에서만 표시
    const path = describeArc(currentAngle, currentAngle + sweepAngle);
    const color = colors[type] || `hsl(${i * 60}, 70%, 60%)`;
    const segment = {
      type,
      percentage: ratio * 100,
      path,
      color,
    };
    currentAngle += sweepAngle;
    return segment;
  });

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-center">
        <svg className="w-45 h-45" viewBox="0 0 100 100">
          {/* 배경 원 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />

          {/* 세그먼트 arc */}
          {segmentInfo.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill="transparent"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          ))}

          {/* 중앙 텍스트 */}
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="bold"
          >
            {totalPoints.toFixed(1)}%
          </text>
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap justify-around text-xs mt-2">
        {segmentInfo.map((segment, index) => (
          <div key={index} className="flex items-center my-1">
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: segment.color }}
            ></div>
            <div>
              {segment.type}
              <br />
              {segment.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { generateBarChart, generateDonutChart };
