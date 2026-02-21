'use client';

import React from 'react';
import type { ProgramStatus } from '@/types/daily-program';

interface ProgramStatusActionsProps {
  status: ProgramStatus;
  onStatusChange: (newStatus: ProgramStatus) => void;
}

export function ProgramStatusActions({ status, onStatusChange }: ProgramStatusActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">상태:</span>

      {status === 'draft' && (
        <button
          onClick={() => onStatusChange('published')}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          발행
        </button>
      )}

      {status === 'published' && (
        <>
          <button
            onClick={() => onStatusChange('draft')}
            className="px-3 py-1.5 text-sm border border-yellow-400 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
          >
            초안으로
          </button>
          <button
            onClick={() => onStatusChange('archived')}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            보관
          </button>
        </>
      )}

      {status === 'archived' && (
        <>
          <button
            onClick={() => onStatusChange('draft')}
            className="px-3 py-1.5 text-sm border border-yellow-400 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
          >
            초안으로
          </button>
          <button
            onClick={() => onStatusChange('published')}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            재발행
          </button>
        </>
      )}
    </div>
  );
}
