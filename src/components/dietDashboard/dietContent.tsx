import { ProcessedMeal } from "@/types/dietDetaileTableTypes";
import DietDetaileTable from "@/components/dietDashboard/dietDetailTable";
import MobileChart from "@/components/mobileChart";
import DateInput from "@/components/input/dateInput";
import { useState } from "react";
import { useDietData } from "../hooks/useDietData";

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
}

export const DietContent = ({
  selectedDate,
  onDateChange,
  challengeDates,
  filteredByDate,
  mobileSize,
  loading: parentLoading,
  challengeId,
}: DietContentProps) => {
  const [page, setPage] = useState(1);
  const { dietRecords, loading, hasMore } = useDietData(
    challengeId,
    selectedDate,
    page
  );

  // 데이터 로깅
  console.log("[DietContent] Current data:", {
    challengeId,
    selectedDate,
    page,
    recordsCount: dietRecords.length,
    firstRecord: dietRecords[0],
    loading,
    hasMore,
  });

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
