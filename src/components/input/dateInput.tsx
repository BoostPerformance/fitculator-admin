import { useState } from 'react';
import Image from 'next/image';

interface DateInputProps {
  onChange: (date: string) => void;
  selectedDate: string | undefined;
  challengeStartDate?: string; // YYYY-MM-DD 형식
  challengeEndDate?: string; // YYYY-MM-DD 형식
  defaultCurrentDate?: string; // YYYY-MM-DD 형식
}

const DateInput = ({
  onChange,
  selectedDate,
  challengeStartDate = '2025-01-13', // 기본값 설정
  challengeEndDate = '2025-01-21',
  defaultCurrentDate = '2025-01-13',
}: DateInputProps) => {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(defaultCurrentDate));

  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
  const challengeStart = new Date(challengeStartDate);
  const challengeEnd = new Date(challengeEndDate);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const days = [];

    // 이전 달의 날짜들
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // 다음 달의 날짜들
    const remainingDays = 42 - days.length; // 6주 달력을 만들기 위해
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(nextYear, nextMonth, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const isInChallengeRange = (date: Date) => {
    return date >= challengeStart && date <= challengeEnd;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (date: Date) => {
    onChange(formatDate(date));
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
        <div className="flex items-center justify-center relative bg-white rounded-[2rem] border drop-shadow-sm h-[3.5rem] w-[14rem]">
          <input
            type="text"
            value={selectedDate || ''}
            onClick={() => setOpen(!open)}
            placeholder={formatDate(new Date())}
            readOnly
            className="border px-[1.375rem] py-[0.75rem] rounded-[2rem] h-[3.5rem] drop-shadow-sm dark:bg-gray-300 dark:text-black
            text-center pr-8 w-full focus:outline-none "
          />
          <Image
            src="/svg/calender.svg"
            alt="calender"
            width={20}
            height={20}
            className="absolute right-[2rem]"
          />
        </div>
      </div>

      {open && (
        <div className="absolute z-10 mt-2 bg-white rounded-lg shadow-lg p-[1.375rem] h-[21.9375rem] w-[19.25rem] sm:top-[4rem]">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="text-gray-600">
              ←
            </button>
            <span className="text-gray-1 font-medium">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button onClick={handleNextMonth} className="text-gray-600">
              →
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekdays.map((day, index) => (
              <div
                key={index}
                className="text-center text-gray-11 text-0.75-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays().map((dayInfo, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(dayInfo.date)}
                className={`
                  aspect-square flex items-center justify-center rounded-[0.25rem] text-0.75-500
                  transition-colors duration-200 w-[2rem] 
                  ${
                    dayInfo.isCurrentMonth
                      ? isInChallengeRange(dayInfo.date)
                        ? 'bg-[#FAAA16] text-white hover:bg-amber-500'
                        : 'bg-white text-gray-4 hover:bg-gray-3'
                      : 'bg-gray-9 text-white'
                  }
                `}
              >
                {dayInfo.date.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInput;
