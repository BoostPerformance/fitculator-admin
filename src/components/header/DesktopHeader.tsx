'use client';

import Image from 'next/image';
import { Breadcrumbs } from './Breadcrumbs';
import type { ChallengeFlags } from './Breadcrumbs';
import { UserDropdown } from './UserDropdown';

interface DesktopHeaderProps {
  showEditUsername?: boolean;
  challengeTitle?: string;
  challengeFlags?: ChallengeFlags;
}

export function DesktopHeader({
  showEditUsername,
  challengeTitle,
  challengeFlags,
}: DesktopHeaderProps) {
  return (
    <header className="hidden lg:flex items-center justify-between h-14 px-4 bg-surface border-b border-line sticky top-0 z-[100] flex-shrink-0">
      {/* Left: Logo + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Image
          src="/svg/logo_text_light.svg"
          width={100}
          height={25}
          alt="Fitculator 로고"
          className="block dark:hidden"
          style={{ height: 'auto' }}
          loading="lazy"
        />
        <Image
          src="/svg/logo_text_dark.svg"
          width={100}
          height={25}
          alt="Fitculator 로고"
          className="hidden dark:block"
          style={{ height: 'auto' }}
          loading="lazy"
        />
        <div className="mx-1 h-5 w-px bg-line" />
        <Breadcrumbs
          challengeTitle={challengeTitle}
          challengeFlags={challengeFlags}
        />
      </div>

      {/* Right: User Dropdown */}
      <UserDropdown showEditUsername={showEditUsername} />
    </header>
  );
}
