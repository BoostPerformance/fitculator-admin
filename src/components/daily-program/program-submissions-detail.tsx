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
import WorkoutCommentSection from '@/components/runningDashboard/WorkoutCommentSection';
import WorkoutReactionBar from '@/components/workout/WorkoutReactionBar';
import { verificationStatusConfig } from './constants';

interface CoachInfo {
 userId: string;
 name: string;
 profileImageUrl: string | null;
}

interface WorkoutDetail {
 id: string;
 title: string;
 timestamp: string;
 duration_minutes: number | null;
 distance: number | null;
 points: number | null;
 note: string | null;
 intensity: number | null;
 calories: number | null;
 avg_heart_rate: number | null;
 max_heart_rate: number | null;
 pace_per_km: number | null;
 photos?: string[];
 workout_categories?: {
 name_ko: string;
 workout_types?: { name: string };
 };
}

interface ProgramSubmissionsDetailProps {
 group: ProgramSubmissionGroup;
 challengeId: string;
 onClose: () => void;
 onReviewDone: () => void;
}

// ── Inline panel for PC 3-column Col3 ──
// Renders workout detail + comments for a single completion
interface SubmissionDetailPanelProps {
 completion: DailyProgramCompletion;
 challengeId: string;
}

export function SubmissionDetailPanel({ completion, challengeId }: SubmissionDetailPanelProps) {
 const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
 const [workoutDetail, setWorkoutDetail] = useState<WorkoutDetail | null>(null);
 const [loadingWorkout, setLoadingWorkout] = useState(false);

 useEffect(() => {
 const fetchCoach = async () => {
  try {
  const res = await fetch('/api/coach-identity');
  if (res.ok) {
   const data = await res.json();
   setCoachInfo({ userId: data.userId, name: data.name, profileImageUrl: data.profileImageUrl });
  }
  } catch { /* ignore */ }
 };
 fetchCoach();
 }, []);

 useEffect(() => {
 if (!completion.workout_id) {
  setWorkoutDetail(null);
  return;
 }
 setLoadingWorkout(true);
 fetch(`/api/workouts/user-detail?type=workout&workoutId=${completion.workout_id}`)
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => { if (data) setWorkoutDetail(data); })
  .catch(() => {})
  .finally(() => setLoadingWorkout(false));
 }, [completion.workout_id]);

 const user = completion.users;
 const vStatus = verificationStatusConfig[completion.verification_status];

 const formatTime = (timestamp: string) => {
 try {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ko }).replace('약 ', '');
 } catch { return ''; }
 };

 return (
 <div className="flex flex-col h-full min-h-0">
  {/* User header */}
  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line flex-shrink-0">
  {user?.profile_image_url ? (
   <img src={user.profile_image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  ) : (
   <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center flex-shrink-0">
   <span className="text-xs font-medium text-content-tertiary">{user?.name?.charAt(0) || '?'}</span>
   </div>
  )}
  <div className="flex-1 min-w-0">
   <div className="flex items-center gap-2">
   <span className="text-sm font-medium text-content-primary truncate">{user?.name || '알 수 없음'}</span>
   {completion.verification_status === 'approved' || completion.verification_status === 'auto_approved' ? (
    <span className="flex-shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-status-success text-white" title={vStatus.label}>
    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    </span>
   ) : (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full ${vStatus.className}`}>{vStatus.label}</span>
   )}
   </div>
   <span className="text-xs text-content-tertiary">{formatTime(completion.completed_at)}</span>
  </div>
  </div>

  {/* Content */}
  <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
  {!completion.workout_id ? (
   <div className="flex items-center gap-1.5 text-sm text-content-tertiary">
   <svg className="w-5 h-5 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
   </svg>
   체크 완료
   </div>
  ) : loadingWorkout ? (
   <div className="flex items-center justify-center py-8">
   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
   </div>
  ) : (
   <>
   {workoutDetail && <WorkoutCard workout={workoutDetail} />}
   <div className="my-2">
    <WorkoutReactionBar workoutId={completion.workout_id} />
   </div>
   <WorkoutCommentSection
    workoutId={completion.workout_id}
    challengeId={challengeId}
    coachInfo={coachInfo}
   />
   </>
  )}
  </div>
 </div>
 );
}

// ── Inline panel for PC Col3: all completions for one member ──
interface MemberSubmissionsPanelProps {
 completions: DailyProgramCompletion[];
 challengeId: string;
}

export function MemberSubmissionsPanel({ completions, challengeId }: MemberSubmissionsPanelProps) {
 const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
 const [workoutDetails, setWorkoutDetails] = useState<Record<string, WorkoutDetail>>({});
 const [loadingWorkouts, setLoadingWorkouts] = useState<Set<string>>(new Set());

 const user = completions[0]?.users;
 const totalScore = completions.reduce(
 (sum, c) => sum + (c.daily_program_cards?.score_value ?? 0), 0
 );

 useEffect(() => {
 const fetchCoach = async () => {
  try {
  const res = await fetch('/api/coach-identity');
  if (res.ok) {
   const data = await res.json();
   setCoachInfo({ userId: data.userId, name: data.name, profileImageUrl: data.profileImageUrl });
  }
  } catch { /* ignore */ }
 };
 fetchCoach();
 }, []);

 useEffect(() => {
 for (const c of completions) {
  if (!c.workout_id || workoutDetails[c.workout_id] || loadingWorkouts.has(c.workout_id)) continue;
  setLoadingWorkouts((prev) => new Set(prev).add(c.workout_id!));
  fetch(`/api/workouts/user-detail?type=workout&workoutId=${c.workout_id}`)
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => { if (data) setWorkoutDetails((prev) => ({ ...prev, [c.workout_id!]: data })); })
  .catch(() => {})
  .finally(() => setLoadingWorkouts((prev) => { const next = new Set(prev); next.delete(c.workout_id!); return next; }));
 }
 }, [completions]);

 const formatTime = (timestamp: string) => {
 try {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ko }).replace('약 ', '');
 } catch { return ''; }
 };

 const sorted = [...completions].sort(
 (a, b) => (a.daily_program_cards?.sort_order ?? 0) - (b.daily_program_cards?.sort_order ?? 0)
 );

 return (
 <div className="flex flex-col h-full min-h-0">
  {/* Member header */}
  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line flex-shrink-0">
  {user?.profile_image_url ? (
   <img src={user.profile_image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  ) : (
   <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center flex-shrink-0">
   <span className="text-xs font-medium text-content-tertiary">{user?.name?.charAt(0) || '?'}</span>
   </div>
  )}
  <div className="flex-1 min-w-0">
   <span className="text-sm font-medium text-content-primary truncate">{user?.name || '알 수 없음'}</span>
   <div className="flex items-center gap-2 text-xs text-content-tertiary">
   <span>{completions.length}건 제출</span>
   {totalScore > 0 && (
    <span className="font-medium text-accent">{totalScore} score</span>
   )}
   </div>
  </div>
  </div>

  {/* All completions */}
  <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line">
  {sorted.map((completion) => {
   const card = completion.daily_program_cards;
   const vStatus = verificationStatusConfig[completion.verification_status];
   const workout = completion.workout_id ? workoutDetails[completion.workout_id] : null;
   const isLoadingWorkout = completion.workout_id ? loadingWorkouts.has(completion.workout_id) : false;

   return (
   <div key={completion.id} className="px-4 py-4">
    {/* Card header */}
    <div className="flex items-center gap-2 mb-3">
    {card && <CardTypeBadge type={card.card_type} />}
    <span className="text-[13px] font-medium text-content-primary">{card?.title || '카드'}</span>
    {completion.verification_status === 'approved' || completion.verification_status === 'auto_approved' ? (
     <span className="flex-shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-status-success text-white" title={vStatus.label}>
     <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
     </svg>
     </span>
    ) : (
     <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full ${vStatus.className}`}>{vStatus.label}</span>
    )}
    <span className="text-[11px] text-content-disabled ml-auto">{formatTime(completion.completed_at)}</span>
    </div>

    {/* Workout detail or check-only */}
    {!completion.workout_id ? (
    <div className="flex items-center gap-1.5 text-sm text-content-tertiary">
     <svg className="w-5 h-5 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
     </svg>
     체크 완료
    </div>
    ) : isLoadingWorkout ? (
    <div className="flex items-center justify-center py-4">
     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
    </div>
    ) : (
    <>
     {workout && <WorkoutCard workout={workout} />}
     <div className="my-2">
      <WorkoutReactionBar workoutId={completion.workout_id!} />
     </div>
     <WorkoutCommentSection
     workoutId={completion.workout_id}
     challengeId={challengeId}
     coachInfo={coachInfo}
     />
    </>
    )}
   </div>
   );
  })}
  </div>
 </div>
 );
}

