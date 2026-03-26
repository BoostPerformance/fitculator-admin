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
  race: '대회/시뮬레이션',
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
  enable_race?: boolean;
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
    { segment: '', label: '대시보드', show: true },
    { segment: 'diet', label: '식단', show: flags.challenge_type === 'diet' || flags.challenge_type === 'diet_and_exercise' },
    { segment: 'workout', label: '운동', show: flags.challenge_type === 'exercise' || flags.challenge_type === 'diet_and_exercise' },
    { segment: 'running', label: '운동', show: flags.challenge_type === 'running' },
    { segment: 'members', label: '멤버', show: true },
    { segment: 'benchmarks', label: '벤치마크', show: !!flags.enable_benchmark },
    { segment: 'missions', label: '미션', show: !!flags.enable_mission },
    { segment: 'daily-program', label: '데일리 프로그램', show: !!flags.use_daily_programs },
    { segment: 'race', label: '대회/시뮬레이션', show: !!flags.enable_race },
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
    router.push(segment ? `${parentPath}/${segment}` : parentPath);
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
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-surface-raised transition-colors"
          aria-label="하위 메뉴 선택"
          aria-expanded={isOpen}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-content-disabled"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
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

// ─── Program selector (challenge switcher) ───────────────
interface Challenge {
  id: string;
  title: string;
  end_date: string;
  challenge_type: ChallengeFlags['challenge_type'];
  enable_benchmark?: boolean;
  enable_mission?: boolean;
  use_daily_programs?: boolean;
  enable_race?: boolean;
}

function ProgramSelector({ challenges, currentTitle }: { challenges: Challenge[]; currentTitle: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
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
    if (!isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownLeft(rect.left);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (target: Challenge) => {
    setIsOpen(false);
    // Try to stay on the same sub-page if the target challenge supports it
    const segments = pathname.split('/').filter(Boolean);
    const subPage = segments[1]; // e.g. 'diet', 'workout', 'daily-program', etc.
    if (subPage) {
      const supported = getChallengeChildren({
        challenge_type: target.challenge_type,
        enable_benchmark: target.enable_benchmark,
        enable_mission: target.enable_mission,
        use_daily_programs: target.use_daily_programs,
        enable_race: target.enable_race,
      });
      const canNavigate = supported.some(s => s.segment === subPage);
      if (canNavigate) {
        router.push(`/${target.id}/${subPage}`);
        return;
      }
    }
    router.push(`/${target.id}`);
  };

  return (
    <div ref={ref} className="flex items-center gap-1">
      <span className="text-content-tertiary">{currentTitle}</span>
      <button
        onClick={toggle}
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-surface-raised transition-colors"
        aria-label="프로그램 선택"
        aria-expanded={isOpen}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-content-disabled"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      </button>
      {isOpen && (() => {
        const now = new Date();
        const active = challenges.filter(c => new Date(c.end_date) >= now);
        const ended = challenges.filter(c => new Date(c.end_date) < now);
        return (
          <div
            className="fixed top-14 bg-surface border border-line rounded-b-lg shadow-elevation-2 overflow-hidden z-[101] min-w-[160px] py-1 max-h-[70vh] overflow-y-auto"
            style={{ left: dropdownLeft }}
          >
            {active.length > 0 && (
              <>
                <div className="px-3 pt-1.5 pb-1 text-[11px] text-content-disabled tracking-wider">진행중</div>
                {active.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`flex w-full items-center px-3 py-2 text-body transition-colors ${
                      c.title === currentTitle
                        ? 'bg-surface-raised text-content-primary font-medium'
                        : 'text-content-secondary hover:bg-surface-raised'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </>
            )}
            {active.length > 0 && ended.length > 0 && (
              <div className="my-1 border-t border-line" />
            )}
            {ended.length > 0 && (
              <>
                <div className="px-3 pt-1.5 pb-1 text-[11px] text-content-disabled tracking-wider">종료</div>
                {ended.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`flex w-full items-center px-3 py-2 text-body transition-colors ${
                      c.title === currentTitle
                        ? 'bg-surface-raised text-content-disabled font-medium'
                        : 'text-content-disabled hover:bg-surface-raised hover:text-content-tertiary'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────
interface BreadcrumbsProps {
  challengeTitle?: string;
  challengeFlags?: ChallengeFlags;
  challenges?: Challenge[];
}

export function Breadcrumbs({ challengeTitle, challengeFlags, challenges }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const breadcrumbs: {
    label: string;
    href: string;
    siblings: SiblingRoute[] | null;
    parentPath: string;
    currentSegment: string;
    isProgramSelector?: boolean;
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
        isProgramSelector: true,
      });
      // Challenge root page (/{challengeId}) → append "대시보드"
      if (segments.length === 1) {
        const dashboardSiblings = getSiblings(segments.concat(''), 1, challengeFlags);
        breadcrumbs.push({
          label: '대시보드',
          href: currentPath,
          siblings: dashboardSiblings,
          parentPath: currentPath,
          currentSegment: '',
        });
      }
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
          <span key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-content-disabled flex-shrink-0">
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {crumb.isProgramSelector && challenges && challenges.length > 0 ? (
              <ProgramSelector challenges={challenges} currentTitle={crumb.label} />
            ) : (
              <BreadcrumbItem
                label={crumb.label}
                href={crumb.href}
                isLast={isLast}
                siblings={crumb.siblings}
                parentPath={crumb.parentPath}
                currentSegment={crumb.currentSegment}
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
