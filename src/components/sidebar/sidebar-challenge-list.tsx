'use client';

import { cn } from '@/lib/utils';
import { ChevronIcon } from '../icons/ChevronIcon';
import { SidebarChallengeMenu } from './sidebar-challenge-menu';
import type { ChallengeData } from './types';

interface ChallengeItemProps {
 challenge: ChallengeData;
 isSelected: boolean;
 isDropdownOpen: boolean;
 onSelect: (challenge: ChallengeData) => void;
 onToggleDropdown: (challengeId: string) => void;
 onNavigate?: () => void;
 /** Ended challenge (dimmed) */
 ended?: boolean;
 /** Mobile rendering */
 mobile?: boolean;
}

function ChallengeItem({
 challenge,
 isSelected,
 isDropdownOpen,
 onSelect,
 onToggleDropdown,
 onNavigate,
 ended,
 mobile,
}: ChallengeItemProps) {
 const id = challenge.challenges.id;

 return (
 <li id={`challenge-${mobile ? 'mobile-' : ''}${ended ? 'ended-' : ''}${id}`} className={ended ? 'opacity-60' : ''}>
 <div
 className={cn(
 'font-medium py-2 rounded-lg flex justify-between items-center transition-colors',
 ended ? 'pl-2' : 'px-3 min-h-[48px]',
 mobile && 'active:scale-[0.98]',
 isSelected
 ? 'bg-accent-subtle'
 : 'hover:bg-surface-raised active:bg-neutral-200 dark:active:bg-neutral-800',
 isSelected && ended && 'opacity-100'
 )}
 onClick={() => onSelect(challenge)}
 role={ended ? undefined : 'button'}
 >
 <span
 className={cn(
 'text-body font-medium flex-1 py-1 cursor-pointer',
 isSelected ? 'text-accent' : 'text-content-primary'
 )}
 >
 {challenge.challenges.title || '제목 없음'}
 </span>
 <button
 onClick={(e) => {
 e.stopPropagation();
 onToggleDropdown(id);
 }}
 className={cn(
 'flex-shrink-0 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
 mobile ? 'ml-2 p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-90' : 'ml-2 p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center',
 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
 )}
 aria-label={isDropdownOpen ? '챌린지 메뉴 닫기' : '챌린지 메뉴 열기'}
 aria-expanded={isDropdownOpen}
 >
 <ChevronIcon isOpen={isDropdownOpen} size={14} className="text-content-tertiary" />
 </button>
 </div>

 {isDropdownOpen && (
 <SidebarChallengeMenu
 challenge={challenge}
 onNavigate={onNavigate}
 compact={ended}
 />
 )}
 </li>
 );
}

// ─── Recent Challenges ─────────────────────────────────────
interface RecentSectionProps {
 challenges: ChallengeData[];
 selectedChallengeId?: string;
 onSelect: (challenge: ChallengeData) => void;
 onRemove: (id: string) => void;
 mobile?: boolean;
}

export function RecentChallengesSection({ challenges, selectedChallengeId, onSelect, onRemove, mobile }: RecentSectionProps) {
 if (challenges.length === 0) return null;

 return (
 <>
 <li className="list-none">
 <div className="text-body text-content-tertiary pl-2 mb-2 flex items-center gap-2" role="heading" aria-level={3}>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent">
 <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
 </svg>
 최근 방문
 </div>
 </li>
 {challenges.map((challenge) => (
 <li key={`recent-${mobile ? 'mobile-' : ''}${challenge.challenges.id}`} className="list-none">
 <div className="flex items-center justify-between py-1 pl-2 pr-1 rounded hover:bg-surface-raised transition-colors duration-300">
 <div
 className={cn(
 'cursor-pointer text-body flex-1',
 challenge.challenges.id === selectedChallengeId
 ? 'text-accent'
 : 'text-content-primary'
 )}
 onClick={() => onSelect(challenge)}
 >
 {challenge.challenges.title}
 </div>
 <button
 onClick={() => onRemove(challenge.challenges.id)}
 className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
 aria-label={`${challenge.challenges.title} 최근 방문에서 제거`}
 >
 <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-content-disabled">
 <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </li>
 ))}
 <li className="list-none border-t border-line my-2" />
 </>
 );
}

