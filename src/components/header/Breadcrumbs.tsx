'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const ROUTE_LABELS: Record<string, string> = {
  admin: '운영 관리',
  diet: '식단',
  members: '멤버',
  benchmarks: '벤치마크',
  missions: '미션',
  mapping: '매핑',
  status: '현황',
  announcements: '공지사항',
  create: '작성',
  edit: '수정',
  settings: '설정',
  user: '사용자',
  'create-challenge': '챌린지 생성',
  'manage-challenges': '챌린지 관리',
  'manage-competitions': '대회 관리',
  'manage-organizations': '조직 관리',
  workout: '운동',
  running: '운동',
  'daily-program': '데일리 프로그램',
  submissions: '제출 현황',
  announcement: '공지사항',
};

// ─── Challenge flags ──────────────────────────────────────
export interface ChallengeFlags {
  challenge_type: 'diet' | 'exercise' | 'diet_and_exercise' | 'running';
  enable_benchmark?: boolean;
  enable_mission?: boolean;
  use_daily_programs?: boolean;
}

// ─── Sibling route definitions ────────────────────────────
interface SiblingRoute {
  segment: string;
  label: string;
}

/** Build challenge sub-menu matching sidebar logic */
function getChallengeChildren(flags?: ChallengeFlags): SiblingRoute[] {
  if (!flags) return [];
  const items: (SiblingRoute & { show: boolean })[] = [
    { segment: 'diet', label: '식단', show: flags.challenge_type === 'diet' || flags.challenge_type === 'diet_and_exercise' },
    { segment: 'workout', label: '운동', show: flags.challenge_type === 'exercise' || flags.challenge_type === 'diet_and_exercise' },
    { segment: 'running', label: '운동', show: flags.challenge_type === 'running' },
    { segment: 'members', label: '멤버', show: true },
    { segment: 'benchmarks', label: '벤치마크', show: !!flags.enable_benchmark },
    { segment: 'missions', label: '미션', show: !!flags.enable_mission },
    { segment: 'daily-program', label: '데일리 프로그램', show: !!flags.use_daily_programs },
    { segment: 'announcements', label: '공지사항', show: true },
  ];
  return items.filter((item) => item.show);
}

const ADMIN_CHILDREN: SiblingRoute[] = [
  { segment: 'create-challenge', label: '챌린지 생성' },
  { segment: 'manage-challenges', label: '챌린지 관리' },
  { segment: 'manage-competitions', label: '대회 관리' },
  { segment: 'manage-organizations', label: '조직 관리' },
];

const MISSION_CHILDREN: SiblingRoute[] = [
  { segment: 'mapping', label: '매핑' },
  { segment: 'status', label: '현황' },
];

function getSiblings(segments: string[], index: number, challengeFlags?: ChallengeFlags): SiblingRoute[] | null {
  // Under a challengeId
  if (index === 1 && !ROUTE_LABELS[segments[0]]) {
    const children = getChallengeChildren(challengeFlags);
    return children.length > 1 ? children : null;
  }
  // Under admin
  if (index === 1 && segments[0] === 'admin') {
    return ADMIN_CHILDREN;
  }
  // Under missions (challengeId/missions/xxx)
  if (index === 2 && segments[1] === 'missions' && !ROUTE_LABELS[segments[0]]) {
    return MISSION_CHILDREN;
  }
  return null;
}

// ─── Breadcrumb item with optional dropdown ───────────────
interface BreadcrumbItemProps {
  label: string;
  href: string;
  isLast: boolean;
  siblings: SiblingRoute[] | null;
  parentPath: string;
  currentSegment: string;
}

function BreadcrumbItem({ label, href, isLast, siblings, parentPath, currentSegment }: BreadcrumbItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClickOutside]);

  const toggle = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownLeft(rect.left);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (segment: string) => {
    setIsOpen(false);
    router.push(`${parentPath}/${segment}`);
  };

  const hasSiblings = siblings && siblings.length > 1;

  return (
    <div ref={dropdownRef} className="flex items-center gap-1">
      {isLast ? (
        <span className="font-medium text-content-primary">{label}</span>
      ) : (
        <Link
          href={href}
          className="text-content-tertiary hover:text-content-secondary transition-colors"
        >
          {label}
        </Link>
      )}
      {hasSiblings && (
        <button
          onClick={toggle}
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-surface-raised transition-colors"
          aria-label="하위 메뉴 선택"
          aria-expanded={isOpen}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`text-content-disabled transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {isOpen && hasSiblings && (
        <div
          className="fixed top-14 bg-surface border border-line rounded-b-lg shadow-elevation-2 overflow-hidden z-[101] min-w-[160px] py-1"
          style={{ left: dropdownLeft }}
        >
          {siblings.map((sibling) => (
            <button
              key={sibling.segment}
              onClick={() => handleSelect(sibling.segment)}
              className={`flex w-full items-center px-3 py-2 text-body transition-colors ${
                sibling.segment === currentSegment
                  ? 'bg-surface-raised text-content-primary font-medium'
                  : 'text-content-secondary hover:bg-surface-raised'
              }`}
            >
              {sibling.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────
interface BreadcrumbsProps {
  challengeTitle?: string;
  challengeFlags?: ChallengeFlags;
}

export function Breadcrumbs({ challengeTitle, challengeFlags }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const breadcrumbs: {
    label: string;
    href: string;
    siblings: SiblingRoute[] | null;
    parentPath: string;
    currentSegment: string;
  }[] = [];
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    const siblings = getSiblings(segments, i, challengeFlags);
    const parentPath = '/' + segments.slice(0, i).join('/');

    if (i === 0 && !ROUTE_LABELS[segment]) {
      breadcrumbs.push({
        label: challengeTitle || '챌린지',
        href: currentPath,
        siblings: null,
        parentPath,
        currentSegment: segment,
      });
    } else {
      const label = ROUTE_LABELS[segment];
      if (label) {
        breadcrumbs.push({
          label,
          href: currentPath,
          siblings,
          parentPath,
          currentSegment: segment,
        });
      }
    }
  }

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="현재 위치" className="flex items-center gap-1.5 text-body">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-content-disabled flex-shrink-0">
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <BreadcrumbItem
              label={crumb.label}
              href={crumb.href}
              isLast={isLast}
              siblings={crumb.siblings}
              parentPath={crumb.parentPath}
              currentSegment={crumb.currentSegment}
            />
          </span>
        );
      })}
    </nav>
  );
}
