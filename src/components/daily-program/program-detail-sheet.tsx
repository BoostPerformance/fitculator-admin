'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { DailyProgram, DailyProgramCard, ChallengeGroup } from '@/types/daily-program';
import { ProgramForm } from './program-form';
import { ProgramStatusActions } from './program-status-actions';
import { CardList } from './card-list';
import { GroupSelector } from './group-selector';
import { ProgramCopyDialog } from './program-copy-dialog';

interface ProgramDetailSheetProps {
 open: boolean;
 onClose: () => void;
 program: DailyProgram | null;
 challengeId: string;
 initialDate: string | null;
 groups: ChallengeGroup[];
 onSaved: () => void;
}

export function ProgramDetailSheet({
 open,
 onClose,
 program,
 challengeId,
 initialDate,
 groups,
 onSaved,
}: ProgramDetailSheetProps) {
 const [currentProgram, setCurrentProgram] = useState<DailyProgram | null>(null);
 const [cards, setCards] = useState<DailyProgramCard[]>([]);
 const [saving, setSaving] = useState(false);
 const [copyDialogOpen, setCopyDialogOpen] = useState(false);

 const isNew = !program;

 useEffect(() => {
 if (program) {
 setCurrentProgram(program);
 setCards(program.daily_program_cards || []);
 } else {
 setCurrentProgram(null);
 setCards([]);
 }
 }, [program]);

 const refreshProgram = useCallback(async (programId: string) => {
 try {
 const res = await fetch(`/api/daily-programs?id=${programId}`);
 if (res.ok) {
 const data = await res.json();
 setCurrentProgram(data);
 setCards(data.daily_program_cards || []);
 }
 } catch (error) {
 console.error('Failed to refresh program:', error);
 }
 }, []);

 const handleCreate = async (data: {
 title: string;
 description?: string;
 date: string;
 show_on_main: boolean;
 target_group_ids: string[];
 }) => {
 setSaving(true);
 try {
 const res = await fetch('/api/daily-programs', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 challenge_id: challengeId,
 ...data,
 }),
 });

 if (res.ok) {
 const newProgram = await res.json();
 await refreshProgram(newProgram.id);
 onSaved();
 }
 } catch (error) {
 console.error('Failed to create program:', error);
 } finally {
 setSaving(false);
 }
 };

 const handleUpdate = async (data: {
 title: string;
 description?: string;
 date: string;
 show_on_main: boolean;
 target_group_ids: string[];
 }) => {
 if (!currentProgram) return;
 setSaving(true);
 try {
 const res = await fetch('/api/daily-programs', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 id: currentProgram.id,
 ...data,
 }),
 });

 if (res.ok) {
 await refreshProgram(currentProgram.id);
 onSaved();
 }
 } catch (error) {
 console.error('Failed to update program:', error);
 } finally {
 setSaving(false);
 }
 };

 const handleStatusChange = async (newStatus: string) => {
 if (!currentProgram) return;
 try {
 const res = await fetch('/api/daily-programs', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id: currentProgram.id, status: newStatus }),
 });

 if (res.ok) {
 await refreshProgram(currentProgram.id);
 onSaved();
 }
 } catch (error) {
 console.error('Failed to update status:', error);
 }
 };

 const handleDelete = async () => {
 if (!currentProgram) return;
 if (!confirm('이 프로그램을 삭제하시겠습니까? 모든 카드와 제출 기록이 함께 삭제됩니다.')) return;

 try {
 const res = await fetch(`/api/daily-programs?id=${currentProgram.id}`, {
 method: 'DELETE',
 });

 if (res.ok) {
 onSaved();
 onClose();
 }
 } catch (error) {
 console.error('Failed to delete program:', error);
 }
 };

 const handleCardsChanged = () => {
 if (currentProgram) {
 refreshProgram(currentProgram.id);
 }
 };

 if (!open) return null;

 return (
 <>
 {/* Backdrop */}
 <div
 className="fixed inset-0 bg-black/30 z-40"
 onClick={onClose}
 />

 {/* Sheet */}
 <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-surface shadow-xl overflow-y-auto animate-in slide-in-from-right duration-300">
 {/* Header */}
 <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 flex items-center justify-between z-10">
 <h2 className="text-lg font-semibold text-content-primary">
 {isNew && !currentProgram ? '새 프로그램' : '프로그램 편집'}
 </h2>
 <button
 onClick={onClose}
 className="p-1.5 rounded-md hover:bg-surface-raised transition-colors"
 >
 <svg className="w-5 h-5 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 <div className="px-6 py-4 space-y-6">
 {/* Program Form */}
 <ProgramForm
 program={currentProgram}
 initialDate={initialDate}
 onSubmit={currentProgram ? handleUpdate : handleCreate}
 saving={saving}
 />

 {/* Group Selector */}
 {groups.length > 0 && (
 <GroupSelector
 groups={groups}
 selectedGroupIds={
 currentProgram?.daily_program_target_groups?.map((g) => g.group_id) || []
 }
 onSave={async (groupIds) => {
 if (currentProgram) {
 await fetch('/api/daily-programs', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 id: currentProgram.id,
 target_group_ids: groupIds,
 }),
 });
 await refreshProgram(currentProgram.id);
 }
 }}
 />
 )}

 {/* Cards Section (only for existing programs) */}
 {currentProgram && (
 <CardList
 programId={currentProgram.id}
 cards={cards}
 onCardsChanged={handleCardsChanged}
 />
 )}

 {/* Status Actions & Delete */}
 {currentProgram && (
 <div className="border-t border-line pt-4 space-y-3">
 <ProgramStatusActions
 status={currentProgram.status}
 onStatusChange={handleStatusChange}
 />

 <div className="flex items-center gap-2">
 <button
 onClick={() => setCopyDialogOpen(true)}
 className="px-3 py-1.5 text-sm border border-line rounded-md hover:bg-surface-raised text-content-secondary transition-colors"
 >
 복제
 </button>
 <button
 onClick={handleDelete}
 className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-800 rounded-md hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
 >
 삭제
 </button>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Copy Dialog */}
 {currentProgram && (
 <ProgramCopyDialog
 open={copyDialogOpen}
 onClose={() => setCopyDialogOpen(false)}
 program={currentProgram}
 challengeId={challengeId}
 onCopied={() => {
 onSaved();
 setCopyDialogOpen(false);
 }}
 />
 )}
 </>
 );
}
