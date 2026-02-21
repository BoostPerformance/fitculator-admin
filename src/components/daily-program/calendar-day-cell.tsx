'use client';

import React from 'react';
import { format, isToday, isSameMonth } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import type { DailyProgram, DailyProgramCard } from '@/types/daily-program';
import { CalendarProgramChip } from './calendar-program-chip';

interface CalendarDayCellProps {
  date: Date;
  currentMonth: Date;
  programs: DailyProgram[];
  onProgramClick: (program: DailyProgram) => void;
  onCellClick: (date: string) => void;
  onAddCard?: (date: string) => void;
  onCardClick?: (card: DailyProgramCard, program: DailyProgram) => void;
  expanded?: boolean;
}

export function CalendarDayCell({
  date,
  currentMonth,
  programs,
  onProgramClick,
  onCellClick,
  onAddCard,
  onCardClick,
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
      onClick={() => onCellClick(dateStr)}
      className={`group border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
        expanded ? 'min-h-[200px]' : 'min-h-[120px]'
      } ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''} ${
        isOver
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className="p-1.5">
        <div className="flex items-center justify-between mb-1.5">
          <div
            className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
              today
                ? 'bg-blue-500 text-white'
                : isCurrentMonth
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            {format(date, 'd')}
          </div>
          {onAddCard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddCard(dateStr);
              }}
              className={`w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all ${
                expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="카드 추가"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {dayPrograms.map((program) => (
            <CalendarProgramChip
              key={program.id}
              program={program}
              onClick={onProgramClick}
              onCardClick={onCardClick}
              compact={!expanded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
