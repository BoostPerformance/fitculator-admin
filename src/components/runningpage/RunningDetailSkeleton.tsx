import React from 'react';

// 도넛 그래프 스켈레톤
export const DonutChartSkeleton = () => (
  <div className="flex flex-col items-center justify-center p-6">
    <div className="w-40 h-40 rounded-full border-8 border-gray-200 animate-pulse mb-4"></div>
    <div className="h-6 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
  </div>
);

// 바 그래프 스켈레톤
export const BarChartSkeleton = () => (
  <div className="p-4">
    <div className="grid grid-cols-7 gap-2 mb-2">
      {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
        <div key={day} className="text-center">
          <div className="h-4 bg-gray-200 rounded w-6 mx-auto mb-1 animate-pulse"></div>
          <div
            className="bg-gray-200 rounded animate-pulse mx-auto"
            style={{
              height: `${Math.random() * 100 + 20}px`,
              width: '24px'
            }}
          ></div>
          <div className="h-3 bg-gray-200 rounded w-8 mx-auto mt-1 animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

// 러닝 리스트 스켈레톤
export const RunningListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((item) => (
      <div key={item} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
        <div className="flex justify-between items-start mb-2">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-48"></div>
      </div>
    ))}
  </div>
);

// 전체 러닝 상세 스켈레톤
export const RunningDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto p-4 space-y-6">
    {/* 헤더 스켈레톤 */}
    <div className="flex justify-between items-center mb-6">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
      <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
    </div>

    {/* 차트 영역 스켈레톤 */}
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
      <div className="grid md:grid-cols-7 gap-2">
        {Array.from({length: 7}).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>

    {/* 메인 콘텐츠 스켈레톤 */}
    <div className="grid lg:grid-cols-3 gap-6">
      {/* 바 그래프 */}
      <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
        <BarChartSkeleton />
        <RunningListSkeleton />
      </div>

      {/* 도넛 그래프 */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <DonutChartSkeleton />
      </div>
    </div>
  </div>
);
