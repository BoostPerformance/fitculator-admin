'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronIcon } from '../icons/ChevronIcon';

interface SidebarNavGroupProps {
 title: string;
 isOpen: boolean;
 onToggle: () => void;
 children: ReactNode;
 ariaLabel: string;
 ariaControls: string;
 mobile?: boolean;
}

export function SidebarNavGroup({
 title,
 isOpen,
 onToggle,
 children,
 ariaLabel,
 ariaControls,
 mobile,
}: SidebarNavGroupProps) {
 return (
 <li className="w-full items-center justify-between text-body font-semibold mb-2">
 <button
 className={cn(
 'flex flex-row justify-between align-middle items-center cursor-pointer w-full text-left',
 'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
 'min-h-[52px] transition-all border-b border-line py-3',
 mobile ? 'px-2 active:bg-surface-raised' : 'px-3 hover:bg-surface-raised active:bg-neutral-200 dark:active:bg-neutral-800'
 )}
 onClick={onToggle}
 aria-expanded={isOpen}
 aria-controls={ariaControls}
 aria-label={ariaLabel}
 >
 <span className="font-semibold text-content-primary text-title">{title}</span>
 <ChevronIcon isOpen={isOpen} className="text-content-disabled" />
 </button>

 {isOpen && (
 <ul
 id={ariaControls}
 className="font-medium mt-3 flex flex-col gap-1"
 role="group"
 aria-label={ariaLabel}
 >
 {children}
 </ul>
 )}
 </li>
 );
}
