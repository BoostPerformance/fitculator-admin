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

export const LoadingSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-8">
      {/* 로고 */}
      <img src="/image/logo.png" alt="Fitculator Logo" className="w-48 mb-8" />

      {/* 로딩 인디케이터 */}
      <div className="flex space-x-3">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>

      {/* 로딩 텍스트 */}
      <div className="text-gray-600 dark:text-gray-300">
        잠시만 기다려주세요...
      </div>
    </div>
  );
};

export const ChallengeDashboardSkeleton = () => {
  return (
    <div className="bg-white-1 dark:bg-blue-4 flex flex-col h-screen overflow-hidden sm:px-[1rem] md:px-[0.4rem]">
      {/* 헤더 스켈레톤 */}
      <div className="flex justify-end pr-[2rem] py-4">
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="flex gap-[1rem] flex-1 sm:flex-col md:flex-col">
        {/* 사이드바 스켈레톤 */}
        <div className="w-[15rem] sm:w-full md:w-full p-4 bg-white dark:bg-gray-800 rounded-lg">
          <Skeleton className="h-8 w-full mb-4" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full mt-2" />
          ))}
        </div>

        {/* 메인 컨텐츠 스켈레톤 */}
        <div className="flex-1 p-4">
          {/* 타이틀 스켈레톤 */}
          <Skeleton className="h-8 w-64 mb-6" />

          {/* 통계 카드 스켈레톤 */}
          <div className="grid grid-cols-3 gap-4 mb-6 sm:grid-cols-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>

          {/* 그래프 섹션 스켈레톤 */}
          <div className="grid grid-cols-6 gap-4 mb-6 sm:flex sm:flex-col">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg h-[300px]"
              >
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>

          {/* 테이블 스켈레톤 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <DietTableSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};

export const DietPageSkeleton = () => {
  return (
    <div className="flex">
      {/* 사이드바 스켈레톤 */}
      <div className="w-[15rem] sm:w-full md:w-full p-4 bg-white dark:bg-gray-800 rounded-lg">
        <Skeleton className="h-8 w-full mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full mt-2" />
        ))}
      </div>

      {/* 메인 컨텐츠 스켈레톤 */}
      <div className="flex-1 p-4">
        {/* 통계 섹션 스켈레톤 */}
        <div className="grid grid-cols-4 gap-4 mb-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* 캘린더 섹션 스켈레톤 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>

        {/* 식단 컨텐츠 스켈레톤 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-1">
                {[...Array(3)].map((_, j) => (
                  <div
                    key={j}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-32 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
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
