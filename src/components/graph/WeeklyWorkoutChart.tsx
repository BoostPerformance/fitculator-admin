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

// 타입 정의
interface WeeklyWorkoutChartProps {
  challengeId: string;
}

interface User {
  id: string;
  name: string;
}

interface ChartDataPoint {
  x: string; // 주차 레이블 (예: "02.10-02.16")
  y: number; // 운동량 값
  user: string; // 사용자 이름
  userId: string; // 사용자 ID
  dayOfMonth?: number; // 날짜 (1-31)
  position?: number; // 주 내에서의 상대적 위치 (0.0-1.0)
  timestamp?: string; // 타임스탬프 (ISO 형식)
}

// 요일 레이블 정의
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 주간 운동 차트 컴포넌트
const WeeklyWorkoutChart: React.FC<WeeklyWorkoutChartProps> = ({
  challengeId,
}) => {
  const [cardioData, setCardioData] = useState<ChartDataPoint[]>([]);
  const [strengthData, setStrengthData] = useState<ChartDataPoint[]>([]);
  const [weeklyCardioData, setWeeklyCardioData] = useState<ChartDataPoint[]>(
    []
  );
  const [weeklyStrengthData, setWeeklyStrengthData] = useState<
    ChartDataPoint[]
  >([]);
  const [userColors, setUserColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weekLabels, setWeekLabels] = useState<string[]>([]);

  // 색상 팔레트 정의
  const colors = [
    '#FF6B6B',
    '#FF5252',
    '#FF7F7F',
    '#6B66FF',
    '#5151FF',
    '#8A85FF',
    '#66D7FF',
    '#33CCFF',
    '#99E2FF',
    '#66FF8D',
    '#33FF66',
    '#99FFB3',
    '#FFD166',
    '#FFCC33',
    '#FFDB99',
    '#FF66D4',
    '#FF33CC',
    '#FF99E0',
    '#66FFE3',
    '#33FFDD',
    '#99FFEC',
    '#ADFF66',
    '#99FF33',
    '#C6FF99',
    '#FF9866',
    '#FF8033',
    '#FFB399',
    '#C466FF',
    '#B233FF',
    '#D699FF',
  ];

  // 사용자별 일관된 색상 할당
  const getUserColor = (userName: string, index: number): string => {
    if (!userName) return colors[index % colors.length];

    const hash = userName
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length] || colors[index % colors.length];
  };

  // 주차 범위 생성 함수
  const generateWeekRanges = (startDate: Date, endDate: Date) => {
    const weeks = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      let weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (weekEnd > endDate) {
        weekEnd = new Date(endDate);
      }

      const startMonth = (weekStart.getMonth() + 1).toString().padStart(2, '0');
      const startDay = weekStart.getDate().toString().padStart(2, '0');
      const endMonth = (weekEnd.getMonth() + 1).toString().padStart(2, '0');
      const endDay = weekEnd.getDate().toString().padStart(2, '0');

      const weekLabel = `${startMonth}.${startDay}-${endMonth}.${endDay}`;

      weeks.push({
        label: weekLabel,
        startDate: new Date(weekStart),
        endDate: new Date(weekEnd),
      });

      // 다음 주로 이동
      currentDate = new Date(weekEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeks;
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
      // 한 주 내에서 사용자 수에 따라 적절한 jitter 범위 결정
      const userCount = Object.keys(users).length;

      Object.entries(users).forEach(([userName, userData], index) => {
        // jitter 효과: 주 안에서 랜덤하게 위치 설정 (0.2~0.8 범위에서)
        // 같은 사용자는 항상 같은 패턴으로 배치되도록 사용자 이름에서 시드값 생성
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
          position: position, // jitter 효과 적용된 위치
        });
      });
    });

    return aggregatedData;
  };

  // 타임스탬프 정보를 기반으로 일자(day of month) 및 주 내 위치 계산
  const extractDateInfoFromData = (data: any[]) => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .map((item) => {
        if (!item) return item;

        try {
          // timestamp 정보가 있으면 실제 날짜 기반으로 처리
          if (item.timestamp) {
            const date = new Date(item.timestamp);
            const dayOfMonth = date.getDate();

            // 주 레이블에서 시작일과 종료일 추출 (예: "02.10-02.16")
            const parts = item.x.split('-');
            if (parts.length < 2) return item; // 잘못된 형식이면 원본 반환

            const startDayStr = parts[0].split('.')[1];
            const endDayStr = parts[1].split('.')[1];

            if (!startDayStr || !endDayStr) return item; // 잘못된 형식이면 원본 반환

            const startDay = parseInt(startDayStr);
            const endDay = parseInt(endDayStr);

            if (isNaN(startDay) || isNaN(endDay)) return item; // 숫자가 아니면 원본 반환

            // 주 내에서의 상대적 위치 계산 (0.0 ~ 1.0 사이 값)
            const daysInWeek = endDay - startDay + 1;
            const position = Math.max(
              0,
              Math.min(1, (dayOfMonth - startDay) / daysInWeek)
            );

            return {
              ...item,
              dayOfMonth,
              position,
            };
          }
        } catch (e) {
          console.error('날짜 정보 추출 중 오류:', e);
        }

        // timestamp 정보가 없거나 오류 발생 시 그대로 반환
        return item;
      })
      .filter(Boolean); // null/undefined 제거
  };

  // 챌린지 정보 가져오기
  const fetchChallengeInfo = async () => {
    try {
      const response = await fetch(`/api/challenges?id=${challengeId}`);

      if (!response.ok) {
        throw new Error('챌린지 정보를 가져오는데 실패했습니다');
      }

      const data = await response.json();

      // 응답이 배열인 경우 첫 번째 항목 사용
      const challengeInfo = Array.isArray(data) ? data[0] : data;
      if (
        !challengeInfo ||
        !challengeInfo.challenges.start_date ||
        !challengeInfo.challenges.end_date
      ) {
        throw new Error('챌린지 시작일과 종료일 정보가 없습니다');
      }

      return challengeInfo;
    } catch (error) {
      console.error('챌린지 정보 로딩 오류:', error);
      throw error;
    }
  };

  // X축 변환 함수 - 주차와 날짜 정보를 조합하여 X 좌표 생성
  const xAxisCalculator = (data: ChartDataPoint) => {
    // 주 인덱스 찾기
    const weekIndex = weekLabels.findIndex((label) => label === data.x);
    if (weekIndex === -1) return 0;

    // position 값이 있으면 (실제 날짜 기반) 사용
    if (data.position !== undefined) {
      return weekIndex + data.position;
    }

    // 일자 정보가 있으면 사용
    if (data.dayOfMonth !== undefined) {
      // 주 레이블에서 시작일 추출 (예: "02.10-02.16" => 10)
      const startDay = parseInt(data.x.split('-')[0].split('.')[1]);
      // 주 레이블에서 종료일 추출 (예: "02.10-02.16" => 16)
      const endDay = parseInt(data.x.split('-')[1].split('.')[1]);

      // 주 내에서의 상대적 위치 계산
      const daysInWeek = endDay - startDay + 1;
      return weekIndex + (data.dayOfMonth - startDay) / daysInWeek;
    }

    // 모든 정보가 없으면 주 가운데에 배치
    return weekIndex + 0.5;
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // 날짜 포맷 - MM.DD 형식
      const dateText = data.timestamp
        ? new Date(data.timestamp)
            .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
            .replace(/\. /g, '.')
            .replace(/\.$/, '')
        : data.dayOfMonth
        ? data.x.split('-')[0].split('.')[0] + '.' + data.dayOfMonth // 02.10-02.16 => 02.13
        : data.x; // 날짜 정보가 없으면 주차 표시

      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-xs">
          <p className="font-bold">{dateText}</p>
          <p className="text-gray-700">{`${data.user}: ${data.y.toFixed(
            1
          )}`}</p>
          {data.timestamp && (
            <p className="text-gray-500 text-xs">
              {new Date(data.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!challengeId) return;

      setLoading(true);
      setError(null);

      try {
        // 1. 챌린지 정보 가져오기
        const challengeInfo = await fetchChallengeInfo();

        // 2. 챌린지 기간에 맞는 모든 주차 생성
        let startDate, endDate;

        try {
          startDate = new Date(challengeInfo.challenges.start_date);
          endDate = new Date(challengeInfo.challenges.end_date);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('유효하지 않은 날짜 형식');
          }
        } catch (err) {
          console.error('날짜 파싱 오류:', err);
          throw new Error('챌린지 날짜를 파싱할 수 없습니다');
        }

        if (endDate < startDate) {
          console.warn('종료일이 시작일보다 빠름, 순서 교체');
          [startDate, endDate] = [endDate, startDate];
        }

        const allWeeks = generateWeekRanges(startDate, endDate);
        const allWeekLabels = allWeeks.map((week) => week.label);

        if (allWeekLabels.length === 0) {
          throw new Error('주차 데이터를 생성할 수 없습니다');
        }

        setWeekLabels(allWeekLabels);

        // 3. 운동 데이터 API 호출
        const workoutResponse = await fetch(
          `/api/workouts?type=weekly-chart&challengeId=${challengeId}`
        );

        if (!workoutResponse.ok) {
          throw new Error(`API 호출 실패 (${workoutResponse.status})`);
        }

        const workoutData = await workoutResponse.json();

        if (!workoutData) {
          throw new Error('API 응답 데이터가 없습니다');
        }

        // 4. 사용자별 색상 매핑
        const colorMapping: Record<string, string> = {};
        if (workoutData?.users && Array.isArray(workoutData.users)) {
          workoutData.users.forEach((user: User, index: number) => {
            if (user && user.name) {
              colorMapping[user.name] = getUserColor(user.name, index);
            }
          });
          setUserColors(colorMapping);
        }

        // 5. API 데이터에 날짜 정보 추가
        const cardioWithDates =
          workoutData?.cardio && Array.isArray(workoutData.cardio)
            ? extractDateInfoFromData(workoutData.cardio)
            : [];

        const strengthWithDates =
          workoutData?.strength && Array.isArray(workoutData.strength)
            ? extractDateInfoFromData(workoutData.strength)
            : [];

        setCardioData(cardioWithDates);
        setStrengthData(strengthWithDates);

        // 6. 주간 누적 데이터 계산
        setWeeklyCardioData(aggregateWeeklyData(cardioWithDates));
        setWeeklyStrengthData(aggregateWeeklyData(strengthWithDates));
      } catch (err) {
        console.error('데이터 로딩 오류:', err);
        setError(
          err instanceof Error
            ? err.message
            : '데이터를 불러오는 중 오류가 발생했습니다.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [challengeId]);

  // 차트에 표시될 사용자별 산점도 생성
  const renderScatters = (data: ChartDataPoint[]) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null; // 데이터가 없으면 아무것도 렌더링하지 않음
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
  if (loading) {
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
            setLoading(true);
            setError(null);
            setTimeout(() => window.location.reload(), 100);
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

  // 차트 너비 계산 (주차별로 최소 150px 할당)
  const calculateChartWidth = () => {
    const minWidth = 100; // 최소 너비(%)
    const perWeekWidth = 150; // 주당 픽셀 너비
    return Math.max(minWidth, weekLabels.length * perWeekWidth);
  };

  // 주차 데이터가 너무 많아 가로 스크롤이 필요한지 확인
  const needsHorizontalScroll = weekLabels.length > 3;

  // X축 도메인 계산 (마지막 주의 끝까지 표시)
  const xAxisDomain = [0, weekLabels.length - 1 + 1];

  return (
    <div className="col-span-6 sm:col-span-6 md:col-span-6 lg:col-span-6 space-y-4 md:space-y-6">
      {/* 유산소 운동 차트 */}
      <div className="bg-white p-3 md:p-4 shadow rounded-lg dark:bg-gray-8 overflow-hidden">
        <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-4 dark:text-gray-5 text-[#6F6F6F] pt-2 md:pt-3">
          주별 유산소 운동량
        </h2>
        <div className="overflow-x-auto pb-4">
          <div
            className="h-[200px] sm:h-[250px] md:h-[300px]"
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
                  ...(window.innerWidth >= 768
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
                  ticks={weekLabels.map((_, i) => i + 0.5)} // 각 주의 중앙
                  tickFormatter={(value) => {
                    const weekIndex = Math.floor(value);
                    // 모바일에서는 짧은 형식으로 표시 (예: 02.10)
                    if (window.innerWidth < 640) {
                      const weekLabel = weekLabels[weekIndex] || '';
                      return weekLabel.split('-')[0] || '';
                    }
                    return weekLabels[weekIndex] || '';
                  }}
                  allowDecimals={true}
                  interval={0}
                  tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                />
                <YAxis
                  dataKey="y"
                  name="운동량"
                  domain={[0, 'auto']}
                  tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: window.innerWidth < 640 ? 10 : 12,
                    marginTop: window.innerWidth < 640 ? 0 : 10,
                  }}
                />

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
      <div className="bg-white p-3 md:p-4 shadow rounded-lg dark:bg-gray-8 border border-blue-200 overflow-hidden">
        <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-4 dark:text-gray-5 text-[#6F6F6F] pt-2 md:pt-3">
          주별 근력 운동량
        </h2>
        <div className="overflow-x-auto pb-4">
          <div
            className="h-[200px] sm:h-[250px] md:h-[300px]"
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
                  ...(window.innerWidth >= 768
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
                  ticks={weekLabels.map((_, i) => i + 0.5)} // 각 주의 중앙
                  tickFormatter={(value) => {
                    const weekIndex = Math.floor(value);
                    // 모바일에서는 짧은 형식으로 표시 (예: 02.10)
                    if (window.innerWidth < 640) {
                      const weekLabel = weekLabels[weekIndex] || '';
                      return weekLabel.split('-')[0] || '';
                    }
                    return weekLabels[weekIndex] || '';
                  }}
                  allowDecimals={true}
                  interval={0}
                  tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                />
                <YAxis
                  dataKey="y"
                  name="운동량"
                  domain={[0, 'auto']}
                  tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: window.innerWidth < 640 ? 10 : 12,
                    marginTop: window.innerWidth < 640 ? 0 : 10,
                  }}
                />

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
