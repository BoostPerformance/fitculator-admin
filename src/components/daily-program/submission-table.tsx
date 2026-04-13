'use client';

import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { DailyProgramCompletion } from '@/types/daily-program';
import { verificationStatusConfig as statusConfig } from './constants';

interface SubmissionTableProps {
 completions: DailyProgramCompletion[];
 onReview: (completion: DailyProgramCompletion) => void;
 mobile?: boolean;
}

export function SubmissionTable({ completions, onReview, mobile = false }: SubmissionTableProps) {
 if (completions.length === 0) {
 return (
 <div className="text-center py-12 text-content-disabled">
 제출 기록이 없습니다.
 </div>
 );
 }

 if (mobile) {
 return (
 <div className="space-y-2">
 {completions.map((completion) => {
 const user = completion.users;
 const card = completion.daily_program_cards;
 const program = card?.challenge_daily_programs;
 const status = statusConfig[completion.verification_status];

 return (
 <div
 key={completion.id}
 className="rounded-lg border border-line p-3 bg-surface space-y-2"
 >
 {/* Row 1: User + Status */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 {user?.profile_image_url && (
 <img
 src={user.profile_image_url}
 alt=""
 className="w-6 h-6 rounded-full"
 />
 )}
 <span className="text-sm font-medium text-content-primary">
 {user?.name || '알 수 없음'}
 </span>
 </div>
 <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.className}`}>
 {status.label}
 </span>
 </div>

 {/* Row 2: Program + Card */}
 <div className="text-xs text-content-secondary space-y-0.5">
 <div>
 {program?.date && format(new Date(program.date + 'T00:00:00'), 'M/d', { locale: ko })}
 {program?.title && ` - ${program.title}`}
 </div>
 <div className="text-content-tertiary">{card?.title || '-'}</div>
 </div>

 {/* Row 3: Date + Action */}
 <div className="flex items-center justify-between">
 <span className="text-xs text-content-tertiary">
 {format(new Date(completion.completed_at), 'M/d HH:mm', { locale: ko })}
 </span>
 {completion.verification_status === 'pending' && (
 <button
 onClick={() => onReview(completion)}
 className="px-2.5 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover transition-colors"
 >
 검토
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 );
 }

 return (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-line">
 <th className="text-left py-3 px-3 text-content-tertiary font-medium">유저</th>
 <th className="text-left py-3 px-3 text-content-tertiary font-medium">프로그램</th>
 <th className="text-left py-3 px-3 text-content-tertiary font-medium">카드</th>
 <th className="text-left py-3 px-3 text-content-tertiary font-medium">상태</th>
 <th className="text-left py-3 px-3 text-content-tertiary font-medium">제출일</th>
 <th className="text-left py-3 px-3 text-content-tertiary font-medium">액션</th>
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
 className="border-b border-line-subtle hover:bg-surface-raised/50"
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
 <span className="text-content-primary font-medium">
 {user?.name || '알 수 없음'}
 </span>
 </div>
 </td>
 <td className="py-3 px-3 text-content-secondary">
 {program?.date && format(new Date(program.date + 'T00:00:00'), 'M/d', { locale: ko })}
 {program?.title && ` - ${program.title}`}
 </td>
 <td className="py-3 px-3 text-content-secondary">
 {card?.title || '-'}
 </td>
 <td className="py-3 px-3">
 <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.className}`}>
 {status.label}
 </span>
 </td>
 <td className="py-3 px-3 text-content-tertiary">
 {format(new Date(completion.completed_at), 'M/d HH:mm', { locale: ko })}
 </td>
 <td className="py-3 px-3">
 {completion.verification_status === 'pending' && (
 <button
 onClick={() => onReview(completion)}
 className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover transition-colors"
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
