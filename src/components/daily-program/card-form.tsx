'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { DailyProgramCard, CardType, ProgramStatus, TiptapDocument } from '@/types/daily-program';
import { TiptapEditor } from './tiptap-editor';

const CARD_TYPES: { value: CardType; label: string }[] = [
 { value: 'workout', label: 'WOD' },
 { value: 'warmup', label: 'Warm-up' },
 { value: 'cooldown', label: 'Cool-down' },
 { value: 'strength', label: 'Strength' },
 { value: 'skill', label: 'Skill' },
 { value: 'custom', label: 'Custom' },
];

export interface PendingCardData {
 title: string;
 card_type: CardType;
 body: TiptapDocument | null;
 coaching_tips: string | null;
 has_check: boolean;
 requires_approval: boolean;
 score_value: number;
}

interface CardFormProps {
 card?: DailyProgramCard | null;
 programId: string;
 programTitle?: string;
 programStatus?: ProgramStatus;
 challengeId?: string;
 date?: string;
 onSave: () => void;
 onCancel: () => void;
 hideCheckHint?: boolean;
 onDismissCheckHint?: () => void;
 onDirtyChange?: (dirty: boolean) => void;
 onLocalSave?: (data: PendingCardData) => void;
}

export function CardForm({ card, programId, programTitle, programStatus, challengeId, date, onSave, onCancel, hideCheckHint, onDismissCheckHint, onDirtyChange, onLocalSave }: CardFormProps) {
 const [title, setTitle] = useState(card?.title ?? '');
 const [cardType, setCardType] = useState<CardType>(card?.card_type ?? 'workout');
 const [body, setBody] = useState<TiptapDocument | null>(card?.body ?? null);
 const [coachingTips, setCoachingTips] = useState(card?.coaching_tips ?? '');
 const [hasCheck, setHasCheck] = useState(card?.has_check ?? true);
 const [requiresApproval, setRequiresApproval] = useState(card?.requires_approval ?? false);
 const [scoreValue, setScoreValue] = useState(card?.score_value ?? 0);
 const [saving, setSaving] = useState(false);

 // Track initial values for dirty check
 const initialValues = useRef({
 title: card?.title ?? '',
 cardType: card?.card_type ?? ('workout' as CardType),
 body: card?.body ?? null,
 coachingTips: card?.coaching_tips ?? '',
 hasCheck: card?.has_check ?? true,
 requiresApproval: card?.requires_approval ?? false,
 scoreValue: card?.score_value ?? 0,
 programTitle: programTitle ?? '',
 programStatus: programStatus ?? ('draft' as ProgramStatus),
 });

 useEffect(() => {
 if (card) {
 setTitle(card.title);
 setCardType(card.card_type);
 setBody(card.body);
 setCoachingTips(card.coaching_tips || '');
 setHasCheck(card.has_check);
 setRequiresApproval(card.requires_approval);
 setScoreValue(card.score_value);
 initialValues.current = {
 title: card.title,
 cardType: card.card_type,
 body: card.body,
 coachingTips: card.coaching_tips ?? '',
 hasCheck: card.has_check,
 requiresApproval: card.requires_approval,
 scoreValue: card.score_value,
 programTitle: programTitle ?? '',
 programStatus: programStatus ?? ('draft' as ProgramStatus),
 };
 }
 }, [card]);

 const hasChanges = useMemo(() => {
 const iv = initialValues.current;
 if (!card) {
 // Create mode: dirty when title is filled
 return title.trim().length > 0;
 }
 // Edit mode: compare against initial values
 return (
 title !== iv.title ||
 cardType !== iv.cardType ||
 JSON.stringify(body) !== JSON.stringify(iv.body) ||
 coachingTips !== iv.coachingTips ||
 hasCheck !== iv.hasCheck ||
 requiresApproval !== iv.requiresApproval ||
 scoreValue !== iv.scoreValue ||
 (programTitle ?? '') !== iv.programTitle ||
 (programStatus ?? 'draft') !== iv.programStatus
 );
 }, [card, title, cardType, body, coachingTips, hasCheck, requiresApproval, scoreValue, programTitle, programStatus]);

 useEffect(() => {
 onDirtyChange?.(hasChanges);
 }, [hasChanges, onDirtyChange]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim()) return;

 if (onLocalSave) {
 onLocalSave({
 title: title.trim(),
 card_type: cardType,
 body,
 coaching_tips: coachingTips || null,
 has_check: hasCheck,
 requires_approval: requiresApproval,
 score_value: scoreValue,
 });
 onSave();
 return;
 }

 setSaving(true);
 try {
 const payload = {
 title: title.trim(),
 card_type: cardType,
 body,
 coaching_tips: coachingTips || null,
 has_check: hasCheck,
 requires_approval: requiresApproval,
 score_value: scoreValue,
 };

 // Update program title and status if changed
 if (programId && (programTitle !== undefined || programStatus !== undefined)) {
 await fetch('/api/daily-programs', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id: programId, title: programTitle, status: programStatus }),
 });
 }

 if (card) {
 // Update
 await fetch('/api/daily-program-cards', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id: card.id, ...payload }),
 });
 } else {
 // Create - auto-create program if needed
 let targetProgramId = programId;
 if (!targetProgramId && challengeId && date) {
 const progRes = await fetch('/api/daily-programs', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 challenge_id: challengeId,
 date,
 title: programTitle ?? '',
 description: null,
 status: programStatus ?? 'draft',
 show_on_main: true,
 target_group_ids: [],
 }),
 });
 if (!progRes.ok) throw new Error('Failed to create program');
 const newProgram = await progRes.json();
 targetProgramId = newProgram.id;
 }

 await fetch('/api/daily-program-cards', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ program_id: targetProgramId, sort_order: 999, ...payload }),
 });
 }

 onSave();
 } catch (error) {
 console.error('Failed to save card:', error);
 } finally {
 setSaving(false);
 }
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-3 bg-surface-raised/50 rounded-lg p-4 sm:p-3 border border-line">
 <div>
 <label className="block text-body font-medium text-content-secondary mb-1">
 카드 타이틀
 </label>
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="카드 타이틀 *"
 required
 className="flex-1 px-3 py-1.5 sm:py-2 text-body border border-line rounded-md bg-surface text-content-primary dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 <select
 value={cardType}
 onChange={(e) => setCardType(e.target.value as CardType)}
 className="px-2 py-1.5 sm:py-2 text-body border border-line rounded-md bg-surface text-content-primary"
 >
 {CARD_TYPES.map((t) => (
 <option key={t.value} value={t.value}>
 {t.label}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Tiptap Editor for body */}
 <div>
 <label className="block text-body font-medium text-content-secondary mb-1">
 본문 (리치 텍스트)
 </label>
 <TiptapEditor content={body} onChange={setBody} />
 </div>

 {/* Coaching Tips */}
 <div>
 <label className="block text-body font-medium text-content-secondary mb-1">
 코칭 팁
 </label>
 <textarea
 value={coachingTips}
 onChange={(e) => setCoachingTips(e.target.value)}
 placeholder="코칭 팁 (선택)"
 rows={2}
 className="w-full px-3 py-1.5 text-body border border-line rounded-md bg-surface text-content-primary dark:text-white resize-none"
 />
 </div>

 {/* Options row */}
 <div className="flex flex-wrap items-center gap-4 sm:flex-col sm:items-start sm:gap-2.5">
 <label className="flex items-center gap-1.5 text-body text-content-secondary">
 <input
 type="checkbox"
 checked={hasCheck}
 onChange={(e) => setHasCheck(e.target.checked)}
 className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px] rounded border-line text-blue-600"
 />
 멤버가 완료시 직접 체크
 </label>
 <label className={`flex items-center gap-1.5 text-body ${hasCheck ? 'text-content-secondary' : 'text-content-disabled'}`}>
 <input
 type="checkbox"
 checked={requiresApproval}
 onChange={(e) => setRequiresApproval(e.target.checked)}
 disabled={!hasCheck}
 className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px] rounded border-line text-blue-600 disabled:opacity-50"
 />
 승인 필요
 </label>
 <div className="flex items-center gap-1.5">
 <label className={`text-body ${hasCheck ? 'text-content-secondary' : 'text-content-disabled'}`}>점수</label>
 <input
 type="number"
 value={scoreValue}
 onChange={(e) => setScoreValue(parseInt(e.target.value) || 0)}
 min={0}
 disabled={!hasCheck}
 className="w-16 px-2 py-1 sm:py-1.5 text-body border border-line rounded-md bg-surface text-content-primary dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
 />
 </div>
 </div>
 {!hasCheck && !hideCheckHint && (
 <div className="flex items-center justify-between gap-2 text-body text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
 <span>이 카드는 안내용으로만 표시됩니다. 멤버가 완료 체크를 할 수 없으며, 점수와 승인이 적용되지 않습니다.</span>
 {onDismissCheckHint && (
 <button type="button" onClick={onDismissCheckHint} className="flex-shrink-0 text-amber-400 hover:text-amber-300 transition-colors">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 )}
 </div>
 )}

 {/* Buttons */}
 <div className="flex items-center justify-end gap-2 pt-1 sm:sticky sm:bottom-0 sm:bg-surface-raised/50 sm:pb-1 sm:-mx-3 sm:px-3 sm:pt-3 sm:border-t sm:border-line">
 <button
 type="button"
 onClick={onCancel}
 className="px-3 py-1.5 sm:py-2 sm:px-4 text-body border border-line text-content-secondary rounded-md hover:bg-surface-raised transition-colors"
 >
 취소
 </button>
 <button
 type="submit"
 disabled={saving || !hasChanges}
 className="px-3 py-1.5 sm:py-2 sm:px-4 sm:flex-1 text-body bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
 >
 {saving ? '저장 중...' : '저장'}
 </button>
 </div>
 </form>
 );
}
