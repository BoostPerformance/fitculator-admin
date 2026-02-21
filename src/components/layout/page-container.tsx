'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
 /** Page title shown in the sticky header */
 title?: string;
 /** Optional actions rendered at the right side of the header */
 actions?: ReactNode;
 /** Page body content */
 children: ReactNode;
 /** Additional className for the outer wrapper */
 className?: string;
 /** Whether to show the sticky header bar (default: true if title is provided) */
 showHeader?: boolean;
}

export function PageContainer({
 title,
 actions,
 children,
 className,
 showHeader,
}: PageContainerProps) {
 const shouldShowHeader = showHeader ?? !!title;

 return (
 <div className={cn('flex flex-col min-h-full', className)}>
 {shouldShowHeader && (
 <div className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-surface-app px-6 py-4 border-b border-line backdrop-blur-sm">
 {title && (
 <h1 className="text-headline font-semibold text-content-primary truncate">
 {title}
 </h1>
 )}
 {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
 </div>
 )}
 <div className="flex-1 px-6 py-5 sm:px-4 sm:py-3">
 {children}
 </div>
 </div>
 );
}
