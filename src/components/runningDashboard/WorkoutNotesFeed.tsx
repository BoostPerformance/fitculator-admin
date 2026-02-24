'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRef, useCallback, useState } from 'react';
import WorkoutCommentSection from './WorkoutCommentSection';
import FeedFilterBar, { type FeedFilter } from './FeedFilterBar';

// 노트 내용 컴포넌트 (펼치기/접기 기능)
function NoteContent({ note }: { note: string }) {
 const [isExpanded, setIsExpanded] = useState(false);
 const isLong = note.length > 150 || note.split('\n').length > 3;

 return (
 <div>
 <p
 className={`text-[12px] text-content-secondary whitespace-pre-wrap break-words leading-relaxed ${
 !isExpanded && isLong ? 'line-clamp-3' : ''
 }`}
 >
 {note}
 </p>
 {isLong && (
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="text-[11px] text-blue-100 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-1"
 >
 {isExpanded ? '접기' : '더보기'}
 </button>
 )}
 </div>
 );
}

// 사진 갤러리 컴포넌트 (인스타 스타일)
function PhotoGallery({ photos }: { photos: string[] }) {
 const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

 if (photos.length === 0) return null;

 return (
 <>
 <div className="mb-3 overflow-hidden">
  {photos.length === 1 ? (
  <img
   src={photos[0]}
   alt=""
   className="w-full max-h-[280px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
   onClick={() => setSelectedPhoto(photos[0])}
  />
  ) : (
  <div className="grid grid-cols-2 gap-0.5">
   <img
   src={photos[0]}
   alt=""
   className="w-full h-[180px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
   onClick={() => setSelectedPhoto(photos[0])}
   />
   <div className="relative">
   <img
    src={photos[1]}
    alt=""
    className="w-full h-[180px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
    onClick={() => setSelectedPhoto(photos[1])}
   />
   {photos.length > 2 && (
    <div
    className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
    onClick={() => setSelectedPhoto(photos[1])}
    >
    <span className="text-white font-semibold text-lg">+{photos.length - 2}</span>
    </div>
   )}
   </div>
  </div>
  )}
 </div>

 {/* 풀스크린 모달 */}
 {selectedPhoto && (
  <div
  className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
  onClick={() => setSelectedPhoto(null)}
  >
  <img
   src={selectedPhoto}
   alt=""
   className="max-w-[90vw] max-h-[90vh] object-contain"
   onClick={(e) => e.stopPropagation()}
  />
  <button
   onClick={() => setSelectedPhoto(null)}
   className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
  >
   ✕
  </button>
  {/* 썸네일 네비게이션 */}
  {photos.length > 1 && (
   <div className="absolute bottom-6 flex gap-2">
   {photos.map((url, i) => (
    <button
    key={i}
    onClick={(e) => { e.stopPropagation(); setSelectedPhoto(url); }}
    className={`w-12 h-12 overflow-hidden border-2 transition-all ${
     selectedPhoto === url ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
    }`}
    >
    <img src={url} alt="" className="w-full h-full object-cover" />
    </button>
   ))}
   </div>
  )}
  </div>
 )}
 </>
 );
}

interface CommentPreview {
 id: string;
 author_id: string;
 author_name: string;
 author_profile_image: string | null;
 content: string;
 created_at: string;
}

interface WorkoutNote {
 id: string;
 user_id: string;
 user_name: string;
 user_profile_image: string | null;
 title: string;
 category: string;
 start_time: string;
 duration_minutes: number | null;
 distance: number | null;
 points: number | null;
 note: string | null;
 intensity: number | null;
 pace: string | null;
 calories: number | null;
 avg_heart_rate: number | null;
 max_heart_rate: number | null;
 group_name: string | null;
 group_color: string | null;
 mission_title: string | null;
 comment_count: number;
 comment_previews: CommentPreview[];
 photos: string[];
}

interface WorkoutNotesFeedProps {
 challengeId: string;
 limit?: number;
 startDate?: string;
 endDate?: string;
 useDailyPrograms?: boolean;
}

interface NotesResponse {
 notes: WorkoutNote[];
 hasMore: boolean;
}

