'use client';

import React from 'react';
import { format, isToday, isSameMonth } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import type { DailyProgram } from '@/types/daily-program';
import { CalendarProgramChip } from './calendar-program-chip';

interface CalendarDayCellProps {
 date: Date;
 currentMonth: Date;
 programs: DailyProgram[];
 onProgramClick: (program: DailyProgram) => void;
 onAddProgram: (date: string) => void;
 expanded?: boolean;
}

export function CalendarDayCell({
 date,
 currentMonth,
 programs,
 onProgramClick,
 onAddProgram,
 expanded = false,
}: CalendarDayCellProps) {
 const dateStr = format(date, 'yyyy-MM-dd');
 const isCurrentMonth = isSameMonth(date, currentMonth);
 const today = isToday(date);
 const dayPrograms = programs.filter((p) => p.date === dateStr);

 const { isOver, setNodeRef } = useDroppable({
  id: dateStr,
 });

 return (
  <div
   ref={setNodeRef}
   className={`group border border-line-subtle transition-colors overflow-hidden min-w-0 break-words ${
    expanded ? 'min-h-[200px] md:min-h-[150px]' : 'min-h-[120px] md:min-h-[100px]'
   } ${!isCurrentMonth ? 'bg-surface-raised/50/30' : ''} ${
    isOver
     ? 'bg-accent-subtle border-accent'
     : ''
   }`}
  >
   <div className="p-1.5">
    <div className="flex items-center justify-between mb-1.5">
     <div
      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
       today
        ? 'bg-accent text-white'
        : isCurrentMonth
        ? 'text-content-secondary'
        : 'text-content-disabled'
      }`}
     >
      {format(date, 'd')}
     </div>
     <button
      onClick={(e) => {
       e.stopPropagation();
       onAddProgram(dateStr);
      }}
      className={`w-5 h-5 flex items-center justify-center rounded border border-line text-content-disabled hover:border-accent hover:text-accent transition-all ${
       expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
      title="프로그램 추가"
     >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
     </button>
    </div>

    <div className={`space-y-1.5 ${!expanded ? 'max-h-[calc(100%-32px)] overflow-y-auto scrollbar-thin' : ''}`}>
     {dayPrograms.map((program) => (
      <CalendarProgramChip
       key={program.id}
       program={program}
       onClick={onProgramClick}
       compact={!expanded}
      />
     ))}
    </div>
   </div>
  </div>
 );
}
