'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type {
 ProgramSubmissionGroup,
 DailyProgramCompletion,
 VerificationStatus,
} from '@/types/daily-program';
import { ProgramStatusBadge } from './program-status-badge';
import { CardTypeBadge } from './card-type-badge';
import { ProgramSubmissionsDetail, SubmissionDetailPanel, MemberSubmissionsPanel, CardSubmissionsPanel, groupCompletionsByCard } from './program-submissions-detail';
import { useResponsive } from '@/components/hooks/useResponsive';
import { WorkoutIcon } from '@/components/icons/WorkoutIcon';
import { formatTime } from '@/utils/formatTime';
import { verificationStatusConfig } from './constants';

export type StatusFilter = VerificationStatus | 'all';

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
 { value: 'all', label: '전체' },
 { value: 'pending', label: '대기' },
 { value: 'approved', label: '승인' },
 { value: 'rejected', label: '거부' },
 { value: 'auto_approved', label: '자동승인' },
];

interface SubmissionsViewProps {
 challengeId: string;
 statusFilter: StatusFilter;
}

export function SubmissionsView({ challengeId, statusFilter }: SubmissionsViewProps) {
 const { isDesktop } = useResponsive();
 const [groups, setGroups] = useState<ProgramSubmissionGroup[]>([]);
 const [loading, setLoading] = useState(true);

 // Mobile state
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const [detailGroup, setDetailGroup] = useState<ProgramSubmissionGroup | null>(null);

 // PC state
 const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
 const [selectedCompletion, setSelectedCompletion] = useState<DailyProgramCompletion | null>(null);
 const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
 const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
 const [col2ViewMode, setCol2ViewMode] = useState<'card' | 'member'>('member');
 const [col2SortDesc, setCol2SortDesc] = useState(true);

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

 const formatDate = (dateStr: string) => {
 try {
  return format(new Date(dateStr + 'T00:00:00'), 'M월 d일 (EEE)', { locale: ko });
 } catch {
  return dateStr;
 }
 };


 // ── Mobile helpers (unchanged) ──
 const toggleExpand = (programId: string) => {
 setExpandedId((prev) => (prev === programId ? null : programId));
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
  const updated = groups.find((g) => g.program_id === detailGroup.program_id);
  if (updated) setDetailGroup(updated);
 }
 };

 // Group completions by card (for mobile accordion)
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

 // ── PC helpers ──
 const selectedGroup = groups.find((g) => g.program_id === selectedGroupId) || null;

 const handleSelectGroup = (programId: string) => {
 setSelectedGroupId(programId);
 setSelectedCompletion(null);
 setSelectedMemberId(null);
 setSelectedCardId(null);
 };

 const handleSelectCompletion = (completion: DailyProgramCompletion) => {
 setSelectedCompletion(completion);
 };

 // ── Shared: loading spinner ──
 const LoadingSpinner = () => (
 <div className="flex items-center justify-center h-32">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
 </div>
 );

 // ── Shared: empty state ──
 const EmptyState = ({ message }: { message: string }) => (
 <div className="flex flex-col items-center justify-center h-full text-content-tertiary">
  <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
  <span className="text-sm">{message}</span>
 </div>
 );

 // ── Program card (shared between mobile accordion header & PC Col1) ──
 const ProgramCardContent = ({ group: g, showChevron }: { group: ProgramSubmissionGroup; showChevron?: boolean }) => {
 const uniqueUsers = getUniqueUsers(g.completions);
 const totalProgramScore = (() => {
  const seen = new Set<string>();
  let sum = 0;
  for (const c of g.completions) {
  const card = c.daily_program_cards;
  if (card && !seen.has(card.id)) {
   seen.add(card.id);
   sum += card.score_value ?? 0;
  }
  }
  return sum;
 })();
 return (
  <>
  <div className="flex items-center justify-between mb-1.5">
   <div className="flex items-center gap-2">
   <span className="text-sm font-medium text-content-primary">
    {formatDate(g.program_date)}
   </span>
   <ProgramStatusBadge status={g.program_status} />
   {totalProgramScore > 0 && (
    <span className="text-[11px] font-medium text-accent">
    {totalProgramScore} score
    </span>
   )}
   </div>
   {showChevron && (
   <svg
    className={`w-4 h-4 text-content-tertiary transition-transform duration-200 ${
    expandedId === g.program_id ? 'rotate-90' : ''
    }`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
   >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
   </svg>
   )}
  </div>

  {g.program_title && (
   <p className="text-sm text-content-secondary mb-2 truncate">
   {g.program_title}
   </p>
  )}

  <div className="flex items-center justify-between">
   <div className="flex items-center gap-3 text-[14px] text-content-tertiary">
   <span className="inline-flex items-center gap-1">
    <span className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full bg-status-success text-white">
    <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    </span>
    {g.unique_submitted_members}/{g.total_target_members}명
    <span className="text-content-disabled text-[14px]">
    ({g.approved_count + g.auto_approved_count}/{g.total_cards_with_check * g.total_target_members}개)
    </span>
   </span>
   {g.pending_count > 0 && (
    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
    {g.pending_count} 대기
    </span>
   )}
   </div>

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
  </>
 );
 };

 // ── User row (shared between mobile accordion & PC Col2) ──
 const UserRow = ({
 completion,
 onClick,
 isSelected,
 }: {
 completion: DailyProgramCompletion;
 onClick?: () => void;
 isSelected?: boolean;
 }) => {
 const user = completion.users;
 const vStatus = verificationStatusConfig[completion.verification_status];
 const hasWorkout = !!completion.workout_id;

 return (
  <div
  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors group ${
   onClick ? 'cursor-pointer' : ''
  } ${
   isSelected
   ? 'bg-accent-subtle'
   : 'hover:bg-surface-raised'
  }`}
  onClick={onClick}
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
    className="w-4.5 h-4.5 flex-shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-status-success text-white"
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
   <span className="text-accent flex-shrink-0" title="운동 연결됨">
    <WorkoutIcon />
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
    className="w-6 h-6 rounded-full bg-status-success text-white flex items-center justify-center hover:bg-status-success/80 transition-colors disabled:opacity-50"
    title="승인"
   >
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
   </button>
   <button
    onClick={(e) => { e.stopPropagation(); handleReview(completion.id, 'rejected'); }}
    disabled={reviewing === completion.id}
    className="w-6 h-6 rounded-full bg-status-error text-white flex items-center justify-center hover:bg-status-error/80 transition-colors disabled:opacity-50"
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
 };

 // ═══════════════════════════════════════════
 //  PC: 3-Column Layout
 // ═══════════════════════════════════════════
 if (isDesktop) {
 const col2CardGroups = selectedGroup ? groupCompletionsByCard(selectedGroup.completions) : [];

 // Group completions by member for Col2 member view
 const groupByMember = (completions: DailyProgramCompletion[]) => {
  const map = new Map<string, {
  userId: string;
  userName: string;
  profileImageUrl?: string;
  completions: DailyProgramCompletion[];
  }>();
  for (const c of completions) {
  const user = c.users;
  if (!user) continue;
  if (!map.has(user.id)) {
   map.set(user.id, {
   userId: user.id,
   userName: user.name || '알 수 없음',
   profileImageUrl: user.profile_image_url,
   completions: [],
   });
  }
  map.get(user.id)!.completions.push(c);
  }
  return Array.from(map.values()).sort((a, b) => a.userName.localeCompare(b.userName));
 };
 const col2MemberGroups = selectedGroup ? groupByMember(selectedGroup.completions).sort((a, b) => {
  const scoreA = a.completions.reduce((s, c) => s + (c.daily_program_cards?.score_value ?? 0), 0);
  const scoreB = b.completions.reduce((s, c) => s + (c.daily_program_cards?.score_value ?? 0), 0);
  return col2SortDesc ? scoreB - scoreA : scoreA - scoreB;
 }) : [];

 return (
  <div className="flex h-[calc(100vh-120px)] mx-6 mt-2 rounded-xl border border-line bg-surface overflow-hidden">
  {/* ── Col1: Program list ── */}
  <div className="w-72 border-r border-line flex flex-col flex-shrink-0">
   <div className="px-4 h-10 border-b border-line flex-shrink-0 flex items-center">
   <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">프로그램</span>
   </div>
   <div className="flex-1 overflow-y-auto">
   {loading ? (
    <LoadingSpinner />
   ) : groups.length === 0 ? (
    <EmptyState message="제출된 프로그램이 없습니다" />
   ) : (
    <div>
    {groups.map((g) => (
     <button
     key={g.program_id}
     onClick={() => handleSelectGroup(g.program_id)}
     className={`w-full text-left px-4 py-3 border-b border-line transition-colors ${
      selectedGroupId === g.program_id
      ? 'bg-accent-subtle'
      : 'hover:bg-surface-raised'
     }`}
     >
     <ProgramCardContent group={g} />
     </button>
    ))}
    </div>
   )}
   </div>
  </div>

  {/* ── Col2: Card/member submissions ── */}
  <div className="flex-1 min-w-0 border-r border-line flex flex-col">
   {/* Header */}
   <div className="px-4 h-10 border-b border-line flex-shrink-0 flex items-center justify-between">
   <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">제출 현황</span>
   {selectedGroup && (
    <div className="flex items-center gap-1.5">
    <div className="inline-flex items-center gap-0.5 bg-surface-raised rounded-lg p-0.5">
     <button
     onClick={() => setCol2ViewMode('member')}
     className={`px-2 py-0.5 text-[14px] font-medium rounded-md transition-colors ${
      col2ViewMode === 'member'
      ? 'bg-surface text-content-primary shadow-sm'
      : 'text-content-tertiary hover:text-content-secondary'
     }`}
     >
     멤버별
     </button>
     <button
     onClick={() => setCol2ViewMode('card')}
     className={`px-2 py-0.5 text-[14px] font-medium rounded-md transition-colors ${
      col2ViewMode === 'card'
      ? 'bg-surface text-content-primary shadow-sm'
      : 'text-content-tertiary hover:text-content-secondary'
     }`}
     >
     카드별
     </button>
    </div>
    <button
     onClick={() => setCol2SortDesc((prev) => !prev)}
     className="p-1 rounded-md text-content-tertiary hover:text-content-secondary hover:bg-surface-raised transition-colors"
     title={col2SortDesc ? '높은 순' : '낮은 순'}
    >
     <svg className={`w-4 h-4 transition-transform ${col2SortDesc ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
     <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m8-8v16m0 0l-4-4m4 4l4-4" />
     </svg>
    </button>
    </div>
   )}
   </div>

   {!selectedGroup ? (
   <div className="flex-1 flex items-center justify-center text-content-tertiary">
    <div className="text-center">
    <svg className="w-10 h-10 mx-auto mb-3 text-content-disabled" fill="none" viewBox="0 0 24 24" stroke="currentColor">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
    <span className="text-sm">프로그램을 선택하세요</span>
    </div>
   </div>
   ) : (
   <>
    {/* Content */}
    <div className="flex-1 overflow-y-auto px-4 divide-y divide-line">
    {col2ViewMode === 'card' ? (
     /* ── Card view ── */
     col2CardGroups.map((cardGroup) => (
     <div
      key={cardGroup.cardId}
      onClick={() => { setSelectedCardId(cardGroup.cardId); setSelectedCompletion(null); }}
      className={`py-3 px-2 cursor-pointer transition-colors ${
      selectedCardId === cardGroup.cardId ? 'bg-accent-subtle' : 'hover:bg-surface-raised'
      }`}
     >
      <div className="flex items-center gap-2 mb-2">
      <CardTypeBadge type={cardGroup.cardType} />
      <span className="text-xs font-medium text-content-secondary">
       {cardGroup.cardTitle}
      </span>
      {cardGroup.scoreValue > 0 && (
       <span className="text-[11px] font-medium text-accent">
       {cardGroup.scoreValue} score
       </span>
      )}
      <span className="text-[10px] text-content-disabled">
       {cardGroup.completions.length}명
      </span>
      </div>
      <div className="space-y-1">
      {cardGroup.completions.map((completion) => (
       <UserRow
       key={completion.id}
       completion={completion}
       />
      ))}
      </div>
     </div>
     ))
    ) : (
     /* ── Member view ── */
     col2MemberGroups.map((memberGroup) => {
      const totalScore = memberGroup.completions.reduce(
      (sum, c) => sum + (c.daily_program_cards?.score_value ?? 0), 0
      );
      const isSelected = selectedMemberId === memberGroup.userId;
      return (
     <div
      key={memberGroup.userId}
      onClick={() => { setSelectedMemberId(memberGroup.userId); setSelectedCompletion(null); }}
      className={`py-3 px-2 cursor-pointer transition-colors ${
      isSelected ? 'bg-accent-subtle' : 'hover:bg-surface-raised'
      }`}
     >
      <div className="flex items-center gap-2 mb-2">
      {memberGroup.profileImageUrl ? (
       <img src={memberGroup.profileImageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
      ) : (
       <div className="w-5 h-5 rounded-full bg-surface-raised flex items-center justify-center">
       <span className="text-[9px] font-medium text-content-tertiary">{memberGroup.userName.charAt(0)}</span>
       </div>
      )}
      <span className="text-xs font-medium text-content-primary">{memberGroup.userName}</span>
      <span className="text-[10px] text-content-disabled">{memberGroup.completions.length}건</span>
      {totalScore > 0 && (
       <span className="text-[11px] font-medium text-accent">
       {totalScore} score
       </span>
      )}
      </div>
      <div className="space-y-1">
      {memberGroup.completions.map((completion) => {
       const card = completion.daily_program_cards;
       const vStatus = verificationStatusConfig[completion.verification_status];
       return (
       <div key={completion.id} className="flex items-center gap-2 py-1 px-2">
        {card && <CardTypeBadge type={card.card_type} />}
        <span className="text-[13px] text-content-secondary truncate flex-1 min-w-0">
        {card?.title || '카드'}
        </span>
        {completion.verification_status === 'approved' || completion.verification_status === 'auto_approved' ? (
        <span className="flex-shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-status-success text-white" title={vStatus.label}>
         <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
         </svg>
        </span>
        ) : (
        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0 ${vStatus.className}`}>
         {vStatus.label}
        </span>
        )}
        {!!completion.workout_id && (
        <span className="text-accent flex-shrink-0" title="운동 연결됨">
         <WorkoutIcon />
        </span>
        )}
        {completion.verification_status === 'pending' && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
         <button
         onClick={(e) => { e.stopPropagation(); handleReview(completion.id, 'approved'); }}
         disabled={reviewing === completion.id}
         className="w-6 h-6 rounded-full bg-status-success text-white flex items-center justify-center hover:bg-status-success/80 transition-colors disabled:opacity-50"
         title="승인"
         >
         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
         </svg>
         </button>
         <button
         onClick={(e) => { e.stopPropagation(); handleReview(completion.id, 'rejected'); }}
         disabled={reviewing === completion.id}
         className="w-6 h-6 rounded-full bg-status-error text-white flex items-center justify-center hover:bg-status-error/80 transition-colors disabled:opacity-50"
         title="거부"
         >
         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
         </svg>
         </button>
        </div>
        )}
        <span className="text-[11px] text-content-disabled flex-shrink-0">
        {formatTime(completion.completed_at)}
        </span>
       </div>
       );
      })}
      </div>
     </div>
      );
     })
    )}
    </div>
   </>
   )}
  </div>

  {/* ── Col3: Workout detail + comments ── */}
  <div className="flex-1 min-w-0 min-h-0 flex flex-col">
   <div className="px-4 h-10 border-b border-line flex-shrink-0 flex items-center">
   <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">운동 상세</span>
   </div>
   {col2ViewMode === 'card' && selectedCardId ? (
   (() => {
    const cardGroup = col2CardGroups.find((g) => g.cardId === selectedCardId);
    return cardGroup ? (
    <CardSubmissionsPanel
     key={selectedCardId}
     cardId={cardGroup.cardId}
     cardTitle={cardGroup.cardTitle}
     cardType={cardGroup.cardType}
     scoreValue={cardGroup.scoreValue}
     completions={cardGroup.completions}
     challengeId={challengeId}
    />
    ) : (
    <div className="flex-1 flex items-center justify-center text-content-tertiary">
     <span className="text-sm">제출 내역이 없습니다</span>
    </div>
    );
   })()
   ) : col2ViewMode === 'member' && selectedMemberId ? (
   (() => {
    const memberCompletions = selectedGroup?.completions.filter((c) => c.users?.id === selectedMemberId) || [];
    return memberCompletions.length > 0 ? (
    <MemberSubmissionsPanel
     key={selectedMemberId}
     completions={memberCompletions}
     challengeId={challengeId}
    />
    ) : (
    <div className="flex-1 flex items-center justify-center text-content-tertiary">
     <span className="text-sm">제출 내역이 없습니다</span>
    </div>
    );
   })()
   ) : (
   <div className="flex-1 flex items-center justify-center text-content-tertiary">
    <div className="text-center">
    <svg className="w-10 h-10 mx-auto mb-3 text-content-disabled" fill="none" viewBox="0 0 24 24" stroke="currentColor">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
    <span className="text-sm">멤버를 선택하면 운동 상세를 볼 수 있습니다</span>
    </div>
   </div>
   )}
  </div>
  </div>
 );
 }

 // ═══════════════════════════════════════════
 //  Mobile: Existing Accordion + Modal
 // ═══════════════════════════════════════════
 return (
 <div className="flex flex-col">
  {/* Program group list */}
  <div className="flex-1 overflow-auto px-6 sm:px-4 py-4">
  {loading ? (
   <LoadingSpinner />
  ) : groups.length === 0 ? (
   <EmptyState message="제출된 프로그램이 없습니다" />
  ) : (
   <div className="space-y-3">
   {groups.map((group) => {
    const isExpanded = expandedId === group.program_id;
    const cardGroups = isExpanded ? groupByCard(group.completions) : [];

    return (
    <div
     key={group.program_id}
     className={`rounded-xl border transition-all ${
     isExpanded
      ? 'border-accent bg-surface'
      : 'border-line hover:border-accent/40'
     }`}
    >
     {/* Program header - always visible */}
     <button
     onClick={() => toggleExpand(group.program_id)}
     className="w-full text-left px-4 py-3"
     >
     <ProgramCardContent group={group} showChevron />
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
        {cardGroup.completions.map((completion) => (
        <UserRow key={completion.id} completion={completion} />
        ))}
       </div>
       </div>
      ))}
      </div>

      {/* "상세 보기" footer to open modal for comments/workout detail */}
      {group.completions.some((c) => c.workout_id) && (
      <div className="border-t border-line px-4 py-2">
       <button
       onClick={() => handleDetailOpen(group)}
       className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
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
