import { DailyMealData } from '@/types/dietItemContainerTypes';

interface Challenge {
  challenge_id: string;
  challenges: {
    id: string;
    start_date: string;
    end_date: string;
    title: string;
  };
}

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  const firstDay = new Date(year, month, 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateCalendarDays = (currentDate: Date) => {
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

export const getNavigationHandlers = (
  currentDate: Date,
  setCurrentDate: (date: Date) => void
) => {
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

  return { handlePrevMonth, handleNextMonth };
};

export const isInDateRange = (
  date: Date,
  startDate: string,
  endDate: string
): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return date >= start && date <= end;
};

export const filterMealsByDate = (
  meals: DailyMealData[],
  date: string
): DailyMealData[] => {
  return meals.filter((meal) => meal.recordDate === date);
};

export const getDateHandlers = (
  setRecordDate: (date: string) => void,
  dailyMeals: DailyMealData[],
  setFilteredMeals?: (meals: DailyMealData[]) => void
) => {
  const handleDateClick = (date: Date) => {
    const formattedDate = formatDate(date);
    setRecordDate(formattedDate);

    if (setFilteredMeals) {
      const filteredMeals = filterMealsByDate(dailyMeals, formattedDate);
      setFilteredMeals(filteredMeals);
    }
  };

  return { handleDateClick };
};

export const isInChallengeRange = (
  date: Date,
  challenges: Challenge[],
  selectedChallengeId: string
): boolean => {
  const currentChallenge = challenges.find(
    (challenge) => challenge.challenge_id === selectedChallengeId
  );
  if (!currentChallenge) return false;

  const start = new Date(currentChallenge.challenges.start_date);
  const end = new Date(currentChallenge.challenges.end_date);
  return date >= start && date <= end;
};

export const calendarUtils = {
  getDaysInMonth,
  getFirstDayOfMonth,
  generateCalendarDays,
  formatDate,
  getNavigationHandlers,
  isInDateRange,
  filterMealsByDate,
  getDateHandlers,
  isInChallengeRange,
};
export default calendarUtils;
