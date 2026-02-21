'use client';

import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { CalendarViewMode } from '@/types/daily-program';

interface CalendarToolbarProps {
 viewMode: CalendarViewMode;
 onViewModeChange: (mode: CalendarViewMode) => void;
 currentDate: Date;
 onPrev: () => void;
 onNext: () => void;
 onToday: () => void;
}

export function CalendarToolbar({
 viewMode,
 onViewModeChange,
 currentDate,
 onPrev,
 onNext,
 onToday,
}: CalendarToolbarProps) {
 const title =
 viewMode === 'month'
 ? format(currentDate, 'yyyy년 M월', { locale: ko })
 : format(currentDate, 'yyyy년 M월 d일 주', { locale: ko });

 return (
 <div className="flex items-center justify-between px-4 py-3 border-b border-line">
 <div className="flex items-center gap-3">
 <h2 className="text-lg font-semibold text-content-primary dark:text-white min-w-[160px]">
 {title}
 </h2>
 <div className="flex items-center gap-1">
 <button
 onClick={onPrev}
 className="p-1.5 rounded-md hover:bg-surface-raised transition-colors"
 title="이전"
 >
 <svg className="w-5 h-5 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
 </svg>
 </button>
 <button
 onClick={onToday}
 className="px-3 py-1 text-sm font-medium rounded-md border border-line hover:bg-surface-raised text-content-secondary transition-colors"
 >
 오늘
 </button>
 <button
 onClick={onNext}
 className="p-1.5 rounded-md hover:bg-surface-raised transition-colors"
 title="다음"
 >
 <svg className="w-5 h-5 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </button>
 </div>
 </div>

 <div className="flex items-center gap-1 bg-surface-raised rounded-lg p-0.5">
 <button
 onClick={() => onViewModeChange('month')}
 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
 viewMode === 'month'
 ? 'bg-surface text-content-primary dark:text-white shadow-sm'
 : 'text-content-tertiary hover:text-content-secondary'
 }`}
 >
 월
 </button>
 <button
 onClick={() => onViewModeChange('week')}
 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
 viewMode === 'week'
 ? 'bg-surface text-content-primary dark:text-white shadow-sm'
 : 'text-content-tertiary hover:text-content-secondary'
 }`}
 >
 주
 </button>
 </div>
 </div>
 );
}
