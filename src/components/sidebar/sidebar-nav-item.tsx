'use client';

import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
 label: string;
 isActive: boolean;
 onClick: () => void;
 /** compact style for sub-menu items inside ended challenges */
 compact?: boolean;
}

export function SidebarNavItem({ label, isActive, onClick, compact }: SidebarNavItemProps) {
 return (
 <li>
 <div
 className={cn(
 'cursor-pointer text-body transition-colors duration-200 flex items-center',
 compact
 ? 'py-2 px-8 rounded'
 : 'py-3 px-4 ml-2 rounded-lg min-h-[44px]',
 isActive
 ? 'bg-accent-subtle text-accent font-medium'
 : 'text-content-secondary hover:bg-surface-raised active:bg-neutral-200 dark:active:bg-neutral-800'
 )}
 onClick={onClick}
 >
 {label}
 </div>
 </li>
 );
}
