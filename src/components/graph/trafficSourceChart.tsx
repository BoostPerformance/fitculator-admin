import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface ChartDataPoint {
  category: string;
  percentage: number;
}

interface TrafficSourceChartProps {
  challengeId?: string; // 후방 호환성을 위해 유지
  data?: ChartDataPoint[]; // 외부에서 데이터를 받을 수 있도록
  isLoading?: boolean;
  error?: any;
}

const COLORS = ['#3FE2FF', '#3E82F1', '#ADB9FF', '#7CF5DD', '#3FE2FF'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {percent > 0.05 && (
        <text
          x={cx}
          y={cy}
          dx={(outerRadius + innerRadius) / 2 * Math.cos(-((startAngle + endAngle) / 2) * Math.PI / 180)}
          dy={(outerRadius + innerRadius) / 2 * Math.sin(-((startAngle + endAngle) / 2) * Math.PI / 180)}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(2)}%`}
          {percent > 0.06 && (
            <tspan x={cx} dy={15}>
              {payload.category}
            </tspan>
          )}
        </text>
      )}
    </g>
  );
};

export default function TrafficSourceChart({
  challengeId,
  data: externalData,
  isLoading = false,
  error,
}: TrafficSourceChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    // 외부에서 데이터를 받으면 그것을 사용
    if (externalData && Array.isArray(externalData)) {
      setChartData(externalData);
      return;
    }

    // 외부 데이터가 없으면 직접 API 호출 (후방 호환성)
    if (!challengeId) {
      setChartData([{ category: '데이터 없음', percentage: 100 }]);
      return;
    }

    const fetchData = async () => {
      try {
        setInternalLoading(true);
        const response = await fetch(
          `/api/workouts?challengeId=${challengeId}&type=chart`
        );
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setChartData(data);
        } else {
          setChartData([{ category: '데이터 없음', percentage: 100 }]);
        }
      } catch (error) {
        // console.error('Error fetching workout data:', error);
        setChartData([{ category: '데이터 없음', percentage: 100 }]);
      } finally {
        setInternalLoading(false);
      }
    };

    fetchData();
  }, [challengeId, externalData]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const exerciseList = chartData.map((item: ChartDataPoint, index: number) => ({
    name: item.category,
    percentage: `${item.percentage.toFixed(2)}%`,
    rank: index + 1,
  }));

  return (
    <div className="bg-white p-4 shadow rounded-lg dark:bg-gray-8 col-span-2 h-[36rem] overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-100">
      <h2 className="text-lg font-semibold mb-4 dark:text-gray-5 text-[#6F6F6F] pt-3">
        인기운동
      </h2>
      {(isLoading || internalLoading) ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다</p>
        </div>
      ) : (
        <div>
        <div className="w-full h-[16rem] sm:py-[0.5rem] pb-[1rem] flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={105}
                dataKey="percentage"
                onMouseEnter={onPieEnter}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full gap-[2rem] ">
          <div className="lg:px-[2rem] border-t border-gray-200 pt-4 sm:px-[3rem]">
            <div className="flex justify-between text-gray-7 sm:py-[1.5rem] mb-4 ">
              <div className="flex ">
                <span className="w-6"></span>
                <span className="flex-1 font-medium text-[14px]">운동종목</span>
              </div>
              <div className="font-medium text-[14px]">비율</div>
            </div>
            <ul className="space-y-4">
              {exerciseList.map(
                (
                  exercise: { rank: number; name: string; percentage: string },
                  index: number
                ) => (
                  <li key={index} className="flex items-center text-[1rem]">
                    <span className="w-6 font-medium text-[14px] text-[#6F6F6F]">
                      {exercise.rank}
                    </span>
                    <span className="flex-1 font-medium text-[14px] text-[#6F6F6F]">
                      {exercise.name}
                    </span>
                    <span className="font-medium text-[14px] text-[#6F6F6F]">
                      {exercise.percentage}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}