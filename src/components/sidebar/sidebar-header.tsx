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
 loading="lazy"
 />
 <Image
 src="/svg/logo_text_dark.svg"
 width={120}
 height={30}
 alt="Fitculator 로고"
 className={isSidebarOpen ? 'hidden dark:block' : 'hidden'}
 loading="lazy"
 />
 <button
 onClick={onToggle}
 className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg hover:bg-surface-raised active:bg-neutral-200 dark:active:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
 aria-label={isSidebarOpen ? '메뉴 접기' : '메뉴 펼치기'}
 >
 <div className="w-5 h-5 flex flex-col justify-center items-center gap-[0.25rem]">
 <span className={cn(
 'block w-full h-[2px] bg-content-primary transition-all duration-300 ease-in-out',
 isSidebarOpen && 'rotate-45 translate-y-[7px]'
 )} />
 <span className={cn(
 'block w-full h-[2px] bg-content-primary transition-all duration-300 ease-in-out',
 isSidebarOpen && 'opacity-0'
 )} />
 <span className={cn(
 'block w-full h-[2px] bg-content-primary transition-all duration-300 ease-in-out',
 isSidebarOpen && '-rotate-45 -translate-y-[7px]'
 )} />
 </div>
 </button>
 </div>
 </div>
 );
}
