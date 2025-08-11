import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface ChartDataPoint {
  category: string;
  percentage: number;
}

interface TrafficSourceChartProps {
  challengeId: string;
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
}: TrafficSourceChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!challengeId) {
          console.error('유효하지 않은 challengeId:', challengeId);
          setChartData([{ category: '데이터 없음', percentage: 100 }]);
          return;
        }

        const response = await fetch(
          `/api/workouts?challengeId=${challengeId}&type=chart`
        );
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setChartData(data);
        } else {
          console.error('Invalid data format:', data);
          setChartData([{ category: '데이터 없음', percentage: 100 }]);
        }
      } catch (error) {
        console.error('Error fetching workout data:', error);
        setChartData([{ category: '데이터 없음', percentage: 100 }]);
      }
    };

    fetchData();
  }, [challengeId]);

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
      <div>
        <div className="w-full h-[13rem] sm:py-[0.5rem] pb-[1rem] flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
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
    </div>
  );
}