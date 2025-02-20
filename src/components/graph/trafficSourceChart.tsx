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

export default function TrafficSourceChart() {
  const data: ChartData<'doughnut'> = {
    labels: ['달리기', 'HIIT', '테니스', '등산', '사이클', '', '', ''],
    datasets: [
      {
        data: [30, 25, 20, 15, 5, 5, 5],
        backgroundColor: [
          '#3FE2FF',
          '#3E82F1',
          '#ADB9FF',
          '#7CF5DD',
          '#3FE2FF',
          '#FF9800',
          '#03A9F4',
          '#9C27B0',
          '#009688',
        ],
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false, // 오른쪽 범례 숨기기
      },
      tooltip: {
        enabled: false,
      },
      datalabels: {
        color: '#fff',
        formatter: function (value: number, context: any) {
          const label = context.chart.data.labels[context.dataIndex];
          return `${value}%\n ${label}`;
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

  const exerciseList = [
    { name: '달리기', percentage: '30%', rank: 1 },
    { name: 'HIIT', percentage: '25%', rank: 2 },
    { name: '테니스', percentage: '20%', rank: 3 },
    { name: '등산', percentage: '15%', rank: 4 },
    { name: '사이클', percentage: '10%', rank: 5 },
  ];

  return (
    <div className="bg-white p-4 shadow rounded-lg dark:bg-gray-8 col-span-2 w-full h-[31.25rem]">
      <h2 className="text-lg font-semibold mb-4 dark:text-gray-5 text-[#6F6F6F] pt-3">
        인기운동
      </h2>
      <div>
        <div className="w-full h-[13rem] sm:py-[2rem] pb-[1rem] flex items-center justify-center">
          <Doughnut data={data} options={options} />
        </div>

        <div className="w-full gap-[2rem]">
          <div className="lg:px-[2rem] border-t border-gray-200 pt-4 sm:px-[3rem]">
            <div className="flex justify-between text-gray-7 sm:py-[1rem]">
              <div className="sm:px-[1rem]">운동종목</div>
              <div>퍼센트</div>
            </div>
            <ul className="space-y-2">
              {exerciseList.map((exercise, index) => (
                <li
                  key={index}
                  className="flex items-center text-[1rem] text-black"
                >
                  <span className="w-6">{exercise.rank}</span>
                  <span className="flex-1">{exercise.name}</span>
                  <span className="text-gray-500">{exercise.percentage}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
