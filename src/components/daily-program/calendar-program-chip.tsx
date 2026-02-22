'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Pencil } from 'lucide-react';
import type { DailyProgram, ProgramStatus } from '@/types/daily-program';
import { CalendarCardPreview } from './calendar-card-preview';

const statusIndicator: Record<ProgramStatus, string> = {
 draft: 'bg-yellow-400',
 published: 'bg-green-400',
 archived: 'bg-neutral-400',
};

const statusLabel: Record<ProgramStatus, string> = {
 draft: '초안',
 published: '발행됨',
 archived: '보관됨',
};

interface CalendarProgramChipProps {
 program: DailyProgram;
 onClick: (program: DailyProgram) => void;
 compact?: boolean;
 disableDrag?: boolean;
}

export function CalendarProgramChip({ program, onClick, compact = false, disableDrag = false }: CalendarProgramChipProps) {
 const cards = program.daily_program_cards ?? [];

 const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
  id: program.id,
  disabled: disableDrag,
 });

 return (
  <div
   ref={setNodeRef}
   className={`w-full min-w-0 overflow-hidden transition-colors ${
    isDragging ? 'opacity-40' : ''
   }`}
   title={program.title || '제목 없음'}
  >
   {/* Program header — also serves as drag handle */}
   <div
    {...listeners}
    {...attributes}
    className="group/header flex items-center gap-1.5 mb-1 cursor-pointer rounded hover:bg-black/5 dark:hover:bg-white/5 -mx-1 px-1 py-0.5 transition-colors"
    onClick={(e) => {
     e.stopPropagation();
     onClick(program);
    }}
   >
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusIndicator[program.status]}`} />
    <span className="text-[11px] font-medium text-content-secondary truncate">
     {program.title || '제목 없음'}
    </span>
    <span className="text-[9px] text-content-disabled flex-shrink-0">
     {statusLabel[program.status]}
    </span>
    <Pencil className="ml-auto flex-shrink-0 w-3 h-3 text-content-disabled opacity-0 group-hover/header:opacity-100 transition-opacity" />
   </div>

   {/* Cards list — sortable preview */}
   {cards.length > 0 && (
    <SortableContext items={cards.map(c => `card:${c.id}`)} strategy={verticalListSortingStrategy}>
     <div className="space-y-1">
      {cards.map((card) => (
       <CalendarCardPreview
        key={card.id}
        card={card}
        expanded={!compact}
        sortDisabled={disableDrag}
        onClick={() => onClick(program)}
       />
      ))}
     </div>
    </SortableContext>
   )}

   {/* Empty state */}
   {cards.length === 0 && (
    <div className="rounded-lg border border-dashed border-line px-2 py-1.5">
     <span className="text-[10px] text-content-disabled">카드 없음</span>
    </div>
   )}
  </div>
 );
}
