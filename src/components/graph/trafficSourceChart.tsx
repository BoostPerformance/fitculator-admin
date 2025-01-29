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
    labels: ['달리기', '주짓수', '웨이트', '사이클', '테니스'],
    datasets: [
      {
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          '#98A8FF',
          '#00D9FF',
          '#3E82F1',
          '#98A8F1',
          '#00D9F1',
          '#3E82FF',
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

  // const textCenter = {
  //   id: 'textCenter',
  //   beforeDraw: function (chart: any) {
  //     const width = chart.width;
  //     const height = chart.height;
  //     const ctx = chart.ctx;

  //     ctx.restore();
  //     const fontSize = (height / 160).toFixed(2);
  //     ctx.font = `${fontSize}em Arial`;
  //     ctx.textBaseline = 'middle';

  //     const text = '인기운동';
  //     const textX = Math.round((width - ctx.measureText(text).width) / 2);
  //     const textY = height / 2;

  //     ctx.fillText(text, textX, textY);
  //     ctx.save();
  //   },
  // };
  const exerciseList = [
    { name: '달리기', percentage: '30%', rank: 1 },
    { name: '주짓수', percentage: '25%', rank: 2 },
    { name: '사이클', percentage: '20%', rank: 3 },
    { name: '웨이트', percentage: '15%', rank: 4 },
    { name: '테니스', percentage: '10%', rank: 5 },
  ];

  return (
    <div className="bg-white p-4 shadow rounded-lg dark:bg-gray-8">
      <h2 className="text-lg font-semibold mb-4 dark:text-gray-5 text-[#6F6F6F] pt-3">
        인기운동
      </h2>
      <div>
        <div className="flex items-center justify-around">
          <div className="lg:w-[15rem] sm:w-[15rem] sm:py-[2rem]">
            <Doughnut data={data} options={options} />
          </div>
          <div>
            <ul className="space-y-2">
              {exerciseList.slice(0, 3).map((exercise, index) => (
                <div>
                  <li
                    key={index}
                    className="flex items-center text-[1rem] text-black"
                  >
                    <span className="w-6">{exercise.rank}</span>
                    <span className="flex-1 ">{exercise.name}</span>
                    <span className="text-gray-500">{exercise.percentage}</span>
                  </li>
                </div>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="302"
            height="2"
            viewBox="0 0 302 2"
            fill="none"
          >
            <path d="M0 1H302" stroke="#E1E1E1" />
          </svg>
          <div className="border-t border-gray-200 pt-4">
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
