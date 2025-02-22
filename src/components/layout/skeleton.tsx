"use client";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
};

export const DietTableSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* 테이블 헤더 스켈레톤 */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* 테이블 로우 스켈레톤 */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg"
        >
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      ))}
    </div>
  );
};

export const MobileChartSkeleton = () => {
  return (
    <div className="mt-[3rem] sm:bg-white sm:px-[1rem] space-y-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="pt-[2rem]">
          {/* 피드백 버튼 스켈레톤 */}
          <Skeleton className="h-10 w-32 rounded-[0.5rem]" />

          {/* 사용자 이름 스켈레톤 */}
          <Skeleton className="h-6 w-24 mt-4 ml-4" />

          {/* 식사 아이콘 스켈레톤 */}
          <div className="flex justify-center gap-8 mt-6">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-8 w-8 rounded-full" />
            ))}
          </div>

          {/* 피드백 상태 스켈레톤 */}
          <div className="flex justify-center mt-6">
            <Skeleton className="h-8 w-20 rounded-[0.3rem]" />
          </div>

          {/* 날짜 정보 스켈레톤 */}
          <div className="mt-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};