// ─── Active Challenges ─────────────────────────────────────
interface ActiveSectionProps {
 challenges: ChallengeData[];
 selectedChallengeId?: string;
 isOpenChallengeDropdown: Record<string, boolean>;
 onSelect: (challenge: ChallengeData) => void;
 onToggleDropdown: (challengeId: string) => void;
 onNavigate?: () => void;
 mobile?: boolean;
}

export function ActiveChallengesSection({
 challenges,
 selectedChallengeId,
 isOpenChallengeDropdown,
 onSelect,
 onToggleDropdown,
 onNavigate,
 mobile,
}: ActiveSectionProps) {
 return (
 <>
 <li className="list-none">
 <div className="text-body text-content-tertiary pl-2 mb-2" role="heading" aria-level={3}>진행 중</div>
 </li>
 {challenges.length > 0 ? (
 challenges.map((challenge) => (
 <ChallengeItem
 key={`${mobile ? 'mobile-' : ''}${challenge.challenges.id}`}
 challenge={challenge}
 isSelected={challenge.challenges.id === selectedChallengeId}
 isDropdownOpen={!!isOpenChallengeDropdown[challenge.challenges.id]}
 onSelect={onSelect}
 onToggleDropdown={onToggleDropdown}
 onNavigate={onNavigate}
 mobile={mobile}
 />
 ))
 ) : (
 <li className="list-none py-2 px-3 text-body text-content-disabled">
 진행 중인 챌린지가 없습니다
 </li>
 )}
 </>
 );
}

// ─── Ended Challenges ─────────────────────────────────────
interface EndedSectionProps {
 challenges: ChallengeData[];
 selectedChallengeId?: string;
 isOpen: boolean;
 onToggle: () => void;
 isOpenChallengeDropdown: Record<string, boolean>;
 onSelect: (challenge: ChallengeData) => void;
 onToggleDropdown: (challengeId: string) => void;
 onNavigate?: () => void;
 mobile?: boolean;
}

export function EndedChallengesSection({
 challenges,
 selectedChallengeId,
 isOpen,
 onToggle,
 isOpenChallengeDropdown,
 onSelect,
 onToggleDropdown,
 onNavigate,
 mobile,
}: EndedSectionProps) {
 if (challenges.length === 0) return null;

 const idSuffix = mobile ? '-mobile' : '';

 return (
 <li id={`ended-challenges-section${idSuffix}`} className="list-none mt-4 border-t border-line pt-4">
 <button
 className="flex justify-between items-center pl-2 mb-2 cursor-pointer w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent py-1"
 onClick={onToggle}
 aria-expanded={isOpen}
 aria-controls={`ended-challenges-list${idSuffix}`}
 aria-label={`종료된 챌린지 ${challenges.length}개`}
 >
 <span className="text-body text-content-tertiary">종료됨 ({challenges.length})</span>
 <ChevronIcon isOpen={isOpen} size={14} className="text-content-tertiary" />
 </button>
 {isOpen && (
 <ul id={`ended-challenges-list${idSuffix}`} className="flex flex-col gap-2" role="group" aria-label="종료된 챌린지 목록">
 {challenges.map((challenge) => (
 <ChallengeItem
 key={`${mobile ? 'mobile-ended-' : ''}${challenge.challenges.id}`}
 challenge={challenge}
 isSelected={challenge.challenges.id === selectedChallengeId}
 isDropdownOpen={!!isOpenChallengeDropdown[challenge.challenges.id]}
 onSelect={onSelect}
 onToggleDropdown={onToggleDropdown}
 onNavigate={onNavigate}
 ended
 mobile={mobile}
 />
 ))}
 </ul>
 )}
 </li>
 );
}
