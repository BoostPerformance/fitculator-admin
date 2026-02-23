'use client';

import Image from 'next/image';
import { Breadcrumbs } from './Breadcrumbs';
import type { ChallengeFlags } from './Breadcrumbs';
import { UserDropdown } from './UserDropdown';

interface DesktopHeaderProps {
  showEditUsername?: boolean;
  challengeTitle?: string;
  challengeFlags?: ChallengeFlags;
  challenges?: { id: string; title: string; end_date: string; challenge_type: 'diet' | 'exercise' | 'diet_and_exercise' | 'running'; enable_benchmark?: boolean; enable_mission?: boolean; use_daily_programs?: boolean }[];
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function DesktopHeader({
  showEditUsername,
  challengeTitle,
  challengeFlags,
  challenges,
  isSidebarOpen,
  onToggleSidebar,
}: DesktopHeaderProps) {
  return (
    <header className="hidden lg:flex items-center justify-between h-14 px-4 bg-surface border-b border-line sticky top-0 z-[100] flex-shrink-0">
      {/* Left: Logo + Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Image
          src="/svg/logo_text_light.svg"
          width={100}
          height={25}
          alt="Fitculator 로고"
          className="block dark:hidden"
          style={{ width: 'auto', height: 'auto' }}
          loading="lazy"
        />
        <Image
          src="/svg/logo_text_dark.svg"
          width={100}
          height={25}
          alt="Fitculator 로고"
          className="hidden dark:block"
          style={{ width: 'auto', height: 'auto' }}
          loading="lazy"
        />
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-raised active:bg-neutral-200 dark:active:bg-neutral-800 transition-colors"
            aria-label={isSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-content-secondary">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              {isSidebarOpen
                ? <path d="m16 15-3-3 3-3" />
                : <path d="m14 9 3 3-3 3" />
              }
            </svg>
          </button>
        )}
        <div className="mx-1 h-5 w-px bg-line" />
        <Breadcrumbs
          challengeTitle={challengeTitle}
          challengeFlags={challengeFlags}
          challenges={challenges}
        />
      </div>

      {/* Right: User Dropdown */}
      <UserDropdown showEditUsername={showEditUsername} />
    </header>
  );
}
