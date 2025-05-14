import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// ArcElement 등록
ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartDataPoint {
  category: string;
  percentage: number;
}

interface TrafficSourceChartProps {
  challengeId: string;
}

export default function TrafficSourceChart({
  challengeId,
}: TrafficSourceChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // challengeId가 유효한지 확인
        if (!challengeId) {
          console.error('유효하지 않은 challengeId:', challengeId);
          setChartData([{ category: '데이터 없음', percentage: 100 }]);
          return;
        }

        const response = await fetch(
          `/api/workouts?challengeId=${challengeId}&type=chart`
        );
        const data = await response.json();
        // 데이터가 배열인지 확인
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

  const data: ChartData<'doughnut'> = {
    labels: chartData?.map((item: ChartDataPoint) => item.category) || [],
    datasets: [
      {
        data: chartData?.map((item: ChartDataPoint) => item.percentage) || [],
        backgroundColor: [
          '#3FE2FF',
          '#3E82F1',
          '#ADB9FF',
          '#7CF5DD',
          '#3FE2FF',
        ],
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
      datalabels: {
        color: '#fff',
        formatter: function (value: number, context: any) {
          if (value < 5) return null;
          const label = context.chart.data.labels[context.dataIndex];
          if (value < 6) return `${value.toFixed(2)}%`;
          return `${value.toFixed(2)}%\n${label}`;
        },
        font: {
          size: 12,
        },
        align: 'center' as const,
        anchor: 'center' as const,
      },
    },
    cutout: '30%',
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
        <div className="w-full h-[13rem] sm:py-[2rem] pb-[1rem] flex items-center justify-center">
          <Doughnut data={data} options={options} />
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
