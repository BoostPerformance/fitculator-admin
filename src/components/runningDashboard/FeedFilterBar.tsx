'use client';

export type FeedFilter = 'notes' | 'photos' | 'daily_program' | 'has_comments' | 'no_comments' | 'competition';

interface FeedFilterBarProps {
 activeFilters: Set<FeedFilter>;
 onFilterToggle: (filter: FeedFilter) => void;
 counts?: Partial<Record<FeedFilter, number>>;
 useDailyPrograms?: boolean;
}

const FILTER_ORDER: FeedFilter[] = ['notes', 'photos', 'daily_program', 'has_comments', 'no_comments', 'competition'];

export default function FeedFilterBar({ activeFilters, onFilterToggle, counts, useDailyPrograms }: FeedFilterBarProps) {
 const filterLabels: Record<FeedFilter, string> = {
  notes: '노트',
  photos: '사진',
  daily_program: useDailyPrograms ? '데일리 프로그램' : '미션',
  has_comments: '코멘트 있음',
  no_comments: '코멘트 없음',
  competition: '대회',
 };
 return (
  <div className="flex gap-1.5 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden pb-1">
   {FILTER_ORDER.map((filter) => {
    const isActive = activeFilters.has(filter);
    const count = counts?.[filter];

    return (
     <button
      key={filter}
      type="button"
      onClick={() => onFilterToggle(filter)}
      className={`flex-shrink-0 px-3 py-1.5 text-[12px] rounded-full border transition-colors ${
       isActive
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
        : 'border-line text-content-tertiary hover:border-blue-300 hover:text-content-secondary'
      }`}
     >
      {filterLabels[filter]}
      {count !== undefined && (
       <span className={`ml-1 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-content-disabled'}`}>
        ({count})
       </span>
      )}
     </button>
    );
   })}
  </div>
 );
}
