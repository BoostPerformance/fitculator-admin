import { useState, useEffect } from 'react';
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
  // 챌린지 시작일과 종료일을 Date 객체로 변환
  const challengeStart = challengeStartDate
    ? new Date(challengeStartDate)
    : null;
  const challengeEnd = challengeEndDate ? new Date(challengeEndDate) : null;

  // 캘린더 초기 표시 날짜를 챌린지 시작 월로 설정
  const [currentDate, setCurrentDate] = useState<Date>(
    challengeStart || new Date()
  );

  const [open, setOpen] = useState(false);
  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  // 챌린지 시작 월과 종료 월 구하기
  const startMonth = challengeStart ? challengeStart.getMonth() : 0;
  const startYear = challengeStart ? challengeStart.getFullYear() : 0;
  const endMonth = challengeEnd ? challengeEnd.getMonth() : 0;
  const endYear = challengeEnd ? challengeEnd.getFullYear() : 0;

  const formatDateForComparison = (dateStr: string) => {
    return dateStr.split('T')[0]; // Remove any time component
  };

  const isInChallengeRange = (date: Date) => {
    // 날짜를 YYYY-MM-DD 형식으로 변환
    const dateStr = calendarUtils.formatDate(date);

    // 챌린지 시작일과 종료일 형식 통일
    const startStr = formatDateForComparison(challengeStartDate);
    const endStr = formatDateForComparison(challengeEndDate);

    // 현재 날짜가 챌린지 시작일과 종료일 사이에 있는지 확인
    return dateStr >= startStr && dateStr <= endStr;
  };

  // 이전 달 버튼 클릭 처리
  const handlePrevMonth = () => {
    // 현재 표시 중인 년도와 월
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // 이전 달이 챌린지 시작 월보다 이전인지 확인
    if (currentYear === startYear && currentMonth <= startMonth) {
      return; // 챌린지 시작 월이면 이전으로 이동하지 않음
    }

    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  // 다음 달 버튼 클릭 처리
  const handleNextMonth = () => {
    // 현재 표시 중인 년도와 월
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // 다음 달이 챌린지 종료 월보다 이후인지 확인
    if (currentYear === endYear && currentMonth >= endMonth) {
      return; // 챌린지 종료 월이면 다음으로 이동하지 않음
    }

    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    onChange(calendarUtils.formatDate(date));
    setOpen(false);
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
