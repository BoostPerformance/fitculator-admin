'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { DailyProgram, DailyProgramCard, ChallengeGroup, ProgramStatus } from '@/types/daily-program';
import { ProgramForm } from './program-form';
import { CardList } from './card-list';
import { CardForm, type PendingCardData } from './card-form';
import { CardTypeBadge } from './card-type-badge';
import { ProgramCopyDialog } from './program-copy-dialog';

interface ProgramModalProps {
 open: boolean;
 onClose: () => void;
 program: DailyProgram | null;
 challengeId: string;
 initialDate: string | null;
 groups: ChallengeGroup[];
 onSaved: () => void;
}

export function ProgramModal({
 open,
 onClose,
 program,
 challengeId,
 initialDate,
 groups,
 onSaved,
}: ProgramModalProps) {
 const isNew = !program;

 const [currentProgram, setCurrentProgram] = useState<DailyProgram | null>(null);
 const [cards, setCards] = useState<DailyProgramCard[]>([]);
 const [saving, setSaving] = useState(false);
 const [copyDialogOpen, setCopyDialogOpen] = useState(false);

 // Create-mode state
 const [pendingCards, setPendingCards] = useState<PendingCardData[]>([]);
 const [addingPendingCard, setAddingPendingCard] = useState(false);
 const formRef = useRef<HTMLFormElement | null>(null);

 // Dirty tracking
 const [localStatus, setLocalStatus] = useState<ProgramStatus>('published');
 const [formDirty, setFormDirty] = useState(false);
 const [cardsDirty, setCardsDirty] = useState(false);

 useEffect(() => {
  if (program) {
   setCurrentProgram(program);
   setCards(program.daily_program_cards || []);
  } else {
   setCurrentProgram(null);
   setCards([]);
  }
  setPendingCards([]);
  setAddingPendingCard(false);
  setSaving(false);
  setCopyDialogOpen(false);
  setLocalStatus(program?.status || 'published');
  setFormDirty(false);
  setCardsDirty(false);
 }, [program, open]);

 const handleEsc = useCallback(
  (e: KeyboardEvent) => {
   if (e.key === 'Escape') onClose();
  },
  [onClose]
 );

 useEffect(() => {
  if (open) {
   document.addEventListener('keydown', handleEsc);
   return () => document.removeEventListener('keydown', handleEsc);
  }
 }, [open, handleEsc]);

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
     status: localStatus,
    }),
   });

   if (res.ok) {
    const newProgram = await res.json();

    for (let i = 0; i < pendingCards.length; i++) {
     const cardData = pendingCards[i];
     await fetch('/api/daily-program-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
       program_id: newProgram.id,
       sort_order: i,
       ...cardData,
      }),
     });
    }

    setPendingCards([]);
    setAddingPendingCard(false);
    onSaved();
    onClose();
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
     status: localStatus,
    }),
   });

   if (res.ok) {
    onSaved();
    onClose();
   }
  } catch (error) {
   console.error('Failed to update program:', error);
  } finally {
   setSaving(false);
  }
 };

 const handleStatusChange = (newStatus: string) => {
  setLocalStatus(newStatus as ProgramStatus);
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

 const handleSubmitClick = () => {
  formRef.current?.requestSubmit();
 };

 const statusDirty = currentProgram ? localStatus !== program?.status : false;
 const hasChanges = isNew ? true : formDirty || statusDirty || cardsDirty;

 const statusColorMap: Record<ProgramStatus, string> = {
  draft: 'bg-yellow-400',
  published: 'bg-green-500',
  archived: 'bg-gray-400',
 };

 if (!open) return null;

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
     className="relative w-full max-w-3xl max-h-[85vh] bg-surface rounded-2xl shadow-elevation-3 flex flex-col animate-in fade-in zoom-in-95 duration-200 sm:max-w-none sm:max-h-[95dvh] sm:rounded-b-none sm:rounded-t-2xl sm:animate-in sm:slide-in-from-bottom sm:zoom-in-100 sm:fade-in"
     onClick={(e) => e.stopPropagation()}
    >
     {/* Mobile drag handle */}
     <div className="hidden sm:flex justify-center pt-2 pb-0">
      <div className="w-10 h-1 rounded-full bg-content-disabled/30" />
     </div>

     {/* Header */}
     <div className="flex items-center justify-between px-5 sm:px-4 py-3 sm:py-2.5 border-b border-line">
      <h2 className="text-body sm:text-body font-semibold text-content-primary">
       {isNew && !currentProgram ? '새 프로그램' : '프로그램 편집'}
      </h2>
      <button
       onClick={onClose}
       className="p-1 rounded-lg hover:bg-surface-raised transition-colors"
      >
       <svg className="w-4 h-4 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
       </svg>
      </button>
     </div>

     {/* Two-column body (desktop) / single-column scroll (mobile) */}
     <div className="flex-1 min-h-0 grid grid-cols-[2fr_3fr] sm:grid-cols-1 sm:overflow-y-auto sm:overscroll-contain">
      {/* Left column: Program info */}
      <div className="overflow-y-auto overscroll-contain px-5 sm:px-4 py-4 space-y-3 sm:overflow-visible">
       <div className="bg-surface-raised/50 rounded-xl p-4 space-y-3">
        <h3 className="text-body font-semibold text-content-secondary">
         프로그램 정보
        </h3>
        <ProgramForm
         program={currentProgram}
         initialDate={initialDate}
         onSubmit={currentProgram ? handleUpdate : handleCreate}
         saving={saving}
         groups={groups}
         hideSubmitButton
         formRef={formRef}
         hideHeader
         onDirtyChange={setFormDirty}
         onGroupsChange={undefined}
        />
       </div>

       {/* Status dropdown */}
       <div className="bg-surface-raised/50 rounded-xl p-4 space-y-2">
        <h3 className="text-body font-semibold text-content-secondary">상태</h3>
        <div className="flex items-center gap-2">
         <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColorMap[localStatus]}`} />
         <select
          value={localStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="flex-1 px-2.5 py-1.5 border border-line rounded-md bg-surface text-content-primary dark:text-white text-body focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         >
          <option value="draft">초안</option>
          <option value="published">발행됨</option>
          <option value="archived">보관됨</option>
         </select>
        </div>
       </div>
      </div>

      {/* Right column: Cards + actions */}
      <div className="overflow-y-auto overscroll-contain border-l border-line sm:border-l-0 sm:border-t px-5 sm:px-4 py-4 space-y-3 sm:overflow-visible">
       {/* Cards section */}
       {currentProgram ? (
        <CardList
         programId={currentProgram.id}
         cards={cards}
         onCardsChanged={handleCardsChanged}
         onCardsReordered={(reordered) => { setCards(reordered); setCardsDirty(true); }}
        />
       ) : (
        <div className="space-y-2">
         <div className="flex items-center justify-between">
          <h3 className="text-body font-semibold text-content-secondary">
           카드 ({pendingCards.length})
          </h3>
          {!addingPendingCard && (
           <button
            type="button"
            onClick={() => setAddingPendingCard(true)}
            className="px-2 py-0.5 text-label-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
           >
            + 카드 추가
           </button>
          )}
         </div>

         {/* Pending card items */}
         {pendingCards.map((pc, index) => (
          <div
           key={index}
           className="flex items-center gap-2 px-2.5 py-2 border border-line rounded-lg bg-surface hover:bg-surface-raised/50 transition-colors group"
          >
           <CardTypeBadge type={pc.card_type} />
           <span className="flex-1 text-body font-medium text-content-primary dark:text-white truncate">
            {pc.title}
           </span>
           {pc.score_value > 0 && (
            <span className="text-label-xs text-blue-600 dark:text-blue-400 font-medium">
             {pc.score_value}점
            </span>
           )}
           <button
            type="button"
            onClick={() => setPendingCards((prev) => prev.filter((_, i) => i !== index))}
            className="p-0.5 rounded hover:bg-surface-raised text-content-disabled hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
           >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
           </button>
          </div>
         ))}

         {/* Add card form */}
         {addingPendingCard && (
          <CardForm
           programId=""
           onLocalSave={(data) => {
            setPendingCards((prev) => [...prev, data]);
           }}
           onSave={() => setAddingPendingCard(false)}
           onCancel={() => setAddingPendingCard(false)}
          />
         )}

         {/* Empty state */}
         {pendingCards.length === 0 && !addingPendingCard && (
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-line rounded-xl">
           <svg className="w-6 h-6 text-content-disabled mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
           </svg>
           <p className="text-body text-content-disabled">
            카드가 없습니다
           </p>
           <p className="text-label-xs text-content-disabled mt-0.5">
            카드를 추가해보세요
           </p>
          </div>
         )}
        </div>
       )}

      </div>
     </div>

     {/* Sticky footer */}
     <div className="border-t border-line px-5 sm:px-4 py-3 sm:py-2.5 flex items-center gap-3 bg-surface rounded-b-2xl sm:rounded-b-none">
      {/* Left: destructive actions (edit mode) */}
      {currentProgram ? (
       <div className="flex items-center gap-1.5">
        <button
         type="button"
         onClick={() => setCopyDialogOpen(true)}
         className="px-2.5 py-1.5 text-body text-content-tertiary hover:text-content-secondary hover:bg-surface-raised rounded-md transition-colors"
        >
         복제
        </button>
        <button
         type="button"
         onClick={handleDelete}
         className="px-2.5 py-1.5 text-body text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
        >
         삭제
        </button>
       </div>
      ) : (
       <div />
      )}

      {/* Right: main actions */}
      <div className="flex items-center gap-2 ml-auto">
       <button
        type="button"
        onClick={onClose}
        className="px-3 py-1.5 text-body font-medium text-content-secondary border border-line rounded-lg hover:bg-surface-raised transition-colors"
       >
        {currentProgram ? '닫기' : '취소'}
       </button>
       <div className="relative group">
        <button
         type="button"
         onClick={handleSubmitClick}
         disabled={saving || !hasChanges}
         className={`px-4 py-1.5 text-body font-semibold rounded-lg transition-colors ${saving || !hasChanges ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 pointer-events-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
         {saving ? '저장 중...' : currentProgram ? '저장' : '프로그램 생성'}
        </button>
        {!hasChanges && (
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[11px] text-white bg-gray-800 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          변경사항이 없습니다
         </div>
        )}
       </div>
      </div>
     </div>
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
