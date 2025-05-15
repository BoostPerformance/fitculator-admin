import { ProcessedMeal } from '@/types/dietDetaileTableTypes';
import DietDetaileTable from '@/components/dietDashboard/dietDetailTable';
import MobileChart from '@/components/mobileChart';
import DateInput from '@/components/input/dateInput';
import { useState, useEffect } from 'react';
import { useDietData } from '../hooks/useDietData';

interface DietContentProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  challengeDates: {
    startDate: string;
    endDate: string;
  };
  filteredByDate: ProcessedMeal[];
  mobileSize: boolean;
  loading?: boolean;
  challengeId: string;
  workout?: boolean;
}

export const DietContent = ({
  selectedDate,
  onDateChange,
  challengeDates,
  filteredByDate,
  mobileSize,
  loading: parentLoading,
  challengeId,
  workout,
}: DietContentProps) => {
  const [page, setPage] = useState(1);
  const [internalPage, setInternalPage] = useState(1);

  const { dietRecords, loading, hasMore } = useDietData(
    challengeId,
    selectedDate,
    page
  );

  // ✅ 페이지 변경 감지 시 setPage → 안전하게 부모 상태 반영
  useEffect(() => {
    if (internalPage > 1 && !loading && hasMore) {
      setPage(internalPage);
    }
  }, [internalPage, loading, hasMore]);

  // ✅ 자식 컴포넌트가 부르는 콜백은 내부 상태만 수정
  const handleLoadMore = (nextPage: number) => {
    setInternalPage(nextPage);
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
      {mobileSize ? (
        <MobileChart
          dietDetailItems={dietRecords}
          selectedDate={selectedDate}
          loading={loading || parentLoading}
        />
      ) : (
        <DietDetaileTable
          dietDetailItems={dietRecords}
          selectedDate={selectedDate}
          loading={loading || parentLoading}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      )}
    </div>
  );
};
