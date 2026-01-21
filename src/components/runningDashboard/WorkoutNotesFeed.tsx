'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRef, useCallback, useState } from 'react';

// 노트 내용 컴포넌트 (펼치기/접기 기능)
function NoteContent({ note }: { note: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = note.length > 150 || note.split('\n').length > 3;

  return (
    <div>
      <p
        className={`text-[12px] text-[#5A5A5A] dark:text-gray-400 whitespace-pre-wrap break-words leading-relaxed ${
          !isExpanded && isLong ? 'line-clamp-3' : ''
        }`}
      >
        {note}
      </p>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-1"
        >
          {isExpanded ? '접기' : '더보기'}
        </button>
      )}
    </div>
  );
}

interface WorkoutNote {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  category: string;
  timestamp: string;
  duration_minutes: number | null;
  distance: number | null;
  points: number | null;
  note: string;
  intensity: number | null;
  pace: string | null;
  group_name: string | null;
  group_color: string | null;
  mission_title: string | null;
}

interface WorkoutNotesFeedProps {
  challengeId: string;
  limit?: number;
}

interface NotesResponse {
  notes: WorkoutNote[];
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 10;

const fetchRecentNotes = async (
  challengeId: string,
  offset: number,
  limit: number
): Promise<NotesResponse> => {
  const response = await fetch(
    `/api/workouts/user-detail?type=recent-notes&challengeId=${challengeId}&limit=${limit}&offset=${offset}&t=${Date.now()}`
  );
  if (!response.ok) throw new Error('Failed to fetch notes');
  return response.json();
};

export default function WorkoutNotesFeed({ challengeId }: WorkoutNotesFeedProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['running', 'recent-notes', challengeId],
    queryFn: ({ pageParam = 0 }) => fetchRecentNotes(challengeId, pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce((acc, page) => acc + page.notes.length, 0);
    },
    initialPageParam: 0,
    enabled: !!challengeId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // 마지막 요소 관찰을 위한 ref callback
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  if (isLoading) {
    return (
      <div className="col-span-2 bg-white dark:bg-gray-800 rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto shadow dark:shadow-gray-900">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-2 bg-white dark:bg-gray-800 rounded-[0.625rem] p-[1.25rem] h-[36rem] shadow dark:shadow-gray-900">
        <p className="text-red-500">운동 노트를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const result = formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ko });
      return result.replace('약 ', '');
    } catch {
      return '';
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  const allNotes = data?.pages.flatMap((page) => page.notes) || [];

  return (
    <div className="col-span-2 bg-white dark:bg-gray-800 rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-700 shadow dark:shadow-gray-900">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#6F6F6F] dark:text-gray-300 pt-1 pl-1">
          운동 노트
        </h2>
      </div>

      {/* 노트 목록 */}
      <div className="space-y-3">
        {allNotes.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            아직 운동 노트가 없습니다
          </div>
        ) : (
          <>
            {allNotes.map((note, index) => (
              <div
                key={note.id}
                ref={index === allNotes.length - 1 ? lastElementRef : null}
                className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* 1행: 사용자 이름 + 그룹 + 시간 */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#4A4A4A] dark:text-gray-200 text-[13px]">
                      {note.user_name}
                    </span>
                    {note.group_name && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                        style={{ backgroundColor: note.group_color || '#6366f1' }}
                      >
                        {note.group_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                    <span>
                      {new Date(note.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}{' '}
                      {new Date(note.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {/* <span className="text-gray-300">|</span>
                    <span>{formatTimestamp(note.timestamp)}</span> */}
                  </div>
                </div>

                {/* 2행: 운동 타이틀 */}
                <div className="mb-2">
                  <span className="font-medium text-[12px] text-[#6F6F6F] dark:text-gray-300">{note.title}</span>
                </div>

                {/* 3행: 운동 정보 (Zone, 거리, 시간, 페이스) */}
                <div className="flex items-center gap-3 mb-2 text-[12px] text-[#6F6F6F] dark:text-gray-300">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                    style={{
                      backgroundColor: !note.intensity || note.intensity === 0 ? '#9CA3AF' :
                                       note.intensity === 1 ? '#22C55E' :
                                       note.intensity === 2 ? '#3B82F6' :
                                       note.intensity === 3 ? '#F59E0B' :
                                       note.intensity === 4 ? '#F97316' :
                                       '#EF4444'
                    }}
                  >
                    {note.intensity && note.intensity > 0 ? `Zone ${note.intensity}` : '-'}
                  </span>
                  {note.distance && note.distance > 0 && (
                    <span>{note.distance.toFixed(2)}km</span>
                  )}
                  {note.duration_minutes && note.duration_minutes > 0 && (
                    <span>{formatDuration(note.duration_minutes)}</span>
                  )}
                  {note.pace && (
                    <span className="text-gray-400 dark:text-gray-500">{note.pace}/km</span>
                  )}
                </div>

                {/* 3행: 미션 (있을 경우) */}
                {note.mission_title && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-purple-50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                      🚩 {note.mission_title}
                    </span>
                  </div>
                )}

                {/* 4행: 노트 내용 */}
                <NoteContent note={note.note} />
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="text-center py-2">
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-blue-500"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
