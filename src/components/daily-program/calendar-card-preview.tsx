'use client';

import React, { useState } from 'react';
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
  onClick?: (card: DailyProgramCard) => void;
}

export function CalendarCardPreview({ card, expanded = false, onClick }: CalendarCardPreviewProps) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const bodyText = card.body ? extractText(card.body.content) : '';
  const hasBody = bodyText.length > 0;
  const hasCoachingTips = !!card.coaching_tips;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(card);
    }
  };

  return (
    <div
      onClick={handleClick}
      onPointerDown={onClick ? (e) => e.stopPropagation() : undefined}
      className={`rounded-xl bg-gray-900 border border-gray-700/50 overflow-hidden ${
        onClick ? 'cursor-pointer hover:ring-1 hover:ring-blue-500/50 transition-all' : ''
      }`}
    >
      {/* Header: type badge + score + title */}
      <div className={expanded ? 'px-3 pt-2.5 pb-1.5' : 'px-2 pt-1.5 pb-1'}>
        <div className="flex items-center justify-between mb-1">
          <span className={`inline-flex items-center px-1.5 py-0.5 font-medium rounded bg-white/10 text-gray-400 ${
            expanded ? 'text-[11px]' : 'text-[9px]'
          }`}>
            {cardTypeLabels[card.card_type]}
          </span>
          {card.score_value > 0 && (
            <span className={`text-gray-500 ${expanded ? 'text-[11px]' : 'text-[9px]'}`}>
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
          <p className="text-[13px] text-gray-400 leading-relaxed whitespace-pre-line line-clamp-4">
            {bodyText}
          </p>
        </div>
      )}

      {/* Coaching tips */}
      {expanded && hasCoachingTips && (
        <div className="border-t border-gray-700/40">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTipsOpen(!tipsOpen);
            }}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-400 transition-colors"
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
              <div className="bg-white/[0.03] rounded-md p-2">
                <p className="text-[12px] text-gray-500 leading-relaxed whitespace-pre-line">
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
            <span className="text-[9px] text-gray-600">
              본문
            </span>
          )}
          {hasCoachingTips && (
            <span className="text-[9px] text-gray-600">
              팁
            </span>
          )}
        </div>
      )}
    </div>
  );
}
