'use client';

import React, { useState } from 'react';
import type { DailyProgramCard } from '@/types/daily-program';
import { CardTypeBadge } from './card-type-badge';
import { CardForm } from './card-form';

interface CardItemProps {
  card: DailyProgramCard;
  programId: string;
  onCardsChanged: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function CardItem({ card, programId, onCardsChanged, dragHandleProps }: CardItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

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
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>

        <CardTypeBadge type={card.card_type} />

        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
          {card.title}
        </span>

        {card.has_check && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400">체크</span>
        )}
        {card.score_value > 0 && (
          <span className="text-[10px] text-blue-600 dark:text-blue-400">{card.score_value}점</span>
        )}

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
        <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 space-y-2">
          {card.body && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">본문:</span>{' '}
              {card.body.content
                ?.map((node) =>
                  node.content?.map((c) => c.text).join('') || ''
                )
                .join(' ')
                .slice(0, 100) || '(빈 본문)'}
              ...
            </div>
          )}
          {card.coaching_tips && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">코칭 팁:</span> {card.coaching_tips}
            </div>
          )}
          {card.requires_approval && (
            <div className="text-xs text-amber-600 dark:text-amber-400">승인 필요</div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setEditing(true)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-2 py-1 text-xs border border-red-300 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
