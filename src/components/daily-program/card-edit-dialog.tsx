'use client';

import React, { useState, useEffect } from 'react';
import type { DailyProgramCard, ProgramStatus } from '@/types/daily-program';
import { CardForm } from './card-form';

const STATUS_OPTIONS: { value: ProgramStatus; label: string; className: string }[] = [
  { value: 'draft', label: '초안', className: 'text-yellow-700 dark:text-yellow-300' },
  { value: 'published', label: '발행', className: 'text-green-700 dark:text-green-300' },
  { value: 'archived', label: '보관', className: 'text-gray-500 dark:text-gray-400' },
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

  useEffect(() => {
    if (open) {
      setTitle(programTitle ?? '');
      setStatus(programStatus ?? 'draft');
    }
  }, [open, programTitle, programStatus]);

  if (!open) return null;

  const handleSave = () => {
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header - fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {card ? '카드 편집' : '카드 추가'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {dateLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="px-6 py-4 overflow-y-auto space-y-3">
          {/* Program title + status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              일별 타이틀
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일별 타이틀 (선택)"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProgramStatus)}
                className={`px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 font-medium ${
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
            onCancel={onClose}
            hideCheckHint={hideCheckHint}
            onDismissCheckHint={onDismissCheckHint}
          />
        </div>
      </div>
    </div>
  );
}
