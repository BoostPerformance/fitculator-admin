'use client';

import React from 'react';
import {
 startOfMonth, endOfMonth, startOfWeek, endOfWeek,
 eachDayOfInterval, format,
} from 'date-fns';
import type { DailyProgram } from '@/types/daily-program';
import { CalendarDayCell } from './calendar-day-cell';

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

interface CalendarMonthViewProps {
 currentDate: Date;
 programs: DailyProgram[];
 onProgramClick: (program: DailyProgram) => void;
 onAddProgram: (date: string) => void;
 onDateChange: (programId: string, newDate: string) => void;
}

export function CalendarMonthView({
 currentDate,
 programs,
 onProgramClick,
 onAddProgram,
 onDateChange,
}: CalendarMonthViewProps) {
 const monthStart = startOfMonth(currentDate);
 const monthEnd = endOfMonth(currentDate);
 const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
 const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

 const days = eachDayOfInterval({ start: calStart, end: calEnd });

 return (
  <div className="border border-line rounded-lg overflow-hidden">
   {/* Weekday header */}
   <div className="grid grid-cols-7">
    {WEEKDAY_LABELS.map((label, i) => (
     <div
      key={label}
      className={`text-center text-xs font-medium py-2 border-b border-line ${
       i >= 5
        ? 'text-content-disabled'
        : 'text-content-secondary'
      } bg-surface-raised/50`}
     >
      {label}
     </div>
    ))}
   </div>

   {/* Calendar grid */}
   <div className="grid grid-cols-7">
    {days.map((day) => (
     <CalendarDayCell
      key={format(day, 'yyyy-MM-dd')}
      date={day}
      currentMonth={currentDate}
      programs={programs}
      onProgramClick={onProgramClick}
      onAddProgram={onAddProgram}
     />
    ))}
   </div>
  </div>
 );
}
