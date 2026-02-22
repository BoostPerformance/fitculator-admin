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
 onAdd?: () => void;
 hideTitle?: boolean;
}

export function CalendarToolbar({
 viewMode,
 onViewModeChange,
 currentDate,
 onPrev,
 onNext,
 onToday,
 onAdd,
 hideTitle,
}: CalendarToolbarProps) {
 const dateLabel =
 viewMode === 'month'
 ? format(currentDate, 'yyyy년 M월', { locale: ko })
 : format(currentDate, 'yyyy년 M월 d일 주', { locale: ko });

 return (
 <div className={`px-6 py-4 sm:px-4 sm:py-3 ${hideTitle ? '' : 'space-y-2'}`}>
 {/* Row 1: Page title (only when not hidden) */}
 {!hideTitle && (
 <div className="flex items-center justify-between">
 <h1 className="text-headline font-semibold text-content-primary dark:text-white sm:text-title-lg">
 데일리 프로그램
 </h1>
 {onAdd && (
 <button
 onClick={onAdd}
 className="p-1 rounded-md hover:bg-surface-raised text-content-tertiary hover:text-content-primary transition-colors"
 title="프로그램 추가"
 >
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
 </svg>
 </button>
 )}
 </div>
 )}

 {/* Date label + nav + view mode + add */}
 <div className="flex items-center justify-between">
 <span className="text-body-lg font-medium text-content-secondary sm:text-body">
 {dateLabel}
 </span>
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
 className="px-3 py-1 text-sm font-medium rounded-md hover:bg-surface-raised text-content-secondary transition-colors"
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

 {/* View mode switcher */}
 <div className="flex items-center gap-1 bg-surface-raised rounded-lg p-0.5 ml-1 sm:hidden">
 <button
 onClick={() => onViewModeChange('month')}
 className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
 viewMode === 'month'
 ? 'bg-surface text-content-primary dark:text-white shadow-sm'
 : 'text-content-tertiary hover:text-content-secondary'
 }`}
 >
 월간
 </button>
 <button
 onClick={() => onViewModeChange('week')}
 className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
 viewMode === 'week'
 ? 'bg-surface text-content-primary dark:text-white shadow-sm'
 : 'text-content-tertiary hover:text-content-secondary'
 }`}
 >
 주간
 </button>
 </div>

 {hideTitle && onAdd && (
 <button
 onClick={onAdd}
 className="p-1 rounded-md hover:bg-surface-raised text-content-tertiary hover:text-content-primary transition-colors ml-1"
 title="프로그램 추가"
 >
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
 </svg>
 </button>
 )}
 </div>
 </div>
 </div>
 );
}
