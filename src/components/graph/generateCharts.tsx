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
      <div className="h-48 sm:h-64 w-full flex items-center justify-center text-gray-400 text-sm">
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

  const distributedStrengthCounts = dailyWorkouts.map((day) => {
    return day.hasStrength ? 1 : 0;
  });

  return (
    <div className="relative h-48 sm:h-64 w-full">
      {/* Y축 눈금 */}
      <div className="absolute left-0 h-[90%] flex flex-col justify-between text-gray-500 text-[10px] sm:text-xs">
        <div>100</div>
        <div>50</div>
        <div>0</div>
      </div>

      {/* 바 차트 */}
      <div className="absolute left-6 sm:left-8 right-0 h-[90%] flex items-end justify-between">
        {dailyWorkouts.map((day, index) => {
          const barHeight = (day.value / maxValue) * 100;

          return (
            <div
              key={index}
              className="flex flex-col items-center h-full relative group"
            >
              <div className="flex flex-col items-center w-6 sm:w-10 h-full justify-end relative">
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
                      className="absolute bottom-full mb-1 flex flex-col items-center gap-1 pl-2 sm:pl-3"
                      style={{
                        transform: `translateY(-${
                          (day.value / maxValue) * 100
                        }%)`,
                      }}
                    >
                      {Array.from({
                        length: distributedStrengthCounts[index],
                      }).map((_, i) => (
                        <div key={i} className="w-4 h-4 sm:w-5 sm:h-5">
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
                  {/* 툴크 - bar 바깥으로 빼기 */}
                  <div className="absolute bottom-0 mb-2 px-[0.3rem] sm:px-[0.5rem] py-[0.1rem] text-[10px] sm:text-0.625-500 text-white bg-black rounded opacity-0 group-hover:opacity-50 transition-opacity z-10">
                    {typeof day.value === 'number'
                      ? day.value.toFixed(1)
                      : '0.0'}
                    p
                  </div>
                </div>
              </div>

              {/* 요일 */}
              <div className="text-[10px] sm:text-xs text-gray-500 mt-2 absolute -bottom-6 left-0 right-0 text-center">
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
  const strokeWidth = 30;
  const textRadius = 30; // 텍스트를 위한 반지름 (더 바깥으로)
  const total = Object.values(workoutTypes).reduce((sum, v) => sum + v, 0);

  if ((total === 0 && totalPoints === 0) || showAsEmpty) {
    return (
      <div className="relative w-full flex flex-col items-center justify-center py-4 sm:py-8 text-gray-400 text-xs sm:text-sm">
        <svg className="w-48 h-48 sm:w-56 sm:h-56" viewBox="0 0 100 100">
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
        <p className="mt-2 sm:mt-4">운동 기록이 등록되면 여기에 표시됩니다.</p>
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
    배드민턴: '#E91E63',
    복싱: '#FF5722',
    요가: '#9C27B0',
    필라테스: '#673AB7',
    골프: '#8BC34A',
    클라이밍: '#795548',
    스키: '#2196F3',
    스노보드: '#00BCD4',
    농구: '#FF9800',
    축구: '#4CAF50',
    야구: '#F44336',
    배구: '#3F51B5',
    탁구: '#FFEB3B',
    볼링: '#9E9E9E',
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

  // workoutTypes가 비어있지만 totalPoints가 있는 경우 기본 처리
  let processedWorkoutTypes = workoutTypes;
  if (total === 0 && totalPoints > 0) {
    processedWorkoutTypes = { '운동': totalPoints };
  }

  // 운동별 포인트 합산 (같은 운동이 여러 개 있으면 합치기)
  const consolidatedWorkoutTypes: WorkoutTypes = {};
  Object.entries(processedWorkoutTypes).forEach(([type, points]) => {
    if (consolidatedWorkoutTypes[type]) {
      consolidatedWorkoutTypes[type] += points;
    } else {
      consolidatedWorkoutTypes[type] = points;
    }
  });

  // 100% 이상일 때 정규화
  const actualTotal = Object.values(consolidatedWorkoutTypes).reduce((sum, v) => sum + v, 0);
  let normalizedWorkoutTypes: WorkoutTypes = {};
  
  if (actualTotal > 100) {
    // 100% 이상이면 각 운동의 비율을 100% 기준으로 정규화
    Object.entries(consolidatedWorkoutTypes).forEach(([type, points]) => {
      normalizedWorkoutTypes[type] = (points / actualTotal) * 100;
    });
  } else {
    normalizedWorkoutTypes = { ...consolidatedWorkoutTypes };
  }

  // 포인트가 높은 순으로 정렬
  const sortedWorkoutTypes = Object.entries(normalizedWorkoutTypes)
    .filter(([, points]) => points > 0)
    .sort(([,a], [,b]) => b - a);

  // 정규화된 총합 (100 또는 실제 총합 중 작은 값)
  const displayTotal = Math.min(actualTotal, 100);

  let currentAngle = -90;
  const segmentInfo = sortedWorkoutTypes.map(([type, points], i) => {
    // 정규화된 포인트 기준으로 각도 계산
    const sweepAngle = (points / 100) * 360;
    
    let path;
    if (sweepAngle >= 360) {
      // 전체 원을 그릴 때는 circle로 그리기
      path = `M ${center - radius} ${center} A ${radius} ${radius} 0 1 1 ${center + radius} ${center} A ${radius} ${radius} 0 1 1 ${center - radius} ${center}`;
    } else {
      path = describeArc(currentAngle, currentAngle + sweepAngle);
    }
    
    // 텍스트 위치 계산 (호의 중앙)
    const textAngle = currentAngle + (sweepAngle / 2);
    const textX = center + textRadius * Math.cos((textAngle * Math.PI) / 180);
    const textY = center + textRadius * Math.sin((textAngle * Math.PI) / 180);
    
    const color = colors[type] || `hsl(${(i * 137.508) % 360}, 70%, 60%)`; // 동적 색상 생성
    const segment = {
      type,
      points: consolidatedWorkoutTypes[type], // 실제 포인트 값 사용
      normalizedPoints: points, // 정규화된 포인트
      percentage: points,
      path,
      color,
      textX,
      textY,
      textAngle,
      sweepAngle
    };
    currentAngle += sweepAngle;
    return segment;
  });

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-center">
        <svg className="w-48 h-48 sm:w-56 sm:h-56" viewBox="0 0 100 100">
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
            <g key={index}>
              <path
                d={segment.path}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
              {/* 각 세그먼트에 텍스트 추가 (충분히 큰 영역에만) */}
              {segment.sweepAngle > 25 && (
                <g>
                  <text
                    x={segment.textX}
                    y={segment.textY - 2.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="6"
                    fontWeight="bold"
                    fill="black"
                    stroke="white"
                    strokeWidth="0.05"
                  >
                    {segment.type}
                  </text>
                  <text
                    x={segment.textX}
                    y={segment.textY + 3.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="5"
                    fontWeight="bold"
                    fill="black"
                    stroke="white"
                    strokeWidth="0.05"
                  >
                    {segment.points.toFixed(1)}p
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* 중앙 텍스트 */}
          <text
            x="50"
            y="44"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="6"
            fill="#6B7280"
          >
            유산소
          </text>
          <text
            x="50"
            y="54"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#374151"
          >
            {actualTotal.toFixed(1)}
            <tspan fontSize="7">%</tspan>
          </text>
        </svg>
      </div>
    </div>
  );
};

export { generateBarChart, generateDonutChart };