const ITEMS_PER_PAGE = 10;

const formatTimestamp = (startTime: string) => {
 try {
 const result = formatDistanceToNow(new Date(startTime), { addSuffix: true, locale: ko });
 return result.replace('약 ', '');
 } catch {
 return '';
 }
};

const fetchRecentNotes = async (
 challengeId: string,
 offset: number,
 limit: number,
 startDate?: string,
 endDate?: string,
 filters?: string[],
 useDailyPrograms?: boolean
): Promise<NotesResponse> => {
 let url = `/api/workouts/user-detail?type=recent-notes&challengeId=${challengeId}&limit=${limit}&offset=${offset}&t=${Date.now()}`;
 if (startDate) url += `&startDate=${startDate}`;
 if (endDate) url += `&endDate=${endDate}`;
 if (filters && filters.length > 0) url += `&filter=${filters.join(',')}`;
 if (useDailyPrograms) url += `&useDailyPrograms=true`;
 const response = await fetch(url);
 if (!response.ok) throw new Error('Failed to fetch notes');
 return response.json();
};

const fetchFeedCounts = async (
 challengeId: string,
 startDate?: string,
 endDate?: string,
 useDailyPrograms?: boolean
): Promise<Record<string, number>> => {
 let url = `/api/workouts/user-detail?type=feed-counts&challengeId=${challengeId}&t=${Date.now()}`;
 if (startDate) url += `&startDate=${startDate}`;
 if (endDate) url += `&endDate=${endDate}`;
 if (useDailyPrograms) url += `&useDailyPrograms=true`;
 const response = await fetch(url);
 if (!response.ok) throw new Error('Failed to fetch feed counts');
 return response.json();
};

