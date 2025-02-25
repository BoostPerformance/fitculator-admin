import { CalendarProps } from "@/types/calendar";
import calendarUtils from "../utils/calendarUtils";

export default function Calendar({
  handlePrevMonth,
  handleNextMonth,
  currentDate,
  weekdays,
  handleDateClick,
  isInChallengeRange,
  CalenderclassName,
  selectedDate,
}: CalendarProps) {
  const calendarDays = calendarUtils.generateCalendarDays(currentDate); // 추가

  const getButtonStyles = (dayInfo: {
    date: Date;
    isCurrentMonth: boolean;
  }) => {
    if (!dayInfo.isCurrentMonth) return "bg-gray-9 text-white";

    const currentDateStr = calendarUtils.formatDate(dayInfo.date);
    const selectedDateStr = selectedDate;

    if (selectedDateStr === currentDateStr) {
      return "bg-[#FAAA16] text-white hover:bg-amber-500";
    }

    if (isInChallengeRange(dayInfo.date)) {
      return "bg-[#FAAA16] text-white";
    }

    return "bg-white text-gray-4 hover:bg-gray-3";
  };

  return (
    <>
      <div
        className={`${CalenderclassName}  z-10 mt-2 bg-white rounded-[0.125rem] shadow-lg pt-[2rem] pb-[1rem] px-[1.375rem] h-[21.9375rem] w-[19.25rem] sm:top-[4rem] sm:h-[24.5rem] sm:w-[22rem]`}
      >
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
            <div key={index} className="text-center text-gray-11 text-0.75-500">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((dayInfo, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(dayInfo.date)}
              disabled={!isInChallengeRange(dayInfo.date)}
              className={`
              aspect-square flex items-center justify-center rounded-[0.125rem] text-0.75-500
              transition-colors duration-200 w-[2rem] sm:w-[2.5rem]
              ${getButtonStyles(dayInfo)}
              ${
                !isInChallengeRange(dayInfo.date)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
            >
              {dayInfo.date.getDate()}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
