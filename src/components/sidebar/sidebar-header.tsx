'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
 isSidebarOpen: boolean;
 isScrolled: boolean;
 onToggle: () => void;
}

export function SidebarHeader({ isSidebarOpen, isScrolled, onToggle }: SidebarHeaderProps) {
 return (
 <div className={cn(
 'bg-surface flex-shrink-0 transition-shadow duration-300',
 isSidebarOpen && 'sticky top-0 z-[100]',
 isScrolled && isSidebarOpen && 'shadow-elevation-2',
 )}>
 <div className="flex justify-between items-center py-3 px-4 lg:py-5 lg:px-0 lg:gap-4 relative z-[100]">
 <Image
 src="/svg/logo_text_light.svg"
 width={120}
 height={30}
 alt="Fitculator 로고"
 className={isSidebarOpen ? 'block dark:hidden' : 'hidden'}
 style={{ width: 'auto', height: 'auto' }}
 loading="lazy"
 />
 <Image
 src="/svg/logo_text_dark.svg"
 width={120}
 height={30}
 alt="Fitculator 로고"
 className={isSidebarOpen ? 'hidden dark:block' : 'hidden'}
 style={{ width: 'auto', height: 'auto' }}
 loading="lazy"
 />
 <button
 onClick={onToggle}
 className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg hover:bg-surface-raised active:bg-neutral-200 dark:active:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
 aria-label={isSidebarOpen ? '메뉴 접기' : '메뉴 펼치기'}
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
 </div>
 </div>
 );
}
