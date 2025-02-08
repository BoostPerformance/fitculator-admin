export interface CalendarProps {
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  currentDate: Date;
  weekdays: string[];
  handleDateClick: (date: Date) => void;
  isInChallengeRange: (date: Date) => boolean;
  CalenderclassName: string;
  selectedDate?: string;
}

// 날짜 정보를 위한 타입
export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
}

// 달력 생성을 위한 유틸리티 함수들의 타입
export interface CalendarUtils {
  getDaysInMonth: (year: number, month: number) => number;
  getFirstDayOfMonth: (year: number, month: number) => number;
  generateCalendarDays: () => DayInfo[];
  formatDate: (date: Date) => string;
}

// DateInput 컴포넌트의 Props 타입도 개선
export interface DateInputProps {
  onChange: (date: string) => void;
  selectedDate: string | undefined;
  challengeStartDate?: string; // YYYY-MM-DD format
  challengeEndDate?: string; // YYYY-MM-DD format
}
