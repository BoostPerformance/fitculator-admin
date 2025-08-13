"use client";
import Image from 'next/image';

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
      <Image src="/image/logo.png" alt="Fitculator Logo" width={192} height={64} className="mb-8" loading="lazy" />

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
    <div className="relative min-h-screen">
      {/* 헤더 스켈레톤 */}
      <div className="absolute right-8 top-4 z-50 hidden lg:flex md:hidden items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5" />
      </div>

      <div className="flex md:flex-col sm:flex-col min-h-screen">
        {/* 사이드바 스켈레톤 */}
        <div className="w-[15rem] sm:w-full md:w-full bg-white dark:bg-gray-800 p-6 shadow-sm border-r border-gray-200 dark:border-gray-700">
          {/* 로고 스켈레톤 */}
          <div className="mb-8">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* 사용자 정보 스켈레톤 */}
          <div className="mb-6 lg:hidden md:block sm:block">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>

          {/* 챌린지 목록 스켈레톤 */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-16 mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-3" />
                {/* 서브메뉴 스켈레톤 */}
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 메인 컨텐츠 스켈레톤 */}
        <main className="flex-1 px-[1rem] py-[1.25rem] sm:px-0 sm:py-0 bg-white-1 dark:bg-blue-4">
          <div className="flex-1 p-4 sm:p-0">
            {/* 헤더 스켈레톤 */}
            <div className="px-8 pt-4 sm:px-4 sm:pt-0 mb-6">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>

            {/* 통계 섹션 스켈레톤 */}
            <div className="mt-6 px-8 sm:px-4">
              <div className="grid grid-cols-4 gap-4 mb-8 sm:grid-cols-2 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* 캘린더 및 필터 섹션 스켈레톤 */}
            <div className="px-8 sm:px-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4 sm:flex-col sm:gap-4">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex gap-4 sm:w-full sm:justify-center">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
                
                {/* 캘린더 그리드 스켈레톤 */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {/* 요일 헤더 */}
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                  {/* 날짜 셀 */}
                  {[...Array(35)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* 식단 테이블 스켈레톤 */}
            <div className="px-8 sm:px-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <Skeleton className="h-6 w-32 mb-6" />
                
                {/* 테이블 헤더 */}
                <div className="grid grid-cols-6 gap-4 mb-4 sm:hidden">
                  {['이름', '아침', '점심', '저녁', '간식', '피드백'].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>

                {/* 테이블 로우 */}
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4 py-4 border-b border-gray-100 sm:grid-cols-1 sm:gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 모바일 전용 리스트 스켈레톤 */}
            <div className="px-4 lg:hidden md:hidden sm:block">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <Skeleton className="h-5 w-24 mb-3" />
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex gap-2">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-6 w-6 rounded-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export const MainPageSkeleton = () => {
  return (
    <div className="bg-white-1 dark:bg-blue-4 flex flex-col min-h-screen sm:px-[1rem] md:px-[0.4rem]">
      <div className="flex gap-[1rem] flex-1 sm:flex-col md:flex-col">
        {/* 메인 컨텐츠 스켈레톤 (사이드바 없음) */}
        <main className="flex-1 overflow-y-auto">
          <div className="pt-[2rem] pb-[2rem] sm:pt-0">
            {/* 타이틀 섹션 스켈레톤 */}
            <div className="px-4 sm:px-4 relative lg:mb-8 md:mb-4 sm:my-4">
              {/* 챌린지 기간 스켈레톤 */}
              <Skeleton className="h-4 w-48 mb-2" />
              {/* 타이틀 스켈레톤 */}
              <Skeleton className="h-8 w-64" />
            </div>

            {/* 통계 카드 스켈레톤 */}
            <div className="grid grid-cols-4 gap-1 px-4 sm:px-4 sm:grid-cols-1 sm:mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2">
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>

            {/* 그래프 섹션 스켈레톤 */}
            <div className="dark:bg-blue-4 grid grid-cols-6 gap-[1rem] my-6 sm:my-4 sm:flex sm:flex-col px-4 sm:px-4">
              {/* 도넛 차트 스켈레톤 */}
              <div className="col-span-2 bg-white dark:bg-gray-8 p-4 rounded-lg h-[36rem]">
                <Skeleton className="h-6 w-20 mb-4" />
                <div className="w-full h-[13rem] flex items-center justify-center">
                  <Skeleton className="h-32 w-32 rounded-full" />
                </div>
                <div className="space-y-2 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>

              {/* 다른 차트들 스켈레톤 */}
              <div className="col-span-2 bg-white dark:bg-gray-8 p-4 rounded-lg h-[36rem]">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-full w-full" />
              </div>

              <div className="col-span-2 bg-white dark:bg-gray-8 p-4 rounded-lg h-[36rem]">
                <Skeleton className="h-6 w-20 mb-4" />
                <Skeleton className="h-full w-full" />
              </div>
            </div>

            {/* 테이블 섹션 스켈레톤 */}
            <div className="dark:bg-blue-4 bg-gray-100 lg:pt-[1rem] bg-white-1 px-4 sm:px-4">
              <div className="bg-white dark:bg-gray-8 p-4 rounded-lg">
                <DietTableSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer 스켈레톤 */}
      <div className="h-16 bg-white dark:bg-gray-800 border-t">
        <div className="flex justify-center items-center h-full">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
};

export const WorkoutPageSkeleton = () => {
  return (
    <div className="flex-1 p-4 sm:p-0">
      {/* 헤더 섹션 스켈레톤 */}
      <div className="px-8 pt-4 sm:px-4 sm:pt-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* PC 테이블 스켈레톤 */}
      <div className="mt-6 px-8 overflow-x-auto w-full sm:hidden">
        <div className="w-full overflow-x-auto">
          <div className="w-full bg-white rounded-lg border border-gray-200 min-w-[1000px] p-4">
            {/* 테이블 헤더 */}
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-24" />
              ))}
            </div>
            {/* 테이블 로우 */}
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-t">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                {[...Array(8)].map((_, j) => (
                  <Skeleton key={j} className="h-6 w-24" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 모바일 리스트 스켈레톤 */}
      <div className="mt-[3rem] sm:px-[1rem] lg:hidden md:hidden sm:block w-full">
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="pb-[2rem] sm:bg-white rounded-md shadow">
              <Skeleton className="h-6 w-32 mt-4 ml-4 mb-4" />
              <div className="px-4">
                <div className="flex gap-2 mb-3">
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className="flex flex-col items-center">
                      <Skeleton className="h-4 w-8 mb-2" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  ))}
                </div>
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
