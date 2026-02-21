'use client';

import React from 'react';
import type { CardType } from '@/types/daily-program';

const cardTypeConfig: Record<CardType, { label: string; className: string }> = {
 workout: {
 label: '운동',
 className: 'bg-blue-100 text-blue-800 dark:text-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
 },
 warmup: {
 label: '웜업',
 className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
 },
 cooldown: {
 label: '쿨다운',
 className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
 },
 strength: {
 label: '근력',
 className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
 },
 skill: {
 label: '스킬',
 className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
 },
 custom: {
 label: '커스텀',
 className: 'bg-surface-raised text-content-secondary',
 },
};

interface CardTypeBadgeProps {
 type: CardType;
}

export function CardTypeBadge({ type }: CardTypeBadgeProps) {
 const config = cardTypeConfig[type];
 return (
 <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${config.className}`}>
 {config.label}
 </span>
 );
}
