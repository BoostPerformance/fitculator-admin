'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DailyProgramCard, CardType, TiptapNode } from '@/types/daily-program';

const cardTypeLabels: Record<CardType, string> = {
 workout: 'WOD',
 warmup: 'Warm-up',
 cooldown: 'Cool-down',
 strength: 'Strength',
 skill: 'Skill',
 custom: 'Custom',
};

/** Extract plain text from Tiptap JSON */
function extractText(nodes: TiptapNode[] | undefined): string {
 if (!nodes) return '';
 let text = '';
 for (const node of nodes) {
 if (node.text) {
 text += node.text;
 }
 if (node.content) {
 text += extractText(node.content);
 }
 if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'bulletList' || node.type === 'orderedList') {
 text += '\n';
 }
 }
 return text.trim();
}

interface CalendarCardPreviewProps {
 card: DailyProgramCard;
 expanded?: boolean;
 onClick?: () => void;
 sortDisabled?: boolean;
}

export function CalendarCardPreview({ card, expanded = false, onClick, sortDisabled = true }: CalendarCardPreviewProps) {
 const [tipsOpen, setTipsOpen] = useState(false);
 const bodyText = card.body ? extractText(card.body.content) : '';
 const hasBody = bodyText.length > 0;
 const hasCoachingTips = !!card.coaching_tips;

 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
 } = useSortable({
  id: `card:${card.id}`,
  disabled: sortDisabled,
 });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.4 : undefined,
 };

 return (
 <div
 ref={setNodeRef}
 style={style}
 {...attributes}
 {...listeners}
 className={`rounded-xl bg-neutral-900 border border-line-strong/50 overflow-hidden ${
  onClick ? 'cursor-pointer' : ''
 }`}
 onClick={(e) => {
  if (!isDragging && onClick) {
   e.stopPropagation();
   onClick();
  }
 }}
 >
 {/* Header: type badge + score + title */}
 <div className={expanded ? 'px-3 pt-2.5 pb-1.5' : 'px-2 pt-1.5 pb-1'}>
 <div className="flex items-center justify-between mb-1">
 <span className={`inline-flex items-center px-1.5 py-0.5 font-medium rounded bg-surface/10 text-content-disabled ${
 expanded ? 'text-[11px]' : 'text-[9px]'
 }`}>
 {cardTypeLabels[card.card_type]}
 </span>
 {card.score_value > 0 && (
 <span className={`text-content-tertiary ${expanded ? 'text-[11px]' : 'text-[9px]'}`}>
 {card.score_value} score
 </span>
 )}
 </div>
 <div className={`font-semibold text-white leading-tight ${
 expanded ? 'text-[15px]' : 'text-[12px]'
 }`}>
 {card.title}
 </div>
 </div>

 {/* Body text preview */}
 {expanded && hasBody && (
 <div className="px-3 pb-1.5">
 <p className="text-[13px] text-content-disabled leading-relaxed whitespace-pre-line line-clamp-4">
 {bodyText}
 </p>
 </div>
 )}

 {/* Coaching tips */}
 {expanded && hasCoachingTips && (
 <div className="border-t border-line-strong/40">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setTipsOpen(!tipsOpen);
 }}
 className="w-full flex items-center gap-1.5 px-3 py-1.5 text-content-tertiary hover:text-content-disabled transition-colors"
 >
 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
 </svg>
 <span className="text-[11px] font-medium">Coaching Tips</span>
 <svg className={`w-3 h-3 ml-auto transition-transform ${tipsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
 </svg>
 </button>
 {tipsOpen && (
 <div className="px-3 pb-2">
 <div className="bg-surface/[0.03] rounded-md p-2">
 <p className="text-[12px] text-content-tertiary leading-relaxed whitespace-pre-line">
 {card.coaching_tips}
 </p>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Compact: body/tips indicators */}
 {!expanded && (hasBody || hasCoachingTips) && (
 <div className="flex items-center gap-1.5 px-2 pb-1">
 {hasBody && (
 <span className="text-[9px] text-content-secondary">
 본문
 </span>
 )}
 {hasCoachingTips && (
 <span className="text-[9px] text-content-secondary">
 팁
 </span>
 )}
 </div>
 )}
 </div>
 );
}
