'use client';

import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import type { DailyProgram } from '@/types/daily-program';

interface ProgramCopyDialogProps {
 open: boolean;
 onClose: () => void;
 program: DailyProgram;
 challengeId: string;
 onCopied: () => void;
}

export function ProgramCopyDialog({
 open,
 onClose,
 program,
 challengeId,
 onCopied,
}: ProgramCopyDialogProps) {
 const [mode, setMode] = useState<'single' | 'week'>('single');
 const [targetDate, setTargetDate] = useState(
 format(addDays(new Date(program.date + 'T00:00:00'), 1), 'yyyy-MM-dd')
 );
 const [weekStartDate, setWeekStartDate] = useState(
 format(addDays(new Date(program.date + 'T00:00:00'), 7), 'yyyy-MM-dd')
 );
 const [copying, setCopying] = useState(false);

 if (!open) return null;

 const handleCopy = async () => {
 setCopying(true);
 try {
 if (mode === 'single') {
 await duplicateProgram(program, targetDate);
 } else {
 // Copy to each day of the target week (Mon-Sun)
 const start = new Date(weekStartDate + 'T00:00:00');
 for (let i = 0; i < 7; i++) {
 const date = format(addDays(start, i), 'yyyy-MM-dd');
 await duplicateProgram(program, date);
 }
 }
 onCopied();
 } catch (error) {
 console.error('Failed to copy program:', error);
 } finally {
 setCopying(false);
 }
 };

 const duplicateProgram = async (source: DailyProgram, date: string) => {
 // Create the program
 const res = await fetch('/api/daily-programs', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 challenge_id: challengeId,
 date,
 title: source.title,
 description: source.description,
 show_on_main: source.show_on_main,
 target_group_ids: source.daily_program_target_groups?.map((g) => g.group_id) || [],
 }),
 });

 if (!res.ok) return;
 const newProgram = await res.json();

 // Copy cards
 if (source.daily_program_cards && source.daily_program_cards.length > 0) {
 for (const card of source.daily_program_cards) {
 await fetch('/api/daily-program-cards', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 program_id: newProgram.id,
 title: card.title,
 body: card.body,
 card_type: card.card_type,
 sort_order: card.sort_order,
 coaching_tips: card.coaching_tips,
 has_check: card.has_check,
 requires_approval: card.requires_approval,
 score_value: card.score_value,
 workout_date_start: card.workout_date_start,
 workout_date_end: card.workout_date_end,
 submission_start: card.submission_start,
 submission_end: card.submission_end,
 }),
 });
 }
 }
 };

 return (
 <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
 <div className="bg-surface rounded-lg shadow-xl max-w-md w-full">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-line">
 <h3 className="text-lg font-semibold text-content-primary">
 프로그램 복제
 </h3>
 <button
 onClick={onClose}
 className="p-1 rounded hover:bg-surface-raised transition-colors"
 >
 <svg className="w-5 h-5 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Body */}
 <div className="px-6 py-4 space-y-4">
 <div className="text-sm text-content-secondary">
 <strong>{program.title || '(제목 없음)'}</strong> ({program.date}) 프로그램과 모든 카드를 복제합니다.
 </div>

 {/* Mode selection */}
 <div className="flex items-center gap-4">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 name="copy-mode"
 checked={mode === 'single'}
 onChange={() => setMode('single')}
 className="h-4 w-4 text-accent"
 />
 <span className="text-sm text-content-secondary">단일 날짜</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 name="copy-mode"
 checked={mode === 'week'}
 onChange={() => setMode('week')}
 className="h-4 w-4 text-accent"
 />
 <span className="text-sm text-content-secondary">주간 복제 (7일)</span>
 </label>
 </div>

 {mode === 'single' ? (
 <div>
 <label className="block text-sm font-medium text-content-secondary mb-1">
 대상 날짜
 </label>
 <input
 type="date"
 value={targetDate}
 onChange={(e) => setTargetDate(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-md bg-surface text-content-primary text-sm"
 />
 </div>
 ) : (
 <div>
 <label className="block text-sm font-medium text-content-secondary mb-1">
 주 시작 날짜 (월요일)
 </label>
 <input
 type="date"
 value={weekStartDate}
 onChange={(e) => setWeekStartDate(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-md bg-surface text-content-primary text-sm"
 />
 <p className="text-xs text-content-tertiary mt-1">
 선택한 날짜부터 7일간 동일한 프로그램이 생성됩니다.
 </p>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line">
 <button
 onClick={onClose}
 className="px-4 py-2 text-sm border border-line text-content-secondary rounded-md hover:bg-surface-raised transition-colors"
 >
 취소
 </button>
 <button
 onClick={handleCopy}
 disabled={copying}
 className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors font-medium"
 >
 {copying ? '복제 중...' : mode === 'single' ? '복제' : '주간 복제'}
 </button>
 </div>
 </div>
 </div>
 );
}
