'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type {
 ProgramSubmissionGroup,
 DailyProgramCompletion,
 VerificationStatus,
} from '@/types/daily-program';
import { ProgramStatusBadge } from './program-status-badge';
import { CardTypeBadge } from './card-type-badge';
import { ProgramSubmissionsDetail } from './program-submissions-detail';

type StatusFilter = VerificationStatus | 'all';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
 { value: 'all', label: '전체' },
 { value: 'pending', label: '대기' },
 { value: 'approved', label: '승인' },
 { value: 'rejected', label: '거부' },
 { value: 'auto_approved', label: '자동승인' },
];

const verificationStatusConfig: Record<VerificationStatus, { label: string; className: string }> = {
 pending: { label: '대기', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
 approved: { label: '승인', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
 rejected: { label: '거부', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
 auto_approved: { label: '자동승인', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
};

interface SubmissionsViewProps {
 challengeId: string;
}

export function SubmissionsView({ challengeId }: SubmissionsViewProps) {
 const [groups, setGroups] = useState<ProgramSubmissionGroup[]>([]);
 const [loading, setLoading] = useState(true);
 const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const [detailGroup, setDetailGroup] = useState<ProgramSubmissionGroup | null>(null);
 const [reviewing, setReviewing] = useState<string | null>(null);

 const fetchGroups = useCallback(async () => {
 setLoading(true);
 try {
 let url = `/api/daily-program-completions?challengeId=${challengeId}&groupBy=program`;
 if (statusFilter !== 'all') {
 url += `&status=${statusFilter}`;
 }
 const res = await fetch(url);
 if (res.ok) {
 const data = await res.json();
 setGroups(data);
 }
 } catch (error) {
 console.error('Failed to fetch submission groups:', error);
 } finally {
 setLoading(false);
 }
 }, [challengeId, statusFilter]);

 useEffect(() => {
 fetchGroups();
 }, [fetchGroups]);

 const handleReview = async (completionId: string, status: 'approved' | 'rejected') => {
 setReviewing(completionId);
 try {
 const res = await fetch('/api/daily-program-completions', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id: completionId, verification_status: status }),
 });
 if (res.ok) {
 fetchGroups();
 }
 } catch (error) {
 console.error('Failed to review:', error);
 } finally {
 setReviewing(null);
 }
 };

 const handleDetailOpen = (group: ProgramSubmissionGroup) => {
 setDetailGroup(group);
 };

 const handleDetailClose = () => {
 setDetailGroup(null);
 };

 const handleDetailReviewDone = () => {
 fetchGroups();
 if (detailGroup) {
 // Refresh the detail group
 const updated = groups.find((g) => g.program_id === detailGroup.program_id);
 if (updated) setDetailGroup(updated);
 }
 };

 const formatDate = (dateStr: string) => {
 try {
 return format(new Date(dateStr + 'T00:00:00'), 'M월 d일 (EEE)', { locale: ko });
 } catch {
 return dateStr;
 }
 };

 const formatTime = (timestamp: string) => {
 try {
 return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ko }).replace('약 ', '');
 } catch {
 return '';
 }
 };

 const toggleExpand = (programId: string) => {
 setExpandedId((prev) => (prev === programId ? null : programId));
 };

 // Group completions by card
 const groupByCard = (completions: DailyProgramCompletion[]) => {
 const map = new Map<string, {
 cardId: string;
 cardTitle: string;
 cardType: any;
 sortOrder: number;
 completions: DailyProgramCompletion[];
 }>();
 for (const c of completions) {
 const card = c.daily_program_cards;
 if (!card) continue;
 if (!map.has(card.id)) {
 map.set(card.id, {
 cardId: card.id,
 cardTitle: card.title,
 cardType: card.card_type,
 sortOrder: (card as any).sort_order ?? 0,
 completions: [],
 });
 }
 map.get(card.id)!.completions.push(c);
 }
 return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
 };

 // Collect unique user avatars for preview
 const getUniqueUsers = (completions: DailyProgramCompletion[]) => {
 const seen = new Set<string>();
 const users: { id: string; name: string; profile_image_url?: string }[] = [];
 for (const c of completions) {
 if (c.users && !seen.has(c.users.id)) {
 seen.add(c.users.id);
 users.push(c.users);
 }
 }
 return users;
 };

 return (
 <div className="flex flex-col">
 {/* Status filter pills */}
 <div className="px-6 sm:px-4 py-3 border-b border-line flex items-center gap-2 overflow-x-auto">
 {STATUS_OPTIONS.map((opt) => (
 <button
 key={opt.value}
 onClick={() => setStatusFilter(opt.value)}
 className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
 statusFilter === opt.value
 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
 : 'text-content-secondary hover:bg-surface-raised'
 }`}
 >
 {opt.label}
 </button>
 ))}
 </div>

 {/* Program group list */}
 <div className="flex-1 overflow-auto px-6 sm:px-4 py-4">
 {loading ? (
 <div className="flex items-center justify-center h-32">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
 </div>
 ) : groups.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-32 text-content-tertiary">
 <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
 </svg>
 <span className="text-sm">제출된 프로그램이 없습니다</span>
 </div>
 ) : (
 <div className="space-y-3">
 {groups.map((group) => {
 const isExpanded = expandedId === group.program_id;
 const uniqueUsers = getUniqueUsers(group.completions);
 const cardGroups = isExpanded ? groupByCard(group.completions) : [];

 return (
 <div
 key={group.program_id}
 className={`rounded-xl border transition-all ${
 isExpanded
 ? 'border-blue-300 dark:border-blue-700 bg-surface'
 : 'border-line hover:border-blue-200 dark:hover:border-blue-800'
 }`}
 >
 {/* Program header - always visible */}
 <button
 onClick={() => toggleExpand(group.program_id)}
 className="w-full text-left px-4 py-3"
 >
 <div className="flex items-center justify-between mb-1.5">
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-content-primary">
 {formatDate(group.program_date)}
 </span>
 <ProgramStatusBadge status={group.program_status} />
 </div>
 <svg
 className={`w-4 h-4 text-content-tertiary transition-transform duration-200 ${
  isExpanded ? 'rotate-90' : ''
 }`}
 fill="none" viewBox="0 0 24 24" stroke="currentColor"
 >
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </div>

 {group.program_title && (
 <p className="text-sm text-content-secondary mb-2 truncate">
 {group.program_title}
 </p>
 )}

 {/* Stats + avatar preview row */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3 text-xs text-content-tertiary">
 <span className="inline-flex items-center gap-1">
 제출
 <span className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full bg-green-500 text-white">
 <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </span>
 {group.unique_submitted_members}/{group.total_target_members} 명
 <span className="text-content-disabled">
 ({group.approved_count + group.auto_approved_count}/{group.total_cards_with_check * group.total_target_members}개)
 </span>
 </span>
 {group.pending_count > 0 && (
 <span className="text-yellow-600 dark:text-yellow-400 font-medium">
 {group.pending_count} 대기
 </span>
 )}
 </div>

 {/* Avatar stack */}
 {uniqueUsers.length > 0 && (
 <div className="flex items-center -space-x-1.5 flex-shrink-0">
 {uniqueUsers.slice(0, 5).map((u) => (
 u.profile_image_url ? (
 <img
 key={u.id}
 src={u.profile_image_url}
 alt={u.name}
 title={u.name}
 className="w-6 h-6 rounded-full object-cover border-2 border-surface"
 />
 ) : (
 <div
 key={u.id}
 title={u.name}
 className="w-6 h-6 rounded-full bg-surface-raised border-2 border-surface flex items-center justify-center"
 >
 <span className="text-[9px] font-medium text-content-tertiary">
 {u.name?.charAt(0) || '?'}
 </span>
 </div>
 )
 ))}
 {uniqueUsers.length > 5 && (
 <div className="w-6 h-6 rounded-full bg-surface-raised border-2 border-surface flex items-center justify-center">
 <span className="text-[9px] font-medium text-content-tertiary">
 +{uniqueUsers.length - 5}
 </span>
 </div>
 )}
 </div>
 )}
 </div>
 </button>

 {/* Expanded inline content */}
 {isExpanded && (
 <div className="border-t border-line">
 {/* Card sections */}
 <div className="px-4 py-3 space-y-4">
 {cardGroups.map((cardGroup) => (
 <div key={cardGroup.cardId}>
 <div className="flex items-center gap-2 mb-2">
  <CardTypeBadge type={cardGroup.cardType} />
  <span className="text-xs font-medium text-content-secondary">
  {cardGroup.cardTitle}
  </span>
  <span className="text-[10px] text-content-disabled">
  {cardGroup.completions.length}명
  </span>
 </div>

 <div className="space-y-1.5">
  {cardGroup.completions.map((completion) => {
  const user = completion.users;
  const vStatus = verificationStatusConfig[completion.verification_status];
  const hasWorkout = !!completion.workout_id;

  return (
  <div
  key={completion.id}
  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-raised/50 transition-colors group"
  >
  {/* Avatar */}
  {user?.profile_image_url ? (
  <img
  src={user.profile_image_url}
  alt=""
  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
  />
  ) : (
  <div className="w-6 h-6 rounded-full bg-surface-raised flex items-center justify-center flex-shrink-0">
  <span className="text-[9px] font-medium text-content-tertiary">
  {user?.name?.charAt(0) || '?'}
  </span>
  </div>
  )}

  {/* Name + status + time */}
  <div className="flex-1 min-w-0 flex items-center gap-2">
  <span className="text-[13px] font-medium text-content-primary truncate">
  {user?.name || '알 수 없음'}
  </span>
  {completion.verification_status === 'approved' || completion.verification_status === 'auto_approved' ? (
  <span
  className="w-4.5 h-4.5 flex-shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-green-500 dark:bg-green-600 text-white"
  title={vStatus.label}
  >
  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
  </span>
  ) : (
  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0 ${vStatus.className}`}>
  {vStatus.label}
  </span>
  )}
  {hasWorkout && (
  <span className="text-[10px] text-blue-500 dark:text-blue-400 flex-shrink-0" title="운동 연결됨">
  <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
   <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.28 8.838" />
  </svg>
  </span>
  )}
  <span className="text-[11px] text-content-disabled flex-shrink-0">
  {formatTime(completion.completed_at)}
  </span>
  </div>

  {/* Review buttons (pending only) */}
  {completion.verification_status === 'pending' && (
  <div className="flex items-center gap-1.5 flex-shrink-0">
  <button
  onClick={(e) => { e.stopPropagation(); handleReview(completion.id, 'approved'); }}
  disabled={reviewing === completion.id}
  className="w-6 h-6 rounded-full bg-green-500 dark:bg-green-600 text-white flex items-center justify-center hover:bg-green-600 dark:hover:bg-green-500 transition-colors disabled:opacity-50"
  title="승인"
  >
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
  </button>
  <button
  onClick={(e) => { e.stopPropagation(); handleReview(completion.id, 'rejected'); }}
  disabled={reviewing === completion.id}
  className="w-6 h-6 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-500 transition-colors disabled:opacity-50"
  title="거부"
  >
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
  </button>
  </div>
  )}
  </div>
  );
  })}
 </div>
 </div>
 ))}
 </div>

 {/* "상세 보기" footer to open modal for comments/workout detail */}
 {group.completions.some((c) => c.workout_id) && (
 <div className="border-t border-line px-4 py-2">
  <button
  onClick={() => handleDetailOpen(group)}
  className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition-colors"
  >
  운동 상세 + 코멘트 보기 →
  </button>
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Drill-down modal for workout detail + comments */}
 {detailGroup && (
 <ProgramSubmissionsDetail
 group={detailGroup}
 challengeId={challengeId}
 onClose={handleDetailClose}
 onReviewDone={handleDetailReviewDone}
 />
 )}
 </div>
 );
}
