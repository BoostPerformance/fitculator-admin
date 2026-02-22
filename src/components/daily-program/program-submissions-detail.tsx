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

const verificationStatusConfig: Record<VerificationStatus, { label: string; className: string }> = {
 pending: { label: '대기', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
 approved: { label: '승인', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
 rejected: { label: '거부', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
 auto_approved: { label: '자동승인', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
};

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
 className="flex-shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-green-500 dark:bg-green-600 text-white"
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
 className="w-7 h-7 rounded-full bg-green-500 dark:bg-green-600 text-white flex items-center justify-center hover:bg-green-600 dark:hover:bg-green-500 transition-colors disabled:opacity-50"
 title="승인"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </button>
 <button
 onClick={() => handleReview(completion.id, 'rejected')}
 disabled={reviewing === completion.id}
 className="w-7 h-7 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-500 transition-colors disabled:opacity-50"
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
 <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
function groupCompletionsByCard(completions: DailyProgramCompletion[]) {
 const map = new Map<
 string,
 {
 cardId: string;
 cardTitle: string;
 cardType: any;
 sortOrder: number;
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
 <span className="text-[10px] text-content-tertiary">{category}</span>
 )}
 </div>

 <div className="flex items-center gap-3 text-xs text-content-secondary">
 {workout.duration_minutes != null && workout.duration_minutes > 0 && (
 <span>{workout.duration_minutes}분</span>
 )}
 {workout.distance != null && workout.distance > 0 && (
 <span>{(workout.distance / 1000).toFixed(2)}km</span>
 )}
 {workout.points != null && workout.points > 0 && (
 <span>{workout.points}점</span>
 )}
 {workout.intensity != null && (
 <span>강도 {workout.intensity}</span>
 )}
 </div>

 {workout.note && (
 <p className="text-xs text-content-secondary whitespace-pre-wrap break-words">
 {workout.note}
 </p>
 )}

 {workout.photos && workout.photos.length > 0 && (
 <div className="flex gap-1.5 overflow-x-auto">
 {workout.photos.map((url, i) => (
 <img
 key={i}
 src={url}
 alt=""
 className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
 />
 ))}
 </div>
 )}
 </div>
 );
}
