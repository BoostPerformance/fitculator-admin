import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { logger, handleApiError } from '@/utils/logger';

// 타입 정의
interface WeeklyWorkoutChartProps {
  data?: any; // useWorkoutDataQuery에서 받은 weeklyChart 데이터
  isLoading?: boolean;
  error?: any;
}

interface User {
  id: string;
  name: string;
  username?: string;
}

interface ChartDataPoint {
  x: string; // 주차 레이블 (예: "02.10-02.16")
  y: number; // 운동량 값
  user: string; // 사용자 이름
  userId: string; // 사용자 ID
  weekNumber: string; // W0, W1, W2...
  position?: number; // 주 내에서의 상대적 위치 (0.0-1.0)
}

// 요일 레이블 정의
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 주간 운동 차트 컴포넌트
const WeeklyWorkoutChart: React.FC<WeeklyWorkoutChartProps> = ({
  data,
  isLoading = false,
  error,
}) => {
  const [cardioData, setCardioData] = useState<ChartDataPoint[]>([]);
  const [strengthData, setStrengthData] = useState<ChartDataPoint[]>([]);
  const [weeklyCardioData, setWeeklyCardioData] = useState<ChartDataPoint[]>([]);
  const [weeklyStrengthData, setWeeklyStrengthData] = useState<ChartDataPoint[]>([]);
  const [userColors, setUserColors] = useState<Record<string, string>>({});
  // 로딩과 에러 상태는 props로 받음
  const [weekLabels, setWeekLabels] = useState<string[]>([]);

  // 색상 팔레트 정의
  const colors = [
    '#FF6B6B', '#FF5252', '#FF7F7F', '#6B66FF', '#5151FF', '#8A85FF',
    '#66D7FF', '#33CCFF', '#99E2FF', '#66FF8D', '#33FF66', '#99FFB3',
    '#FFD166', '#FFCC33', '#FFDB99', '#FF66D4', '#FF33CC', '#FF99E0',
    '#66FFE3', '#33FFDD', '#99FFEC', '#ADFF66', '#99FF33', '#C6FF99',
    '#FF9866', '#FF8033', '#FFB399', '#C466FF', '#B233FF', '#D699FF',
  ];

  // 사용자별 일관된 색상 할당
  const getUserColor = (userName: string, index: number): string => {
    if (!userName) return colors[index % colors.length];

    const hash = userName
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length] || colors[index % colors.length];
  };

  // 개별 데이터 포인트를 주간 누적 데이터로 집계하는 함수
  const aggregateWeeklyData = (data: ChartDataPoint[]): ChartDataPoint[] => {
    if (!data || data.length === 0) return [];

    // 주차별, 사용자별 데이터 그룹화
    const weeklyUserTotals: Record<
      string,
      Record<string, { total: number; userId: string }>
    > = {};

    data.forEach((item) => {
      const week = item.x;
      const user = item.user;
      const userId = item.userId;
      const value = item.y;

      if (!weeklyUserTotals[week]) {
        weeklyUserTotals[week] = {};
      }

      if (!weeklyUserTotals[week][user]) {
        weeklyUserTotals[week][user] = { total: 0, userId };
      }

      weeklyUserTotals[week][user].total += value;
    });

    // 주차별, 사용자별 누적 데이터 생성 (jitter 효과 적용)
    const aggregatedData: ChartDataPoint[] = [];

    Object.entries(weeklyUserTotals).forEach(([week, users]) => {
      Object.entries(users).forEach(([userName, userData], index) => {
        // jitter 효과: 주 안에서 사용자별 고정된 위치 설정
        const nameSeed = userName
          .split('')
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // pseudorandom 위치 생성 (사용자 이름 기반)
        const pseudoRandom = ((nameSeed * 9301 + 49297) % 233280) / 233280;
        const position = 0.2 + pseudoRandom * 0.6; // 0.2~0.8 사이로 제한

        aggregatedData.push({
          x: week,
          y: userData.total,
          user: userName,
          userId: userData.userId,
          weekNumber: week,
          position: position,
        });
      });
    });

    return aggregatedData;
  };

  // X축 변환 함수 - 주차와 날짜 정보를 조합하여 X 좌표 생성
  const xAxisCalculator = (data: ChartDataPoint) => {
    // 주 인덱스 찾기
    const weekIndex = weekLabels.findIndex((label) => label === data.x);
    if (weekIndex === -1) return 0;

    // position 값이 있으면 사용
    if (data.position !== undefined) {
      return weekIndex + data.position;
    }

    // 모든 정보가 없으면 주 가운데에 배치
    return weekIndex + 0.5;
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-xs">
          <p className="text-gray-700">{`${data.user}: ${data.y.toFixed(1)}`}</p>
        </div>
      );
    }
    return null;
  };

  // 데이터 처리
  useEffect(() => {
    if (!data) {
      return;
    }

    try {
      if (!data.weeks || !data.cardioData || !data.strengthData) {
        logger.warn('WeeklyWorkoutChart: 데이터 형식이 올바르지 않습니다');
        return;
      }

      // 주차 레이블 설정
      const weekLabels = data.weeks.map((week: any) => week.weekLabel);
      setWeekLabels(weekLabels);

      // 사용자별 색상 매핑
      const colorMapping: Record<string, string> = {};
      if (data.users && Array.isArray(data.users)) {
        data.users.forEach((user: User, index: number) => {
          if (user && user.name) {
            colorMapping[user.name] = getUserColor(user.name, index);
          }
        });
        setUserColors(colorMapping);
      }

      // 유산소 운동 데이터 변환
      const cardioPoints = data.cardioData.map((item: any) => ({
        x: item.weekLabel,
        y: item.points || 0,
        user: item.user,
        userId: item.userId,
        weekNumber: item.weekNumber,
      }));

      // 근력 운동 데이터 변환 (세션 수만큼 개별 포인트 생성)
      const strengthPoints: ChartDataPoint[] = [];
      data.strengthData.forEach((item: any) => {
        const sessions = item.sessions || 0;
        for (let i = 0; i < sessions; i++) {
          strengthPoints.push({
            x: item.weekLabel,
            y: 1,
            user: item.user,
            userId: item.userId,
            weekNumber: item.weekNumber,
          });
        }
      });

      setCardioData(cardioPoints);
      setStrengthData(strengthPoints);

      // 주간 누적 데이터 계산
      setWeeklyCardioData(aggregateWeeklyData(cardioPoints));
      setWeeklyStrengthData(aggregateWeeklyData(strengthPoints));

      logger.data('WeeklyWorkoutChart 데이터 처리 완료:', {
        weeks: weekLabels.length,
        cardio: cardioPoints.length,
        strength: strengthPoints.length
      });

    } catch (err) {
      logger.error('WeeklyWorkoutChart 데이터 처리 오류:', err);
    }
  }, [data]);

  // 차트에 표시될 사용자별 산점도 생성
  const renderScatters = (data: ChartDataPoint[]) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const userGroups: Record<string, ChartDataPoint[]> = {};

    // 사용자별로 데이터 그룹화
    data.forEach((item) => {
      if (!item || !item.user) return;

      if (!userGroups[item.user]) {
        userGroups[item.user] = [];
      }
      userGroups[item.user].push(item);
    });

    // 각 사용자별로 Scatter 컴포넌트 생성
    return Object.entries(userGroups).map(([user, userData]) => {
      const color = userColors[user] || getUserColor(user, 0);

      return (
        <Scatter
          key={user}
          name={user}
          data={userData}
          fill={color}
          shape="circle"
        />
      );
    });
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="col-span-6 sm:col-span-6 md:col-span-6 lg:col-span-6 bg-white p-4 md:p-6 shadow rounded-lg flex items-center justify-center h-40 md:h-64">
        <p className="text-gray-500 text-sm md:text-base">
          데이터를 불러오는 중...
        </p>
      </div>
    );
  }

  // 오류 표시
  if (error) {
    return (
      <div className="col-span-6 sm:col-span-6 md:col-span-6 lg:col-span-6 bg-white p-4 md:p-6 shadow rounded-lg flex flex-col items-center justify-center h-40 md:h-64">
        <p className="text-red-500 mb-2 md:mb-4 text-sm md:text-base">
          {error}
        </p>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="px-3 py-1 md:px-4 md:py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 주차 데이터가 없는 경우
  if (weekLabels.length === 0) {
    return (
      <div className="col-span-6 sm:col-span-6 md:col-span-6 lg:col-span-6 bg-white p-4 md:p-6 shadow rounded-lg flex items-center justify-center h-40 md:h-64">
        <p className="text-gray-500 text-sm md:text-base">
          주차 데이터를 생성할 수 없습니다.
        </p>
      </div>
    );
  }

  // 주차 데이터가 너무 많아 가로 스크롤이 필요한지 확인
  const needsHorizontalScroll = weekLabels.length > 3;

  // X축 도메인 계산 (마지막 주의 끝까지 표시)
  const xAxisDomain = [0, weekLabels.length - 1 + 1];

  return (
    <div className="col-span-6 sm:col-span-6 md:col-span-6 lg:col-span-6 space-y-4 md:space-y-6 ">
      {/* 유산소 운동 차트 */}
      <div className="bg-white p-4 shadow rounded-lg dark:bg-gray-8 overflow-hidden">
        <h2 className="text-lg font-semibold mb-4 dark:text-gray-5 text-[#6F6F6F] pt-3">
          주별 유산소 운동량
        </h2>
        <div className="overflow-x-auto pb-2">
          <div
            className="h-[250px] sm:h-[300px] md:h-[350px]"
            style={{
              width: `${Math.max(100, weekLabels.length * 150)}px`,
              minWidth: '100%',
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 10,
                  right: needsHorizontalScroll ? 30 : 10,
                  bottom: 20,
                  left: 10,
                  ...(typeof window !== 'undefined' && window.innerWidth >= 768
                    ? {
                        top: 20,
                        right: needsHorizontalScroll ? 40 : 20,
                        bottom: 20,
                        left: 20,
                      }
                    : {}),
                }}
              >
                <CartesianGrid
                  horizontal={true}
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  dataKey={(data) => xAxisCalculator(data)}
                  domain={xAxisDomain}
                  ticks={weekLabels.map((_, i) => i + 0.5)}
                  tickFormatter={(value) => {
                    const weekIndex = Math.floor(value);
                    if (typeof window !== 'undefined' && window.innerWidth < 640) {
                      const weekLabel = weekLabels[weekIndex] || '';
                      return weekLabel.split('-')[0] || '';
                    }
                    return weekLabels[weekIndex] || '';
                  }}
                  allowDecimals={true}
                  interval={0}
                  tick={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12 }}
                />
                <YAxis
                  dataKey="y"
                  name="운동량"
                  domain={[0, 'auto']}
                  tick={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* <Legend
                  wrapperStyle={{
                    fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12,
                    marginTop: typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : 10,
                  }}
                /> */}

                {/* 주간 구분선 (각 주의 시작) */}
                {weekLabels.map((_, i) => (
                  <ReferenceLine
                    key={`week-${i}`}
                    x={i}
                    stroke="#ccc"
                    strokeWidth={1}
                  />
                ))}

                {renderScatters(weeklyCardioData)}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 근력 운동 차트 */}
      <div className="bg-white p-4 shadow rounded-lg dark:bg-gray-8 overflow-hidden">
        <h2 className="text-lg font-semibold mb-4 dark:text-gray-5 text-[#6F6F6F] pt-3">
          주별 근력 운동량
        </h2>
        <div className="overflow-x-auto pb-2">
          <div
            className="h-[250px] sm:h-[300px] md:h-[350px]"
            style={{
              width: `${Math.max(100, weekLabels.length * 150)}px`,
              minWidth: '100%',
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 10,
                  right: needsHorizontalScroll ? 30 : 10,
                  bottom: 20,
                  left: 10,
                  ...(typeof window !== 'undefined' && window.innerWidth >= 768
                    ? {
                        top: 20,
                        right: needsHorizontalScroll ? 40 : 20,
                        bottom: 20,
                        left: 20,
                      }
                    : {}),
                }}
              >
                <CartesianGrid
                  horizontal={true}
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  dataKey={(data) => xAxisCalculator(data)}
                  domain={xAxisDomain}
                  ticks={weekLabels.map((_, i) => i + 0.5)}
                  tickFormatter={(value) => {
                    const weekIndex = Math.floor(value);
                    if (typeof window !== 'undefined' && window.innerWidth < 640) {
                      const weekLabel = weekLabels[weekIndex] || '';
                      return weekLabel.split('-')[0] || '';
                    }
                    return weekLabels[weekIndex] || '';
                  }}
                  allowDecimals={true}
                  interval={0}
                  tick={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12 }}
                />
                <YAxis
                  dataKey="y"
                  name="운동량"
                  domain={[0, 'auto']}
                  tick={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* <Legend
                  wrapperStyle={{
                    fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12,
                    marginTop: typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : 10,
                  }}
                /> */}

                {/* 주간 구분선 (각 주의 시작) */}
                {weekLabels.map((_, i) => (
                  <ReferenceLine
                    key={`week-${i}`}
                    x={i}
                    stroke="#ccc"
                    strokeWidth={1}
                  />
                ))}

                {renderScatters(weeklyStrengthData)}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyWorkoutChart;