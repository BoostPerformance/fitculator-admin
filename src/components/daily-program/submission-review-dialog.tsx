'use client';

import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { DailyProgramCompletion } from '@/types/daily-program';

interface SubmissionReviewDialogProps {
  completion: DailyProgramCompletion;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function SubmissionReviewDialog({
  completion,
  onClose,
  onApprove,
  onReject,
}: SubmissionReviewDialogProps) {
  const user = completion.users;
  const card = completion.daily_program_cards;
  const program = card?.challenge_daily_programs;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            제출 검토
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16">유저</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || '알 수 없음'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16">날짜</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {program?.date || '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16">프로그램</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {program?.title || '(제목 없음)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16">카드</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {card?.title || '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16">제출일</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {format(new Date(completion.completed_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onReject(completion.id)}
            className="px-4 py-2 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            거부
          </button>
          <button
            onClick={() => onApprove(completion.id)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            승인
          </button>
        </div>
      </div>
    </div>
  );
}