export default function WorkoutNotesFeed({ challengeId, startDate, endDate, useDailyPrograms }: WorkoutNotesFeedProps) {
 const observerRef = useRef<IntersectionObserver | null>(null);
 const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
 const [isSpinning, setIsSpinning] = useState(false);
 const [activeFilters, setActiveFilters] = useState<Set<FeedFilter>>(new Set());

 const handleFilterToggle = (filter: FeedFilter) => {
  setActiveFilters((prev) => {
   const next = new Set(prev);
   if (next.has(filter)) {
    next.delete(filter);
   } else {
    // 상호 배타 처리: has_comments <-> no_comments
    if (filter === 'has_comments') next.delete('no_comments');
    if (filter === 'no_comments') next.delete('has_comments');
    next.add(filter);
   }
   return next;
  });
 };

 const activeFilterArray = [...activeFilters];

 // 현재 코치의 users.id 조회 (본인 코멘트 표시용)
 const { data: coachIdentity } = useQuery({
 queryKey: ['coach-identity'],
 queryFn: async () => {
 const res = await fetch('/api/coach-identity');
 if (!res.ok) return null;
 const json = await res.json();
 return json.data as { userId: string; coachId: string; name: string; profileImageUrl: string | null } | null;
 },
 staleTime: Infinity,
 });
 const myUserId = coachIdentity?.userId;

 // 필터별 건수 조회
 const { data: feedCounts, refetch: refetchCounts } = useQuery({
  queryKey: ['running', 'feed-counts', challengeId, startDate, endDate],
  queryFn: () => fetchFeedCounts(challengeId, startDate, endDate, useDailyPrograms),
  enabled: !!challengeId,
  staleTime: 30 * 1000,
  refetchOnWindowFocus: false,
 });

 const {
 data,
 isLoading,
 error,
 fetchNextPage,
 hasNextPage,
 isFetchingNextPage,
 refetch,
 isRefetching,
 } = useInfiniteQuery({
 queryKey: ['running', 'recent-notes', challengeId, startDate, endDate, activeFilterArray],
 queryFn: ({ pageParam = 0 }) => fetchRecentNotes(challengeId, pageParam, ITEMS_PER_PAGE, startDate, endDate, activeFilterArray.length > 0 ? activeFilterArray : undefined, useDailyPrograms),
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
 <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto shadow dark:shadow-neutral-900 border border-line">
 <div className="animate-pulse">
 <div className="h-6 bg-surface-sunken rounded w-1/3 mb-4"></div>
 <div className="space-y-4">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="space-y-2">
 <div className="h-4 bg-surface-raised rounded w-1/4"></div>
 <div className="h-16 bg-surface-raised rounded"></div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] shadow dark:shadow-neutral-900 border border-line">
 <p className="text-red-500">운동 피드를 불러오는데 실패했습니다.</p>
 </div>
 );
 }

 const formatDuration = (minutes: number | null) => {
 if (!minutes) return null;
 if (minutes < 60) return `${minutes}분`;
 const hours = Math.floor(minutes / 60);
 const mins = minutes % 60;
 return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
 };

 const allNotes = data?.pages.flatMap((page) => page.notes) || [];

 return (
 <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-surface-raised dark:[&::-webkit-scrollbar-track]:bg-neutral-700 shadow dark:shadow-neutral-900 border border-line">
 {/* 헤더 */}
 <div className="flex justify-between items-center mb-3">
 <h2 className="text-lg font-semibold text-content-tertiary pt-1">
 운동 피드
 </h2>
 <button
 onClick={() => {
  setIsSpinning(true);
  Promise.all([refetch(), refetchCounts()]).finally(() => setTimeout(() => setIsSpinning(false), 600));
 }}
 disabled={isSpinning}
 title="새로고침"
 className="p-1.5 rounded-md text-content-disabled hover:text-content-tertiary hover:bg-surface-raised transition-colors disabled:opacity-50"
 >
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-4 h-4 transition-transform ${isSpinning ? 'animate-spin' : ''}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.015 4.356v4.992" />
 </svg>
 </button>
 </div>

 {/* 필터 바 */}
 <div className="mb-3">
 <FeedFilterBar
  activeFilters={activeFilters}
  onFilterToggle={handleFilterToggle}
  counts={feedCounts as Partial<Record<FeedFilter, number>> | undefined}
  useDailyPrograms={useDailyPrograms}
 />
 </div>

 {/* 노트 목록 */}
 <div className="space-y-4">
 {allNotes.length === 0 ? (
 <div className="text-center text-content-tertiary py-4">
 {activeFilters.size > 0 ? '해당 조건의 운동이 없습니다' : '아직 운동 기록이 없습니다'}
 </div>
 ) : (
 <>
 {allNotes.map((note, index) => {
 const isExpanded = expandedNoteId === note.id;

 return (
 <div
 key={note.id}
 ref={index === allNotes.length - 1 ? lastElementRef : null}
 className="overflow-hidden bg-white/50 dark:bg-black/20 -mx-[1.25rem]"
 >
 <div className="px-[1.25rem] pt-4 pb-2">
 {/* 1행: 사용자 이름 + 그룹 + 시간 */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <img
  src={note.user_profile_image || undefined}
  alt=""
  className="w-7 h-7 rounded-full object-cover"
  style={{ display: note.user_profile_image ? undefined : 'none' }}
  onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = ''; }}
 />
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-neutral-300 dark:text-neutral-600" style={{ display: note.user_profile_image ? 'none' : undefined }}>
  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
 </svg>
 <span className="font-semibold text-content-secondary text-[13px]">
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
 <div className="flex items-center gap-2 text-[11px] text-content-disabled">
 <span>
  {new Date(note.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}{' '}
  {new Date(note.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 </div>
 </div>

 {/* 사진 (이름 아래) */}
 {note.photos.length > 0 && (
 <PhotoGallery photos={note.photos} />
 )}

 <div className="px-[1.25rem] pb-4">
 {/* 2행: 운동 타이틀 */}
 <div className="mb-2">
 <span className="font-medium text-[12px] text-content-tertiary">{note.title}</span>
 </div>

 {/* 3행: 운동 정보 (Zone, 거리, 시간, 페이스 등) */}
 <div className="flex items-center gap-3 mb-2 text-[12px] text-content-tertiary flex-wrap">
 <span
  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
  style={{
  borderColor: note.intensity === null || note.intensity === undefined ? '#9CA3AF' :
  note.intensity === 0 ? '#9CA3AF' :
  note.intensity === 1 ? '#45C771' :
  note.intensity === 2 ? '#FFD600' :
  note.intensity === 3 ? '#73DDFF' :
  note.intensity === 4 ? '#A259FE' :
  '#FF1469',
  color: note.intensity === null || note.intensity === undefined ? '#9CA3AF' :
  note.intensity === 0 ? '#9CA3AF' :
  note.intensity === 1 ? '#45C771' :
  note.intensity === 2 ? '#FFD600' :
  note.intensity === 3 ? '#73DDFF' :
  note.intensity === 4 ? '#A259FE' :
  '#FF1469',
  }}
 >
  {note.intensity !== null && note.intensity !== undefined ? `Zone ${note.intensity}` : '-'}
 </span>
 {note.distance != null && note.distance > 0 && (
  <span>{note.distance.toFixed(2)}km</span>
 )}
 {note.duration_minutes != null && note.duration_minutes > 0 && (
  <span>{formatDuration(note.duration_minutes)}</span>
 )}
 {note.pace && (
  <span className="text-content-disabled">{note.pace}/km</span>
 )}
 {note.calories != null && note.calories > 0 && (
  <span>{Math.round(note.calories)}kcal</span>
 )}
 {note.points != null && note.points > 0 && (
  <span>{note.points}pt</span>
 )}
 </div>

 {/* 4행: 심박수 (있을 경우) */}
 {(note.avg_heart_rate != null && note.avg_heart_rate > 0 || note.max_heart_rate != null && note.max_heart_rate > 0) && (
 <div className="flex items-center gap-3 mb-2 text-[11px] text-content-disabled">
  {note.avg_heart_rate != null && note.avg_heart_rate > 0 && (
  <span>평균 {note.avg_heart_rate}bpm</span>
  )}
  {note.max_heart_rate != null && note.max_heart_rate > 0 && (
  <span>최대 {note.max_heart_rate}bpm</span>
  )}
 </div>
 )}

 {/* 미션 (있을 경우) */}
 {note.mission_title && (
 <div className="mb-2">
  <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-purple-50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
  {note.mission_title}
  </span>
 </div>
 )}

 {/* 노트 내용 */}
 {note.note && <NoteContent note={note.note} />}

 {/* 코멘트 영역 (인스타 스타일) */}
 <div className="mt-3 pt-2 border-t border-line-subtle">
 {/* 코멘트 아이콘 + 카운트 */}
 <button
  onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
  className="flex items-center gap-1.5 text-[12px] text-content-disabled hover:text-content-tertiary transition-colors"
 >
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
  </svg>
  {note.comment_count > 0 && (
  <span className="font-semibold text-content-tertiary">{note.comment_count}</span>
  )}
 </button>

 {/* 코멘트 미리보기 (접혀있을 때) */}
 {!isExpanded && note.comment_previews.length > 0 && (
  <div className="mt-1.5 space-y-0.5">
  {note.comment_previews.map((preview) => {
   const isMe = myUserId && preview.author_id === myUserId;
   return (
   <p key={preview.id} className="text-[12px] leading-relaxed truncate">
    <span className="font-semibold text-content-secondary">{preview.author_name}</span>{' '}
    <span className="text-content-tertiary">{preview.content}</span>
   </p>
   );
  })}
  {note.comment_count > 2 && (
   <button
   onClick={() => setExpandedNoteId(note.id)}
   className="text-[12px] text-content-disabled hover:text-content-tertiary"
   >
   코멘트 {note.comment_count}개 모두 보기
   </button>
  )}
  </div>
 )}

 {/* 코멘트 섹션 (펼침 시) */}
 {isExpanded && (
  <WorkoutCommentSection
  workoutId={note.id}
  challengeId={challengeId}
  commentCount={note.comment_count}
  previews={note.comment_previews}
  coachInfo={coachIdentity ? { userId: coachIdentity.userId, name: coachIdentity.name, profileImageUrl: coachIdentity.profileImageUrl } : null}
  />
 )}
 </div>
 </div>
 </div>
 );
 })}
 {isFetchingNextPage && (
 <div className="text-center py-2">
 <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-blue-500"></div>
 </div>
 )}
 </>
 )}
 </div>
 </div>
 );
}
