'use client';

import React, { useState, useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Underline from '@tiptap/extension-underline';
import type { DailyProgramCard } from '@/types/daily-program';
import { CardTypeBadge } from './card-type-badge';
import { CardForm } from './card-form';

interface CardItemProps {
 card: DailyProgramCard;
 programId: string;
 onCardsChanged: () => void;
 dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const tiptapExtensions = [
 StarterKit.configure({ link: false, underline: false }),
 Underline,
 Link,
 Image,
 Youtube,
];

export function CardItem({ card, programId, onCardsChanged, dragHandleProps }: CardItemProps) {
 const [expanded, setExpanded] = useState(false);
 const [editing, setEditing] = useState(false);

 const bodyHtml = useMemo(() => {
  if (!card.body) return '';
  try {
   return generateHTML(card.body, tiptapExtensions);
  } catch {
   return '';
  }
 }, [card.body]);

 const handleDelete = async () => {
 if (!confirm(`"${card.title}" 카드를 삭제하시겠습니까?`)) return;

 try {
 await fetch(`/api/daily-program-cards?id=${card.id}`, { method: 'DELETE' });
 onCardsChanged();
 } catch (error) {
 console.error('Failed to delete card:', error);
 }
 };

 if (editing) {
 return (
 <CardForm
 card={card}
 programId={programId}
 onSave={() => {
 setEditing(false);
 onCardsChanged();
 }}
 onCancel={() => setEditing(false)}
 />
 );
 }

 return (
 <div className="border border-line rounded-lg bg-surface/50 overflow-hidden">
 {/* Header */}
 <div className="flex items-center gap-2 px-3 py-2">
 {/* Drag handle */}
 <div
 {...dragHandleProps}
 className="cursor-grab active:cursor-grabbing text-content-disabled hover:text-content-secondary"
 >
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
 <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
 </svg>
 </div>

 <CardTypeBadge type={card.card_type} />

 <span className="flex-1 text-body font-medium text-content-primary dark:text-white truncate">
 {card.title}
 </span>

 {card.has_check && (
 <span className="text-label-xs text-content-tertiary">제출 필요</span>
 )}
 {card.score_value > 0 && (
 <span className="text-label-xs text-blue-600 dark:text-blue-400">{card.score_value}점</span>
 )}

 {/* Expand/collapse */}
 <button
 onClick={() => setExpanded(!expanded)}
 className="p-1 hover:bg-surface-raised rounded transition-colors"
 >
 <svg
 className={`w-4 h-4 text-content-disabled transition-transform ${expanded ? 'rotate-180' : ''}`}
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
 </svg>
 </button>
 </div>

 {/* Expanded content */}
 {expanded && (
 <div className="border-t border-line-subtle px-3 py-2 space-y-2">
 {bodyHtml && (
 <div className="tiptap-content text-body text-content-secondary" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
 )}
 {card.coaching_tips && (
 <div className="text-body text-content-secondary">
 <span className="font-medium">코칭 팁:</span> {card.coaching_tips}
 </div>
 )}
 {card.requires_approval && (
 <div className="text-body text-amber-600 dark:text-amber-400">승인 필요</div>
 )}

 <div className="flex items-center gap-2 pt-1">
 <button
 onClick={() => setEditing(true)}
 className="px-2 py-1 text-body border border-line rounded hover:bg-surface-raised text-content-secondary transition-colors"
 >
 수정
 </button>
 <button
 onClick={handleDelete}
 className="px-2 py-1 text-body border border-red-300 dark:border-red-800 rounded hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
 >
 삭제
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