// ── Inline panel for PC Col3: all completions for one card ──
interface CardSubmissionsPanelProps {
 cardId: string;
 cardTitle: string;
 cardType: string;
 scoreValue: number;
 completions: DailyProgramCompletion[];
 challengeId: string;
}

export function CardSubmissionsPanel({ cardTitle, cardType, scoreValue, completions, challengeId }: CardSubmissionsPanelProps) {
 const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
 const [workoutDetails, setWorkoutDetails] = useState<Record<string, WorkoutDetail>>({});
 const [loadingWorkouts, setLoadingWorkouts] = useState<Set<string>>(new Set());

 useEffect(() => {
 const fetchCoach = async () => {
  try {
  const res = await fetch('/api/coach-identity');
  if (res.ok) {
   const data = await res.json();
   setCoachInfo({ userId: data.userId, name: data.name, profileImageUrl: data.profileImageUrl });
  }
  } catch { /* ignore */ }
 };
 fetchCoach();
 }, []);

 useEffect(() => {
 for (const c of completions) {
  if (!c.workout_id || workoutDetails[c.workout_id] || loadingWorkouts.has(c.workout_id)) continue;
  setLoadingWorkouts((prev) => new Set(prev).add(c.workout_id!));
  fetch(`/api/workouts/user-detail?type=workout&workoutId=${c.workout_id}`)
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => { if (data) setWorkoutDetails((prev) => ({ ...prev, [c.workout_id!]: data })); })
  .catch(() => {})
  .finally(() => setLoadingWorkouts((prev) => { const next = new Set(prev); next.delete(c.workout_id!); return next; }));
 }
 }, [completions]);

 const formatTime = (timestamp: string) => {
 try {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ko }).replace('약 ', '');
 } catch { return ''; }
 };

 return (
 <div className="flex flex-col h-full min-h-0">
  {/* Card header */}
  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line flex-shrink-0">
  <CardTypeBadge type={cardType as any} />
  <div className="flex-1 min-w-0">
   <span className="text-sm font-medium text-content-primary truncate">{cardTitle}</span>
   <div className="flex items-center gap-2 text-xs text-content-tertiary">
   <span>{completions.length}명 제출</span>
   {scoreValue > 0 && (
    <span className="font-medium text-accent">{scoreValue} score</span>
   )}
   </div>
  </div>
  </div>

  {/* All member completions */}
  <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line">
  {completions.map((completion) => {
   const user = completion.users;
   const vStatus = verificationStatusConfig[completion.verification_status];
   const workout = completion.workout_id ? workoutDetails[completion.workout_id] : null;
   const isLoadingWorkout = completion.workout_id ? loadingWorkouts.has(completion.workout_id) : false;

   return (
   <div key={completion.id} className="px-4 py-4">
    {/* Member header */}
    <div className="flex items-center gap-2 mb-3">
    {user?.profile_image_url ? (
     <img src={user.profile_image_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
    ) : (
     <div className="w-6 h-6 rounded-full bg-surface-raised flex items-center justify-center flex-shrink-0">
     <span className="text-[9px] font-medium text-content-tertiary">{user?.name?.charAt(0) || '?'}</span>
     </div>
    )}
    <span className="text-[13px] font-medium text-content-primary">{user?.name || '알 수 없음'}</span>
    {completion.verification_status === 'approved' || completion.verification_status === 'auto_approved' ? (
     <span className="flex-shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-status-success text-white" title={vStatus.label}>
     <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
     </svg>
     </span>
    ) : (
     <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full ${vStatus.className}`}>{vStatus.label}</span>
    )}
    <span className="text-[11px] text-content-disabled ml-auto">{formatTime(completion.completed_at)}</span>
    </div>

    {/* Workout detail or check-only */}
    {!completion.workout_id ? (
    <div className="flex items-center gap-1.5 text-sm text-content-tertiary">
     <svg className="w-5 h-5 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
     </svg>
     체크 완료
    </div>
    ) : isLoadingWorkout ? (
    <div className="flex items-center justify-center py-4">
     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
    </div>
    ) : (
    <>
     {workout && <WorkoutCard workout={workout} />}
     <div className="my-2">
      <WorkoutReactionBar workoutId={completion.workout_id!} />
     </div>
     <WorkoutCommentSection
     workoutId={completion.workout_id}
     challengeId={challengeId}
     coachInfo={coachInfo}
     />
    </>
    )}
   </div>
   );
  })}
  </div>
 </div>
 );
}

// ── Modal wrapper (mobile) ──
export function ProgramSubmissionsDetail({
 group,
 challengeId,
 onClose,
 onReviewDone,
}: ProgramSubmissionsDetailProps) {
 const [reviewing, setReviewing] = useState<string | null>(null);
 const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
 const [workoutDetails, setWorkoutDetails] = useState<Record<string, WorkoutDetail>>({});
 const [loadingWorkouts, setLoadingWorkouts] = useState<Set<string>>(new Set());

 // Fetch coach identity
 useEffect(() => {
 const fetchCoach = async () => {
  try {
  const res = await fetch('/api/coach-identity');
  if (res.ok) {
   const data = await res.json();
   setCoachInfo({
   userId: data.userId,
   name: data.name,
   profileImageUrl: data.profileImageUrl,
   });
  }
  } catch {
  // ignore
  }
 };
 fetchCoach();
 }, []);

 // Fetch workout details for completions that have workout_id
 useEffect(() => {
 const workoutIds = group.completions
  .filter((c) => c.workout_id && !workoutDetails[c.workout_id])
  .map((c) => c.workout_id!);

 const uniqueIds = [...new Set(workoutIds)];
 if (uniqueIds.length === 0) return;

 for (const wid of uniqueIds) {
  if (loadingWorkouts.has(wid)) continue;
  setLoadingWorkouts((prev) => new Set(prev).add(wid));
  fetchWorkoutDetail(wid);
 }
 }, [group.completions]);

 const fetchWorkoutDetail = async (workoutId: string) => {
 try {
  const res = await fetch(`/api/workouts/user-detail?type=workout&workoutId=${workoutId}`);
  if (res.ok) {
  const data = await res.json();
  if (data) {
   setWorkoutDetails((prev) => ({ ...prev, [workoutId]: data }));
  }
  }
 } catch {
  // ignore
 }
 };

 const handleReview = async (completionId: string, status: 'approved' | 'rejected') => {
 setReviewing(completionId);
 try {
  const res = await fetch('/api/daily-program-completions', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
   id: completionId,
   verification_status: status,
  }),
  });
  if (res.ok) {
  onReviewDone();
  }
 } catch (error) {
  console.error('Failed to review:', error);
 } finally {
  setReviewing(null);
 }
 };

 const handleEsc = useCallback(
 (e: KeyboardEvent) => {
  if (e.key === 'Escape') onClose();
 },
 [onClose]
 );

 useEffect(() => {
 document.addEventListener('keydown', handleEsc);
 return () => document.removeEventListener('keydown', handleEsc);
 }, [handleEsc]);

 // Group completions by card
 const cardGroups = groupCompletionsByCard(group.completions);

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

 return (
 <>
  {/* Backdrop */}
  <div
  className="fixed inset-0 bg-black/40 z-[110] animate-in fade-in duration-200"
  onClick={onClose}
  />

  {/* Modal */}
  <div className="fixed inset-0 z-[111] flex items-center justify-center p-4 sm:items-end sm:p-0">
  <div
   className="relative w-full max-w-2xl max-h-[85vh] bg-surface rounded-2xl shadow-elevation-3 flex flex-col animate-in fade-in zoom-in-95 duration-200 sm:max-w-none sm:max-h-[95dvh] sm:rounded-b-none sm:rounded-t-2xl sm:animate-in sm:slide-in-from-bottom sm:zoom-in-100 sm:fade-in"
   onClick={(e) => e.stopPropagation()}
  >
   {/* Mobile drag handle */}
   <div className="hidden sm:flex justify-center pt-2 pb-0">
   <div className="w-10 h-1 rounded-full bg-content-disabled/30" />
   </div>

   {/* Header */}
   <div className="flex items-center justify-between px-5 sm:px-4 py-3 sm:py-2.5 border-b border-line">
   <div className="flex items-center gap-2 min-w-0">
    <h2 className="text-body font-semibold text-content-primary truncate">
    {formatDate(group.program_date)}
    {group.program_title && ` - ${group.program_title}`}
    </h2>
    <ProgramStatusBadge status={group.program_status} />
   </div>
   <button
    onClick={onClose}
    className="flex-shrink-0 p-1 rounded-lg hover:bg-surface-raised transition-colors"
   >
    <svg className="w-5 h-5 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
   </button>
   </div>

   {/* Summary */}
   <div className="flex items-center gap-3 px-5 sm:px-4 py-2.5 border-b border-line text-xs text-content-tertiary">
   <span className="inline-flex items-center gap-1">
    제출
    <span className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full bg-status-success text-white">
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

   {/* Content */}
   <div className="flex-1 overflow-y-auto px-5 sm:px-4 py-4 space-y-6">
   {cardGroups.length === 0 ? (
    <div className="text-center text-content-tertiary text-sm py-8">
    제출 내역이 없습니다
    </div>
   ) : (
    cardGroups.map((cardGroup) => (
    <div key={cardGroup.cardId}>
     {/* Card header */}
     <div className="flex items-center gap-2 mb-3">
     <CardTypeBadge type={cardGroup.cardType} />
     <span className="text-sm font-medium text-content-primary">
      {cardGroup.cardTitle}
     </span>
     </div>

     {/* User submissions */}
     <div className="space-y-3">
     {cardGroup.completions.map((completion) => {
      const user = completion.users;
      const status = verificationStatusConfig[completion.verification_status];
      const workout = completion.workout_id
      ? workoutDetails[completion.workout_id]
      : null;

      return (
      <div
       key={completion.id}
       className="border border-line rounded-xl p-3"
      >
       {/* User info row */}
       <div className="flex items-center gap-2.5">
       {user?.profile_image_url ? (
        <img
        src={user.profile_image_url}
        alt=""
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        />
       ) : (
        <div className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-content-disabled" fill="currentColor" viewBox="0 0 24 24">
         <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        </div>
       )}
       <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-content-primary truncate">
         {user?.name || user?.username || '알 수 없음'}
        </span>
        {completion.verification_status === 'approved' || completion.verification_status === 'auto_approved' ? (
         <span
         className="flex-shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-status-success text-white"
         title={status.label}
         >
         <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
         </svg>
         </span>
        ) : (
         <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full ${status.className}`}>
         {status.label}
         </span>
        )}
        </div>
        <span className="text-xs text-content-tertiary">
        {formatTime(completion.completed_at)}
        </span>
       </div>

       {/* Review buttons for pending */}
       {completion.verification_status === 'pending' && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
         onClick={() => handleReview(completion.id, 'approved')}
         disabled={reviewing === completion.id}
         className="w-7 h-7 rounded-full bg-status-success text-white flex items-center justify-center hover:bg-status-success/80 transition-colors disabled:opacity-50"
         title="승인"
        >
         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
         </svg>
        </button>
        <button
         onClick={() => handleReview(completion.id, 'rejected')}
         disabled={reviewing === completion.id}
         className="w-7 h-7 rounded-full bg-status-error text-white flex items-center justify-center hover:bg-status-error/80 transition-colors disabled:opacity-50"
         title="거부"
        >
         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
         </svg>
        </button>
        </div>
       )}
       </div>

       {/* Workout detail (if linked) */}
       {completion.workout_id && workout && (
       <div className="mt-3 pt-3 border-t border-line-subtle">
        <WorkoutCard workout={workout} />
       </div>
       )}

       {/* Reactions */}
       {completion.workout_id && (
       <div className="my-2">
        <WorkoutReactionBar workoutId={completion.workout_id} />
       </div>
       )}

       {/* Workout comment section (if workout linked) */}
       {completion.workout_id && (
       <WorkoutCommentSection
        workoutId={completion.workout_id}
        challengeId={challengeId}
        coachInfo={coachInfo}
       />
       )}

       {/* No workout - just check mark */}
       {!completion.workout_id && (
       <div className="mt-2 flex items-center gap-1.5 text-xs text-content-tertiary">
        <svg className="w-4 h-4 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        체크 완료
       </div>
       )}
      </div>
      );
     })}
     </div>
    </div>
    ))
   )}
   </div>
  </div>
  </div>
 </>
 );
}

