import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// 타입 정의
interface WeeklyWorkoutChartProps {
  challengeId: string;
}

// Dynamic import with loading component
const WeeklyWorkoutChart = dynamic(
  () => import('./WeeklyWorkoutChart'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false,
  }
) as ComponentType<WeeklyWorkoutChartProps>;

export default WeeklyWorkoutChart;