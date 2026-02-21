'use client';

import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { DailyProgramCompletion, VerificationStatus } from '@/types/daily-program';

const statusConfig: Record<VerificationStatus, { label: string; className: string }> = {
  pending: { label: '대기', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  approved: { label: '승인', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: '거부', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  auto_approved: { label: '자동승인', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
};

interface SubmissionTableProps {
  completions: DailyProgramCompletion[];
  onReview: (completion: DailyProgramCompletion) => void;
}

export function SubmissionTable({ completions, onReview }: SubmissionTableProps) {
  if (completions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        제출 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">유저</th>
            <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">프로그램</th>
            <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">카드</th>
            <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">상태</th>
            <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">제출일</th>
            <th className="text-left py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">액션</th>
          </tr>
        </thead>
        <tbody>
          {completions.map((completion) => {
            const user = completion.users;
            const card = completion.daily_program_cards;
            const program = card?.challenge_daily_programs;
            const status = statusConfig[completion.verification_status];

            return (
              <tr
                key={completion.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    {user?.profile_image_url && (
                      <img
                        src={user.profile_image_url}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-gray-900 dark:text-white font-medium">
                      {user?.name || '알 수 없음'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                  {program?.date && format(new Date(program.date + 'T00:00:00'), 'M/d', { locale: ko })}
                  {program?.title && ` - ${program.title}`}
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                  {card?.title || '-'}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                  {format(new Date(completion.completed_at), 'M/d HH:mm', { locale: ko })}
                </td>
                <td className="py-3 px-3">
                  {completion.verification_status === 'pending' && (
                    <button
                      onClick={() => onReview(completion)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      검토
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