// Helper: group completions by card
export function groupCompletionsByCard(completions: DailyProgramCompletion[]) {
 const map = new Map<
 string,
 {
  cardId: string;
  cardTitle: string;
  cardType: any;
  sortOrder: number;
  scoreValue: number;
  completions: DailyProgramCompletion[];
 }
 >();

 for (const c of completions) {
 const card = c.daily_program_cards;
 if (!card) continue;

 const key = card.id;
 if (!map.has(key)) {
  map.set(key, {
  cardId: card.id,
  cardTitle: card.title,
  cardType: card.card_type,
  sortOrder: (card as any).sort_order ?? 0,
  scoreValue: card.score_value ?? 0,
  completions: [],
  });
 }
 map.get(key)!.completions.push(c);
 }

 return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

// Workout detail card component
function WorkoutCard({ workout }: { workout: WorkoutDetail }) {
 const category = workout.workout_categories?.name_ko;
 const zone = workout.workout_categories?.workout_types?.name;

 // Pace: pace_per_km 우선, 없으면 duration/distance로 계산
 let pace: string | null = null;
 if (workout.pace_per_km) {
 const paceMin = Math.floor(workout.pace_per_km);
 const paceSec = Math.round((workout.pace_per_km - paceMin) * 60);
 pace = `${paceMin}'${paceSec.toString().padStart(2, '0')}"`;
 } else if (workout.distance && workout.distance > 0 && workout.duration_minutes && workout.duration_minutes > 0) {
 const paceMinutes = workout.duration_minutes / workout.distance;
 const paceMin = Math.floor(paceMinutes);
 const paceSec = Math.round((paceMinutes - paceMin) * 60);
 pace = `${paceMin}'${paceSec.toString().padStart(2, '0')}"`;
 }

 return (
 <div className="bg-surface-raised/50 rounded-lg p-3 space-y-2">
  <div className="flex items-center gap-2 flex-wrap">
  <span className="text-sm font-medium text-content-primary">
   {workout.title}
  </span>
  {zone && (
   <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
   {zone}
   </span>
  )}
  {category && (
   <span className="text-[12px] text-content-tertiary">{category}</span>
  )}
  </div>

  {/* Stats grid */}
  <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-xs divide-x divide-line">
  <div className="space-y-2 pr-3">
   {workout.duration_minutes != null && workout.duration_minutes > 0 && (
   <div className="flex justify-between py-1.5 border-b border-line last:border-b-0">
    <span className="text-[12px] text-content-tertiary">시간</span>
    <span className="text-content-secondary font-medium">{workout.duration_minutes}<span className="text-[12px]">분</span></span>
   </div>
   )}
   {workout.distance != null && workout.distance > 0 && (
   <div className="flex justify-between py-1.5 border-b border-line last:border-b-0">
    <span className="text-[12px] text-content-tertiary">거리</span>
    <span className="text-content-secondary font-medium">{workout.distance.toFixed(2)}<span className="text-[12px]">km</span></span>
   </div>
   )}
   {pace && (
   <div className="flex justify-between py-1.5 border-b border-line last:border-b-0">
    <span className="text-[12px] text-content-tertiary">페이스</span>
    <span className="text-content-secondary font-medium">{pace}<span className="text-[12px]">/km</span></span>
   </div>
   )}
   {workout.calories != null && workout.calories > 0 && (
   <div className="flex justify-between py-1.5 border-b border-line last:border-b-0">
    <span className="text-[12px] text-content-tertiary">칼로리</span>
    <span className="text-content-secondary font-medium">{Math.round(workout.calories)}<span className="text-[12px]">kcal</span></span>
   </div>
   )}
   {workout.points != null && workout.points > 0 && (
   <div className="flex justify-between py-1.5">
    <span className="text-[12px] text-content-tertiary">운동량(Fit Point)</span>
    <span className="text-content-secondary font-medium">{workout.points}<span className="text-[12px]">pt</span></span>
   </div>
   )}
  </div>
  <div className="space-y-2 pl-3">
   {workout.intensity != null && (
   <div className="flex justify-between py-1.5 border-b border-line last:border-b-0">
    <span className="text-[12px] text-content-tertiary">Zone</span>
    <span className="text-content-secondary font-medium">{workout.intensity}</span>
   </div>
   )}
   {workout.avg_heart_rate != null && workout.avg_heart_rate > 0 && (
   <div className="flex justify-between py-1.5 border-b border-line last:border-b-0">
    <span className="text-[12px] text-content-tertiary">평균 심박수</span>
    <span className="text-content-secondary font-medium">{workout.avg_heart_rate}<span className="text-[12px]">bpm</span></span>
   </div>
   )}
   {workout.max_heart_rate != null && workout.max_heart_rate > 0 && (
   <div className="flex justify-between py-1.5">
    <span className="text-[12px] text-content-tertiary">최대 심박수</span>
    <span className="text-content-secondary font-medium">{workout.max_heart_rate}<span className="text-[12px]">bpm</span></span>
   </div>
   )}
  </div>
  </div>

  {/* Note */}
  {workout.note && (
  <div className="pt-1">
   <p className="text-xs text-content-secondary whitespace-pre-wrap break-words leading-relaxed">
   {workout.note}
   </p>
  </div>
  )}

  {/* Photos */}
  {workout.photos && workout.photos.length > 0 && (
  <div className="flex gap-1.5 overflow-x-auto pt-1">
   {workout.photos.map((url, i) => (
   <img
    key={i}
    src={url}
    alt=""
    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
   />
   ))}
  </div>
  )}
 </div>
 );
}
