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
          dietDetailItems={filteredByDate}
          selectedDate={selectedDate}
        />
      ) : (
        <DietDetaileTable
          dietDetailItems={filteredByDate}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};
