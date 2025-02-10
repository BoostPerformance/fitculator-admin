import { useState } from 'react';
import Image from 'next/image';
import Calender from './calendar';
import calendarUtils from '../utils/calendarUtils';
import { DateInputProps } from '@/types/calendar';

const DateInput = ({
  onChange,
  selectedDate,
  challengeStartDate = '',
  challengeEndDate = '',
}: DateInputProps) => {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  const formatDateForComparison = (dateStr: string) => {
    return dateStr.split('T')[0]; // Remove any time component
  };

  const isInChallengeRange = (date: Date) => {
    const dateStr = calendarUtils.formatDate(date);
    const startStr = formatDateForComparison(challengeStartDate);
    const endStr = formatDateForComparison(challengeEndDate);

    return dateStr >= startStr && dateStr <= endStr;
  };

  const handleDateClick = (date: Date) => {
    onChange(calendarUtils.formatDate(date));
    setOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  return (
    <div className="relative sm:flex sm:justify-center">
      <div className="relative inline-block">
        <div className="flex items-center justify-center relative bg-white rounded-[2rem] border drop-shadow-sm h-[3.5rem] w-[14rem] ">
          <input
            type="text"
            value={selectedDate || ''}
            onClick={() => setOpen(!open)}
            placeholder={calendarUtils.formatDate(new Date())}
            readOnly
            className="border px-[1.375rem] py-[0.75rem] rounded-[2rem] h-[3.5rem] drop-shadow-sm dark:bg-gray-300 dark:text-black
            text-center pr-8 w-full focus:outline-none"
          />
          <Image
            src="/svg/calender.svg"
            alt="calender"
            width={20}
            height={20}
            className="absolute right-[2rem]"
            onClick={() => setOpen(!open)}
          />
        </div>
      </div>

      {open && (
        <Calender
          handlePrevMonth={handlePrevMonth}
          handleNextMonth={handleNextMonth}
          currentDate={currentDate}
          weekdays={weekdays}
          handleDateClick={handleDateClick}
          isInChallengeRange={isInChallengeRange}
          CalenderclassName="absolute"
        />
      )}
    </div>
  );
};

export default DateInput;
