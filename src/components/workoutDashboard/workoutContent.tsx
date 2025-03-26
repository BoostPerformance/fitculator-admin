'use client';
import { useState } from 'react';
import DateInput from '@/components/input/dateInput';
import { useWorkoutData } from '../hooks/useWorkoutData';
import WorkoutTable from '@/components/workoutDashboard/workoutTable';

interface WorkoutContentProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  challengeDates: {
    startDate: string;
    endDate: string;
  };
  mobileSize?: boolean;
  loading?: boolean;
  challengeId: string;
}

export const WorkoutContent = ({
  selectedDate,
  onDateChange,
  challengeDates,
  loading: parentLoading,
  challengeId,
}: WorkoutContentProps) => {
  const [page, setPage] = useState(1);
  const { workoutRecords, loading, hasMore } = useWorkoutData(
    challengeId,
    selectedDate,
    page
  );

  const handleLoadMore = (nextPage: number) => {
    if (!loading && hasMore) {
      setPage(nextPage);
    }
  };

  return (
    <div className="lg:px-[2rem] md:px-[1rem] sm:px-[0.5em]">
      <div className="flex sm:justify-center sm:items-center">
        <DateInput
          onChange={onDateChange}
          selectedDate={selectedDate}
          challengeStartDate={challengeDates.startDate}
          challengeEndDate={challengeDates.endDate}
        />
      </div>

      <WorkoutTable
        workoutItems={workoutRecords}
        selectedDate={selectedDate}
        loading={loading || parentLoading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />
    </div>
  );
};

export default WorkoutContent;
