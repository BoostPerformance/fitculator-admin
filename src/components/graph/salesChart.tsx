import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ChartData } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SalesChart() {
  const data: ChartData<'bar'> = {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    datasets: [
      {
        label: 'Sales',
        data: [
          30000, 45000, 25000, 50000, 40000, 35000, 60000, 70000, 80000, 75000,
          65000, 50000,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Sales</h2>
      <Bar data={data} />
    </div>
  );
}
