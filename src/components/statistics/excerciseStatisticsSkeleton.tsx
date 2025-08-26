'use client';

export function ExcerciseStatisticsSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-1 gap-4 px-8 pb-[3rem] sm:px-3">
      {[1, 2, 3].map((index) => (
        <div key={index} className="w-full h-full overflow-hidden dark:bg-blue-4">
          <div className="flex flex-col py-[1.25rem] lg:w-full min-h-[8.5rem] bg-white justify-center border-b-[0.4rem] border-gray-200 px-[1.3rem] rounded-lg border sm:items-center sm:gap-[0.6rem] md:items-center md:justify-between md:w-full md:max-h-[8rem] md:p-0 md:py-[1rem] w-full animate-pulse">
            {/* Title Skeleton */}
            <div className="h-5 bg-gray-200 rounded w-32 sm:mx-auto mb-2"></div>
            
            {/* Count Skeleton */}
            <div className="flex items-center justify-end sm:justify-center gap-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              {index === 2 && (
                <>
                  <div className="h-6 bg-gray-200 rounded w-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}