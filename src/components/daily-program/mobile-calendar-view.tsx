'use client';

import React from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isToday, isSameMonth, isSameDay,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import type { DailyProgram } from '@/types/daily-program';
import { CalendarProgramChip } from './calendar-program-chip';

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

interface MobileCalendarViewProps {
  currentDate: Date;
  programs: DailyProgram[];
  selectedDay: Date;
  onSelectedDayChange: (day: Date) => void;
  onProgramClick: (program: DailyProgram) => void;
  onAddProgram: (date: string) => void;
}

export function MobileCalendarView({
  currentDate,
  programs,
  selectedDay,
  onSelectedDayChange,
  onProgramClick,
  onAddProgram,
}: MobileCalendarViewProps) {

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');
  const selectedPrograms = programs.filter((p) => p.date === selectedDateStr);

  // Build a set of dates that have programs for dot indicators
  const datesWithPrograms = new Set(programs.map((p) => p.date));

  const handleDayTap = (day: Date) => {
    onSelectedDayChange(day);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mini calendar grid */}
      <div className="border border-line rounded-lg overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`text-center text-[11px] font-medium py-1.5 border-b border-line ${
                i >= 5 ? 'text-content-disabled' : 'text-content-secondary'
              } bg-surface-raised/50`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isSameDay(day, selectedDay);
            const today = isToday(day);
            const hasPrograms = datesWithPrograms.has(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => handleDayTap(day)}
                className={`flex flex-col items-center justify-center py-2 transition-colors relative ${
                  !isCurrentMonth ? 'opacity-30' : ''
                }`}
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : today
                        ? 'text-blue-500 font-bold'
                        : 'text-content-primary dark:text-white'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {/* Dot indicator */}
                <div className="h-1.5 flex items-center justify-center mt-0.5">
                  {hasPrograms && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                  )}
                  {hasPrograms && isSelected && (
                    <span className="w-1 h-1 rounded-full bg-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day's programs */}
      <div className="flex-1 mt-3 overflow-y-auto">
        {/* Date header + add button */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-semibold text-content-primary dark:text-white">
            {format(selectedDay, 'M월 d일 (EEEEE)', { locale: ko })}
          </h3>
          <button
            onClick={() => onAddProgram(selectedDateStr)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            추가
          </button>
        </div>

        {/* Program cards */}
        {selectedPrograms.length > 0 ? (
          <div className="space-y-3">
            {selectedPrograms.map((program) => (
              <div
                key={program.id}
                className="rounded-xl border border-line p-3 bg-surface"
              >
                <CalendarProgramChip
                  program={program}
                  onClick={onProgramClick}
                  compact={false}
                  disableDrag
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-content-disabled">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">프로그램 없음</span>
          </div>
        )}
      </div>
    </div>
  );
}
