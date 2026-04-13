'use client';

import React from 'react';
import type { ProgramStatus } from '@/types/daily-program';
import { programStatusConfig as statusConfig } from './constants';

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
