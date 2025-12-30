'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Title from '@/components/layout/title';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-gray-900 p-8">
        <div className="max-w-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-gray-900">
      <div className="max-w-2xl p-8">
        {/* Header */}
        <div className="mb-8">
          <Title title="설정" subtitle="사용 환경을 설정합니다" />
        </div>

        {/* Theme Section */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-4">테마</h2>

          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all bg-white dark:bg-gray-800 ${
                theme === 'light'
                  ? 'border-slate-900 dark:border-white'
                  : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">라이트</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">밝은 테마</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all bg-white dark:bg-gray-800 ${
                theme === 'dark'
                  ? 'border-slate-900 dark:border-white'
                  : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-300">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">다크</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">어두운 테마</div>
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
