'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import LogoutButton from '../buttons/logoutButton';
import { SidebarSkeleton } from '../ui/Skeleton';
import { SidebarNavGroup } from './sidebar-nav-group';
import { SidebarAdminMenu } from './sidebar-admin-menu';
import { SidebarFooter } from './sidebar-footer';
import {
 RecentChallengesSection,
 ActiveChallengesSection,
 EndedChallengesSection,
} from './sidebar-challenge-list';
import type { ChallengeData } from './types';

// ─── Mobile Header Bar (closed state) ───────────────────────
interface MobileHeaderBarProps {
 username?: string;
 userDropdown: boolean;
 onToggleSidebar: () => void;
 onToggleUserDropdown: () => void;
 onEditUsername: () => void;
 email?: string;
 isLoading: boolean;
 hasData: boolean;
 profileImageUrl?: string | null;
}

export function MobileHeaderBar({
 username,
 userDropdown,
 onToggleSidebar,
 onToggleUserDropdown,
 onEditUsername,
 email,
 isLoading,
 hasData,
 profileImageUrl,
}: MobileHeaderBarProps) {
 return (
  <div className="flex items-center justify-between h-14 px-4 bg-surface border-b border-line">
   <button
    onClick={onToggleSidebar}
    className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-surface-raised active:scale-95 transition-all"
    aria-label="메뉴 열기"
   >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-content-secondary">
     <rect width="18" height="18" x="3" y="3" rx="2" />
     <path d="M9 3v18" />
     <path d="m14 9 3 3-3 3" />
    </svg>
   </button>

   <button
    onClick={onToggleUserDropdown}
    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-raised active:scale-[0.98] transition-all"
    aria-label="사용자 메뉴"
    aria-expanded={userDropdown}
   >
    {profileImageUrl ? (
     <img src={profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover shadow-sm" />
    ) : (
     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-body font-semibold shadow-sm">
      {(username || 'U').charAt(0).toUpperCase()}
     </div>
    )}
    <svg
     width="16"
     height="16"
     viewBox="0 0 16 16"
     fill="none"
     className={`text-content-disabled transition-transform duration-200 ${userDropdown ? 'rotate-180' : ''}`}
    >
     <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
   </button>

   {userDropdown && (
    <div className="absolute right-4 top-14 mt-1 bg-surface rounded-2xl shadow-elevation-3 border border-line overflow-hidden z-[9999] min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
     <div className="px-4 py-3 border-b border-line">
      <p className="text-body font-medium text-content-primary">{username}</p>
      <p className="text-label text-content-tertiary mt-0.5">{email}</p>
     </div>
     <div className="py-1">
      <button
       onClick={onEditUsername}
       disabled={isLoading || !hasData}
       className="flex items-center gap-3 w-full px-4 py-3 text-body text-content-secondary hover:bg-surface-raised transition-colors disabled:opacity-50"
      >
       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
       </svg>
       이름 수정
      </button>
      <LogoutButton />
     </div>
    </div>
   )}
  </div>
 );
}

// ─── Mobile Sidebar Drawer (open state) ──────────────────────
interface MobileSidebarOverlayProps {
 isOpen: boolean;
 onExited: () => void;
 data: ChallengeData[];
 selectedChallengeId?: string;
 isOpenDropdown: boolean;
 isAdminDropdownOpen: boolean;
 isOpenEndedDropdown: boolean;
 isOpenChallengeDropdown: Record<string, boolean>;
 recentChallengesData: ChallengeData[];
 activeChallenges: ChallengeData[];
 endedChallenges: ChallengeData[];
 hasOperationalAccess: boolean;
 onClose: () => void;
 onDropdownToggle: () => void;
 onAdminDropdownToggle: () => void;
 onEndedDropdownToggle: () => void;
 onChallengeDropdownToggle: (id: string) => void;
 onChallengeClick: (challenge: ChallengeData) => void;
 onRemoveRecent: (id: string) => void;
 closeSidebarOnMobile: () => void;
 onSelectChallenge?: (challengeId: string) => void;
 onAddRecent?: (challengeId: string) => void;
}

export function MobileSidebarOverlay({
 isOpen,
 onExited,
 data,
 selectedChallengeId,
 isOpenDropdown,
 isAdminDropdownOpen,
 isOpenEndedDropdown,
 isOpenChallengeDropdown,
 recentChallengesData,
 activeChallenges,
 endedChallenges,
 hasOperationalAccess,
 onClose,
 onDropdownToggle,
 onAdminDropdownToggle,
 onEndedDropdownToggle,
 onChallengeDropdownToggle,
 onChallengeClick,
 onRemoveRecent,
 closeSidebarOnMobile,
 onSelectChallenge,
 onAddRecent,
}: MobileSidebarOverlayProps) {
 const [visible, setVisible] = useState(false);

 useEffect(() => {
  if (isOpen) {
   document.body.style.overflow = 'hidden';
   requestAnimationFrame(() => {
    requestAnimationFrame(() => {
     setVisible(true);
    });
   });
  } else {
   setVisible(false);
   document.body.style.overflow = '';
  }
  return () => {
   document.body.style.overflow = '';
  };
 }, [isOpen]);

 return (
  <div className="fixed inset-0 z-[9999]">
   {/* Backdrop */}
   <div
    className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
     visible ? 'opacity-50' : 'opacity-0'
    }`}
    onClick={onClose}
    aria-hidden="true"
   />

   {/* Drawer panel */}
   <aside
    className={`absolute inset-y-0 left-0 w-4/5 max-w-[320px] flex flex-col bg-surface shadow-2xl transition-transform duration-300 ease-in-out ${
     visible ? 'translate-x-0' : '-translate-x-full'
    }`}
    onTransitionEnd={(e) => {
     if (e.target === e.currentTarget && !isOpen) {
      onExited();
     }
    }}
    role="navigation"
    aria-label="주 내비게이션"
   >
    {/* Header */}
    <div className="flex items-center justify-between h-16 px-5 border-b border-line flex-shrink-0">
     <Image
      src="/svg/logo_text_light.svg"
      width={110}
      height={28}
      alt="Fitculator 로고"
      className="dark:hidden"
      style={{ width: 'auto', height: 'auto' }}
      loading="lazy"
     />
     <Image
      src="/svg/logo_text_dark.svg"
      width={110}
      height={28}
      alt="Fitculator 로고"
      className="hidden dark:block"
      style={{ width: 'auto', height: 'auto' }}
      loading="lazy"
     />
     <button
      onClick={onClose}
      className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-raised active:scale-95 transition-all"
      aria-label="메뉴 닫기"
     >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-content-tertiary">
       <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
     </button>
    </div>

    {/* Scrollable Nav */}
    <div
     className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
     style={{ WebkitOverflowScrolling: 'touch' }}
    >
     <nav className="w-full py-4 px-4" aria-label="챌린지 및 관리 메뉴">
      {(!data || data.length === 0) && <SidebarSkeleton />}
      {data && data.length > 0 && (
       <ul>
        <SidebarNavGroup
         title="프로그램"
         isOpen={isOpenDropdown}
         onToggle={onDropdownToggle}
         ariaLabel="프로그램 메뉴"
         ariaControls="program-menu-list-mobile"
         mobile
        >
         {/* <RecentChallengesSection
          challenges={recentChallengesData}
          selectedChallengeId={selectedChallengeId}
          onSelect={onChallengeClick}
          onRemove={onRemoveRecent}
          mobile
         /> */}
         <ActiveChallengesSection
          challenges={activeChallenges}
          selectedChallengeId={selectedChallengeId}
          isOpenChallengeDropdown={isOpenChallengeDropdown}
          onToggleDropdown={onChallengeDropdownToggle}
          onNavigate={closeSidebarOnMobile}
          onSelectChallenge={onSelectChallenge}
          onAddRecent={onAddRecent}
          mobile
         />
         <EndedChallengesSection
          challenges={endedChallenges}
          selectedChallengeId={selectedChallengeId}
          isOpen={isOpenEndedDropdown}
          onToggle={onEndedDropdownToggle}
          isOpenChallengeDropdown={isOpenChallengeDropdown}
          onToggleDropdown={onChallengeDropdownToggle}
          onNavigate={closeSidebarOnMobile}
          onSelectChallenge={onSelectChallenge}
          onAddRecent={onAddRecent}
          mobile
         />
        </SidebarNavGroup>

        {hasOperationalAccess && (
         <SidebarAdminMenu
          isOpen={isAdminDropdownOpen}
          onToggle={onAdminDropdownToggle}
          onNavigate={closeSidebarOnMobile}
          mobile
         />
        )}
       </ul>
      )}
     </nav>

     <SidebarFooter onNavigate={closeSidebarOnMobile} />
    </div>
   </aside>
  </div>
 );
}
