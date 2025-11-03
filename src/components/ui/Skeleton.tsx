interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      aria-live="polite"
      aria-busy="true"
    />
  );
};

export const SidebarSkeleton = () => {
  return (
    <div className="space-y-4 px-2 py-4">
      {/* 프로그램 섹션 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <div className="ml-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>

      {/* 운영 관리 섹션 */}
      <div className="space-y-2 mt-8">
        <Skeleton className="h-8 w-full" />
        <div className="ml-4 space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    </div>
  );
};
