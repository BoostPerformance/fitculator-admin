'use client';

import React from 'react';
import {
 startOfWeek, endOfWeek, eachDayOfInterval, format,
} from 'date-fns';
import type { DailyProgram } from '@/types/daily-program';
import { CalendarDayCell } from './calendar-day-cell';

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

interface CalendarWeekViewProps {
 currentDate: Date;
 programs: DailyProgram[];
 onProgramClick: (program: DailyProgram) => void;
 onAddProgram: (date: string) => void;
 onDateChange: (programId: string, newDate: string) => void;
}

export function CalendarWeekView({
 currentDate,
 programs,
 onProgramClick,
 onAddProgram,
 onDateChange,
}: CalendarWeekViewProps) {
 const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
 const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
 const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

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
      onAddProgram={onAddProgram}
      expanded
     />
    ))}
   </div>
  </div>
 );
}
