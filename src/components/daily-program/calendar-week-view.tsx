'use client';

import React from 'react';
import {
  startOfWeek, endOfWeek, eachDayOfInterval, format,
} from 'date-fns';
import type { DailyProgram, DailyProgramCard } from '@/types/daily-program';
import { CalendarDayCell } from './calendar-day-cell';

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

interface CalendarWeekViewProps {
  currentDate: Date;
  programs: DailyProgram[];
  onProgramClick: (program: DailyProgram) => void;
  onDayCellClick: (date: string) => void;
  onDateChange: (programId: string, newDate: string) => void;
  onAddCard?: (date: string) => void;
  onCardClick?: (card: DailyProgramCard, program: DailyProgram) => void;
}

export function CalendarWeekView({
  currentDate,
  programs,
  onProgramClick,
  onDayCellClick,
  onDateChange,
  onAddCard,
  onCardClick,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-medium py-2 border-b border-gray-200 dark:border-gray-700 ${
              i >= 5
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-600 dark:text-gray-400'
            } bg-gray-50 dark:bg-gray-800/50`}
          >
            {label} {format(days[i], 'd')}
          </div>
        ))}
      </div>

      {/* Week row */}
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <CalendarDayCell
            key={format(day, 'yyyy-MM-dd')}
            date={day}
            currentMonth={currentDate}
            programs={programs}
            onProgramClick={onProgramClick}
            onCellClick={onDayCellClick}
            onAddCard={onAddCard}
            onCardClick={onCardClick}
            expanded
          />
        ))}
      </div>
    </div>
  );
}
