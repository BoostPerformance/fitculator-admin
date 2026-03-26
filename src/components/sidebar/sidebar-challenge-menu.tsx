'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { SidebarNavItem } from './sidebar-nav-item';
import type { ChallengeData } from './types';

interface SidebarChallengeMenuProps {
 challenge: ChallengeData;
 onNavigate?: () => void;
 onSelectChallenge?: (challengeId: string) => void;
 onAddRecent?: (challengeId: string) => void;
 /** Use compact style (for ended challenges) */
 compact?: boolean;
}

export function SidebarChallengeMenu({ challenge, onNavigate, onSelectChallenge, onAddRecent, compact }: SidebarChallengeMenuProps) {
 const router = useRouter();
 const pathname = usePathname();
 const { id, challenge_type, enable_benchmark, enable_mission, use_daily_programs } = challenge.challenges;

 const isActiveRoute = useCallback((route: string) => {
  return pathname === route || pathname?.startsWith(route);
 }, [pathname]);

 const navigate = useCallback((path: string) => {
  onSelectChallenge?.(id);
  onAddRecent?.(id);
  router.push(path);
  onNavigate?.();
 }, [router, onNavigate, onSelectChallenge, onAddRecent, id]);

 const items: { label: string; path: string; show: boolean }[] = [
  { label: '대시보드', path: `/${id}`, show: true },
  {
   label: '식단',
   path: `/${id}/diet?date=${new Date().toISOString().split('T')[0]}`,
   show: challenge_type === 'diet' || challenge_type === 'diet_and_exercise',
  },
  {
   label: '운동',
   path: `/${id}/workout?refresh=${Date.now()}`,
   show: challenge_type === 'exercise' || challenge_type === 'diet_and_exercise',
  },
  {
   label: '운동',
   path: `/${id}/running?refresh=${Date.now()}`,
   show: challenge_type === 'running',
  },
  { label: '멤버', path: `/${id}/members`, show: true },
  { label: '벤치마크', path: `/${id}/benchmarks`, show: !!enable_benchmark },
  { label: '미션', path: `/${id}/missions`, show: !!enable_mission },
  { label: '데일리 프로그램', path: `/${id}/daily-program`, show: !!use_daily_programs },
  { label: '공지사항', path: `/${id}/announcements`, show: true },
  { label: '설정', path: `/${id}/settings`, show: true },
 ];

 // For isActiveRoute, extract the base path (without query params)
 const getBasePath = (path: string) => path.split('?')[0];

 // Dashboard item needs exact match to avoid matching all sub-routes
 const isDashboardActive = pathname === `/${id}`;

 return (
  <ul className={compact
   ? 'mt-2 ml-2'
   : 'mt-1 ml-3 space-y-0.5'
  }>
   {items.filter(item => item.show).map((item, index) => (
    <SidebarNavItem
     key={item.label + item.path}
     label={item.label}
     isActive={index === 0 ? isDashboardActive : isActiveRoute(getBasePath(item.path))}
     onClick={() => navigate(item.path)}
     compact={compact}
    />
   ))}
  </ul>
 );
}
