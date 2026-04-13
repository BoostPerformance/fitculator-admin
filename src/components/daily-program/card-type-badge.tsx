'use client';

import React from 'react';
import type { CardType } from '@/types/daily-program';

const cardTypeConfig: Record<CardType, { label: string; className: string }> = {
 workout: {
 label: 'WOD',
 className: 'bg-blue-100 text-blue-800 dark:text-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
 },
 warmup: {
 label: 'Warm-up',
 className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
 },
 cooldown: {
 label: 'Cool-down',
 className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
 },
 strength: {
 label: 'Strength',
 className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
 },
 skill: {
 label: 'Skill',
 className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
 },
 custom: {
 label: 'Custom',
 className: 'bg-transparent border border-neutral-400 text-neutral-600 dark:border-neutral-500 dark:text-white',
 },
};

interface CardTypeBadgeProps {
 type: CardType;
}

export function CardTypeBadge({ type }: CardTypeBadgeProps) {
 const config = cardTypeConfig[type];
 return (
 <span className={`inline-flex items-center px-1.5 py-0.5 text-label-xs font-medium rounded ${config.className}`}>
 {config.label}
 </span>
 );
}
