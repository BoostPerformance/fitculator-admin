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
    labels: ['Direct', 'Organic', 'Referral'],
    datasets: [
      {
        data: [300, 200, 100],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Traffic Source</h2>
      <Doughnut data={data} />
    </div>
  );
}
