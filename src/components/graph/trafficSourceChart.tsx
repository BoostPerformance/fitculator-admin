import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

// ArcElement 등록
ChartJS.register(ArcElement, Tooltip, Legend);

export default function TrafficSourceChart() {
  const data: ChartData<'doughnut'> = {
    labels: ['달리기', '달리기', '달리기', '달리기', '달리기'],
    datasets: [
      {
        data: [300, 250, 200, 150, 100],
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

  const exerciseList = [
    { name: '달리기', percentage: '30%', rank: 1 },
    { name: '달리기', percentage: '25%', rank: 2 },
    { name: '달리기', percentage: '20%', rank: 3 },
    { name: '달리기', percentage: '15%', rank: 4 },
    { name: '달리기', percentage: '10%', rank: 5 },
  ];

  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h2 className="text-lg font-semibold mb-4">인기운동</h2>
      <div>
        <div className="flex items-center justify-around">
          <div className="lg:w-[20rem]">
            <Doughnut data={data} />
          </div>
          <div>
            <ul className="space-y-2">
              {exerciseList.slice(0, 3).map((exercise, index) => (
                <li
                  key={index}
                  className="flex items-center text-[1rem] text-black"
                >
                  <span className="w-6">{exercise.rank}</span>
                  <span className="flex-1 ">{exercise.name}</span>
                  <span className="text-gray-500">{exercise.percentage}</span>
                </li>
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
