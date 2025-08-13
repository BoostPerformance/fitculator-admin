import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { WorkoutTableProps } from '@/types/workoutTableTypes';

// Dynamic import with loading component
const WorkoutTable = dynamic(
  () => import('./workoutTable'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false,
  }
) as ComponentType<WorkoutTableProps>;

export default WorkoutTable;