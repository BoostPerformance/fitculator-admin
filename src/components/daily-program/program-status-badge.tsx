'use client';

import React from 'react';
import type { ProgramStatus } from '@/types/daily-program';

const statusConfig: Record<ProgramStatus, { label: string; className: string }> = {
  draft: {
    label: '초안',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  published: {
    label: '발행',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  archived: {
    label: '보관',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
};

interface ProgramStatusBadgeProps {
  status: ProgramStatus;
  size?: 'sm' | 'md';
}

export function ProgramStatusBadge({ status, size = 'sm' }: ProgramStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.className} ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      {config.label}
    </span>
  );
}
