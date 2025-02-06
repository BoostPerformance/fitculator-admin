import { ProcessedMeal } from '@/types/dietDetaileTableTypes';
import DietDetaileTable from '@/components/dietDashboard/dietDetailTable';
import MobileChart from '@/components/mobileChart';
import DateInput from '@/components/input/dateInput';

interface DietContentProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  challengeDates: {
    startDate: string;
    endDate: string;
  };
  filteredByDate: ProcessedMeal[];
  mobileSize: boolean;
}

export const DietContent = ({
  selectedDate,
  onDateChange,
  challengeDates,
  filteredByDate,
  mobileSize,
}: DietContentProps) => {
  return (
    <div className="px-[2rem]">
      <div className="flex sm:justify-center sm:items-center">
        <DateInput
          onChange={onDateChange}
          selectedDate={selectedDate}
          challengeStartDate={challengeDates.startDate}
          challengeEndDate={challengeDates.endDate}
          defaultCurrentDate="2025-01-13"
        />
      </div>
      {mobileSize ? (
        <MobileChart dietDetailItems={filteredByDate} />
      ) : (
        <DietDetaileTable dietDetailItems={filteredByDate} />
      )}
    </div>
  );
};
