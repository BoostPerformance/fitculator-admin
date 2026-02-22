'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DailyProgramCard, ProgramStatus } from '@/types/daily-program';
import { CardForm } from './card-form';

const STATUS_OPTIONS: { value: ProgramStatus; label: string; className: string }[] = [
 { value: 'draft', label: '초안', className: 'text-yellow-700 dark:text-yellow-300' },
 { value: 'published', label: '발행', className: 'text-green-700 dark:text-green-300' },
 { value: 'archived', label: '보관', className: 'text-content-tertiary' },
];

interface CardEditDialogProps {
 open: boolean;
 onClose: () => void;
 card: DailyProgramCard | null;
 programId: string;
 programTitle?: string;
 programStatus?: ProgramStatus;
 challengeId: string;
 dateLabel: string;
 onSaved: () => void;
 hideCheckHint?: boolean;
 onDismissCheckHint?: () => void;
}

export function CardEditDialog({
 open,
 onClose,
 card,
 programId,
 programTitle,
 programStatus,
 challengeId,
 dateLabel,
 onSaved,
 hideCheckHint,
 onDismissCheckHint,
}: CardEditDialogProps) {
 const [title, setTitle] = useState(programTitle ?? '');
 const [status, setStatus] = useState<ProgramStatus>(programStatus ?? 'draft');
 const isDirtyRef = useRef(false);

 useEffect(() => {
 if (open) {
 setTitle(programTitle ?? '');
 setStatus(programStatus ?? 'draft');
 isDirtyRef.current = false;
 }
 }, [open, programTitle, programStatus]);

 const handleDirtyChange = useCallback((dirty: boolean) => {
 isDirtyRef.current = dirty;
 }, []);

 const handleCloseWithConfirm = useCallback(() => {
 if (isDirtyRef.current) {
 if (!confirm('변경된 내용이 저장되지 않습니다. 나가시겠습니까?')) return;
 }
 onClose();
 }, [onClose]);

 if (!open) return null;

 const handleSave = () => {
 onSaved();
 onClose();
 };

 return (
 <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 sm:p-0">
 <div className="bg-surface rounded-lg sm:rounded-none shadow-xl max-w-lg sm:max-w-none w-full max-h-[90vh] sm:max-h-none sm:fixed sm:inset-0 flex flex-col">
 {/* Header - fixed */}
 <div className="flex items-center justify-between px-6 sm:px-4 py-4 sm:py-3 border-b border-line flex-shrink-0">
 <div>
 <h3 className="text-lg sm:text-base font-semibold text-content-primary">
 {card ? '카드 편집' : '카드 추가'}
 </h3>
 <p className="text-sm sm:text-xs text-content-tertiary mt-0.5">
 {dateLabel}
 </p>
 </div>
 <button
 onClick={handleCloseWithConfirm}
 className="p-1.5 rounded-md hover:bg-surface-raised transition-colors"
 >
 <svg className="w-5 h-5 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Body - scrollable */}
 <div className="flex-1 min-h-0 px-6 sm:px-4 py-4 overflow-y-auto space-y-3 overscroll-contain">
 {/* Program title + status */}
 <div>
 <label className="block text-xs font-medium text-content-secondary mb-1">
 일별 타이틀
 </label>
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="일별 타이틀 (선택)"
 className="flex-1 px-3 py-1.5 sm:py-2 text-sm border border-line rounded-md bg-surface text-content-primary dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value as ProgramStatus)}
 className={`px-2 py-1.5 sm:py-2 text-sm border border-line rounded-md bg-surface font-medium ${
 STATUS_OPTIONS.find((s) => s.value === status)?.className ?? ''
 }`}
 >
 {STATUS_OPTIONS.map((s) => (
 <option key={s.value} value={s.value}>
 {s.label}
 </option>
 ))}
 </select>
 </div>
 </div>

 <CardForm
 card={card}
 programId={programId}
 programTitle={title}
 programStatus={status}
 challengeId={challengeId}
 date={dateLabel}
 onSave={handleSave}
 onCancel={handleCloseWithConfirm}
 onDirtyChange={handleDirtyChange}
 hideCheckHint={hideCheckHint}
 onDismissCheckHint={onDismissCheckHint}
 />
 </div>
 </div>
 </div>
 );
}
