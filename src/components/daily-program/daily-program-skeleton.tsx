import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
 viewMode: 'month' | 'week';
 isMobile: boolean;
}

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function WeekdayHeader() {
 return (
  <div className="grid grid-cols-7">
   {WEEKDAY_LABELS.map((day) => (
    <div key={day} className="py-2 text-center text-xs font-medium text-content-secondary">
     {day}
    </div>
   ))}
  </div>
 );
}

function DesktopMonthSkeleton() {
 return (
  <div className="border border-line rounded-lg overflow-hidden">
   <WeekdayHeader />
   <div className="grid grid-cols-7">
    {Array.from({ length: 42 }).map((_, i) => (
     <div key={i} className="border border-line-subtle min-h-[120px] md:min-h-[100px] p-1.5">
      <Skeleton className="w-6 h-6 rounded-full" />
      {i % 4 === 2 && (
       <div className="mt-1.5">
        <Skeleton className="h-5 w-4/5 rounded" />
       </div>
      )}
     </div>
    ))}
   </div>
  </div>
 );
}

function DesktopWeekSkeleton() {
 return (
  <div className="border border-line rounded-lg overflow-hidden">
   <WeekdayHeader />
   <div className="grid grid-cols-7">
    {Array.from({ length: 7 }).map((_, i) => (
     <div key={i} className="border border-line-subtle min-h-[200px] md:min-h-[150px] p-1.5">
      <Skeleton className="w-6 h-6 rounded-full" />
      {i % 3 === 1 && (
       <div className="mt-1.5">
        <Skeleton className="h-5 w-4/5 rounded" />
       </div>
      )}
     </div>
    ))}
   </div>
  </div>
 );
}

function MobileSkeleton() {
 return (
  <div className="flex flex-col">
   <div className="border border-line rounded-lg overflow-hidden">
    <WeekdayHeader />
    <div className="grid grid-cols-7">
     {Array.from({ length: 42 }).map((_, i) => (
      <div key={i} className="py-2 flex items-center justify-center">
       <Skeleton className="w-8 h-8 rounded-full" />
      </div>
     ))}
    </div>
   </div>
   <div className="mt-3 space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-16 w-full rounded-xl" />
   </div>
  </div>
 );
}

export function DailyProgramCalendarSkeleton({ viewMode, isMobile }: Props) {
 if (isMobile) return <MobileSkeleton />;
 if (viewMode === 'week') return <DesktopWeekSkeleton />;
 return <DesktopMonthSkeleton />;
}
