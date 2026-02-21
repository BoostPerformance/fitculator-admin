'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { DailyProgram, DailyProgramCard, ProgramStatus } from '@/types/daily-program';
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
 onCardClick?: (card: DailyProgramCard, program: DailyProgram) => void;
 compact?: boolean;
}

export function CalendarProgramChip({ program, onClick, onCardClick, compact = false }: CalendarProgramChipProps) {
 const cards = program.daily_program_cards ?? [];

 const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
 id: program.id,
 });

 return (
 <div
 ref={setNodeRef}
 {...listeners}
 {...attributes}
 onClick={(e) => {
 e.stopPropagation();
 onClick(program);
 }}
 className={`w-full cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
 isDragging ? 'opacity-40' : ''
 }`}
 title={program.title || '제목 없음'}
 >
 {/* Program header */}
 <div className="flex items-center gap-1.5 mb-1">
 <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusIndicator[program.status]}`} />
 <span className="text-[11px] font-medium text-content-secondary truncate">
 {program.title || '제목 없음'}
 </span>
 <span className="text-[9px] text-content-disabled flex-shrink-0">
 {statusLabel[program.status]}
 </span>
 </div>

 {/* Cards list - app style */}
 {cards.length > 0 && (
 <div className={`space-y-1 ${compact ? 'max-h-[120px] overflow-hidden' : ''}`}>
 {cards.map((card) => (
 <CalendarCardPreview
 key={card.id}
 card={card}
 expanded={!compact}
 onClick={onCardClick ? (c) => onCardClick(c, program) : undefined}
 />
 ))}
 {compact && cards.length > 2 && (
 <div className="text-[9px] text-content-disabled text-center py-0.5">
 +{cards.length - 2}개 카드
 </div>
 )}
 </div>
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
