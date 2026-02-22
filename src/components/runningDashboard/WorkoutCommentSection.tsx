'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState, useRef, useEffect } from 'react';

interface CommentAuthor {
 id: string;
 name: string;
 profile_image_url: string | null;
}

interface CommentReply {
 id: string;
 comment_id: string;
 author_id: string;
 content: string;
 created_at: string;
 author: CommentAuthor;
}

interface Comment {
 id: string;
 workout_id: string;
 challenge_id: string;
 author_id: string;
 target_user_id: string;
 content: string;
 visibility: string;
 created_at: string;
 author: CommentAuthor;
 replies: CommentReply[];
}

interface CommentPreviewData {
 id: string;
 author_id: string;
 author_name: string;
 author_profile_image: string | null;
 content: string;
 created_at: string;
}

interface CoachInfo {
 userId: string;
 name: string;
 profileImageUrl: string | null;
}

interface WorkoutCommentSectionProps {
 workoutId: string;
 challengeId: string;
 commentCount?: number;
 previews?: CommentPreviewData[];
 coachInfo?: CoachInfo | null;
}

const formatTimestamp = (timestamp: string) => {
 try {
  const result = formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ko });
  return result.replace('약 ', '');
 } catch {
  return '';
 }
};

// ... 드롭다운 메뉴
function CommentMenu({
 onEdit,
 onDelete,
}: {
 onEdit: () => void;
 onDelete: () => void;
}) {
 const [open, setOpen] = useState(false);
 const menuRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
    setOpen(false);
   }
  };
  if (open) document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [open]);

 return (
  <div ref={menuRef} className="relative ml-auto">
   <button
    onClick={() => setOpen(!open)}
    className="opacity-0 group-hover:opacity-100 transition-opacity px-1 text-content-disabled hover:text-content-tertiary"
   >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
     <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
   </button>
   {open && (
    <div className="absolute right-0 top-5 z-10 bg-surface border border-line rounded-lg shadow-lg py-1 min-w-[80px]">
     <button
      onClick={() => { setOpen(false); onEdit(); }}
      className="w-full text-left px-3 py-1.5 text-[12px] text-content-secondary hover:bg-surface-raised transition-colors"
     >
      편집
     </button>
     <button
      onClick={() => { setOpen(false); onDelete(); }}
      className="w-full text-left px-3 py-1.5 text-[12px] text-red-400 hover:bg-surface-raised transition-colors"
     >
      삭제
     </button>
    </div>
   )}
  </div>
 );
}

export default function WorkoutCommentSection({
 workoutId,
 challengeId,
 commentCount = 0,
 previews = [],
 coachInfo,
}: WorkoutCommentSectionProps) {
 const queryClient = useQueryClient();
 const [newComment, setNewComment] = useState('');
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editContent, setEditContent] = useState('');
 const [hasComments, setHasComments] = useState(commentCount > 0);
 const needsFetch = hasComments && commentCount > previews.length;
 const editInputRef = useRef<HTMLInputElement>(null);

 // 미리보기를 Comment 형식으로 변환
 const placeholderComments: Comment[] = previews.map((p) => ({
  id: p.id,
  workout_id: workoutId,
  challenge_id: challengeId,
  author_id: p.author_id,
  target_user_id: '',
  content: p.content,
  visibility: 'private',
  created_at: p.created_at,
  author: { id: p.author_id, name: p.author_name, profile_image_url: p.author_profile_image },
  replies: [],
 }));

 useEffect(() => {
  if (editingId && editInputRef.current) {
   editInputRef.current.focus();
  }
 }, [editingId]);

 const { data, isLoading } = useQuery({
  queryKey: ['workout-comments', workoutId, challengeId],
  queryFn: async () => {
   const res = await fetch(
    `/api/workout-comments?workoutIds=${workoutId}&challengeId=${challengeId}`
   );
   if (!res.ok) throw new Error('Failed to fetch comments');
   const json = await res.json();
   return (json.data[workoutId] || []) as Comment[];
  },
  staleTime: 60 * 1000,
  enabled: needsFetch,
  placeholderData: placeholderComments.length > 0 ? placeholderComments : undefined,
 });

 const invalidateAll = () => {
  queryClient.invalidateQueries({ queryKey: ['workout-comments', workoutId, challengeId] });
  queryClient.invalidateQueries({ queryKey: ['running', 'recent-notes'] });
 };

 const queryKey = ['workout-comments', workoutId, challengeId];

 const postMutation = useMutation({
  mutationFn: async (content: string) => {
   const res = await fetch('/api/workout-comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workout_id: workoutId, challenge_id: challengeId, content }),
   });
   if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '코멘트 저장 실패');
   }
   return res.json();
  },
  onMutate: async (content: string) => {
   setNewComment('');
   setHasComments(true);
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<Comment[]>(queryKey);
   const optimistic: Comment = {
    id: `temp-${Date.now()}`,
    workout_id: workoutId,
    challenge_id: challengeId,
    author_id: coachInfo?.userId || '',
    target_user_id: '',
    content,
    visibility: 'private',
    created_at: new Date().toISOString(),
    author: {
     id: coachInfo?.userId || '',
     name: coachInfo?.name || '코치',
     profile_image_url: coachInfo?.profileImageUrl || null,
    },
    replies: [],
   };
   queryClient.setQueryData<Comment[]>(queryKey, (old) => [...(old || []), optimistic]);
   return { previous };
  },
  onError: (_err, _content, context) => {
   if (context?.previous) {
    queryClient.setQueryData(queryKey, context.previous);
   }
  },
  onSettled: () => {
   invalidateAll();
  },
 });

 const editMutation = useMutation({
  mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
   const res = await fetch('/api/workout-comments', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment_id: commentId, content }),
   });
   if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '수정 실패');
   }
   return res.json();
  },
  onMutate: async ({ commentId, content }) => {
   setEditingId(null);
   setEditContent('');
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<Comment[]>(queryKey);
   queryClient.setQueryData<Comment[]>(queryKey, (old) =>
    (old || []).map((c) => c.id === commentId ? { ...c, content } : c)
   );
   return { previous };
  },
  onError: (_err, _vars, context) => {
   if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
  },
  onSettled: () => invalidateAll(),
 });

 const deleteMutation = useMutation({
  mutationFn: async (commentId: string) => {
   const res = await fetch(`/api/workout-comments?commentId=${commentId}`, {
    method: 'DELETE',
   });
   if (!res.ok) throw new Error('삭제 실패');
   return res.json();
  },
  onMutate: async (commentId: string) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<Comment[]>(queryKey);
   const next = (previous || []).filter((c) => c.id !== commentId);
   queryClient.setQueryData<Comment[]>(queryKey, next);
   if (next.length === 0) setHasComments(false);
   return { previous };
  },
  onError: (_err, _id, context) => {
   if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
   setHasComments(true);
  },
  onSettled: () => invalidateAll(),
 });

 const handleSubmit = () => {
  if (!newComment.trim() || postMutation.isPending) return;
  postMutation.mutate(newComment.trim());
 };

 const handleEditSubmit = () => {
  if (!editingId || !editContent.trim() || editMutation.isPending) return;
  editMutation.mutate({ commentId: editingId, content: editContent.trim() });
 };

 const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
   e.preventDefault();
   handleSubmit();
  }
 };

 const handleEditKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
   e.preventDefault();
   handleEditSubmit();
  }
  if (e.key === 'Escape') {
   setEditingId(null);
   setEditContent('');
  }
 };

 const comments = data || placeholderComments;

 return (
  <div className="mt-3 pt-3 border-t border-line-subtle">
   {/* 코멘트 목록 */}
   {isLoading && comments.length === 0 ? (
    <div className="flex items-center justify-center py-3">
     <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-blue-500"></div>
    </div>
   ) : (
    <>
     {comments.length > 0 && (
      <div className="space-y-3 mb-3">
       {comments.map((comment) => (
        <div key={comment.id}>
         {/* 코멘트 */}
         <div className="group flex gap-2">
          {comment.author.profile_image_url ? (
           <img
            src={comment.author.profile_image_url}
            alt=""
            className="flex-shrink-0 w-6 h-6 rounded-full object-cover"
           />
          ) : (
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 w-6 h-6 text-neutral-300 dark:text-neutral-600">
            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
           </svg>
          )}
          <div className="flex-1 min-w-0">
           <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-content-secondary">
             {comment.author.name}
            </span>
            <span className="text-[10px] text-content-disabled">
             {formatTimestamp(comment.created_at)}
            </span>
            <CommentMenu
             onEdit={() => {
              setEditingId(comment.id);
              setEditContent(comment.content);
             }}
             onDelete={() => {
              if (confirm('코멘트를 삭제하시겠습니까?')) {
               deleteMutation.mutate(comment.id);
              }
             }}
            />
           </div>
           {editingId === comment.id ? (
            <div className="flex gap-1.5 mt-1">
             <input
              ref={editInputRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="flex-1 text-[12px] px-2 py-1 rounded border border-blue-400 bg-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-blue-400/30"
              disabled={editMutation.isPending}
             />
             <button
              onClick={handleEditSubmit}
              disabled={!editContent.trim() || editMutation.isPending}
              className="text-[11px] px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
             >
              {editMutation.isPending ? '...' : '저장'}
             </button>
             <button
              onClick={() => { setEditingId(null); setEditContent(''); }}
              className="text-[11px] px-2 py-1 rounded text-content-disabled hover:text-content-tertiary transition-colors"
             >
              취소
             </button>
            </div>
           ) : (
            <p className="text-[12px] text-content-secondary whitespace-pre-wrap break-words mt-0.5">
             {comment.content}
            </p>
           )}
          </div>
         </div>

         {/* 답글 */}
         {comment.replies?.length > 0 && (
          <div className="ml-8 mt-2 space-y-2">
           {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
             <div className="flex-shrink-0 text-content-disabled text-[11px] mt-0.5">↳</div>
             <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
               <span className="text-[11px] font-medium text-content-tertiary">
                {reply.author.name}
               </span>
               <span className="text-[10px] text-content-disabled">
                {formatTimestamp(reply.created_at)}
               </span>
              </div>
              <p className="text-[11px] text-content-tertiary whitespace-pre-wrap break-words mt-0.5">
               {reply.content}
              </p>
             </div>
            </div>
           ))}
          </div>
         )}
        </div>
       ))}
      </div>
     )}

    </>
   )}

   {/* 코멘트 입력 (항상 표시) */}
   <div className="flex gap-2 mt-2">
    <input
     type="text"
     value={newComment}
     onChange={(e) => setNewComment(e.target.value)}
     onKeyDown={handleKeyDown}
     placeholder="코멘트 입력..."
     className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border border-line bg-surface text-content-primary placeholder:text-content-disabled focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
     disabled={postMutation.isPending}
    />
    <button
     onClick={handleSubmit}
     disabled={!newComment.trim() || postMutation.isPending}
     className="p-1.5 rounded-lg text-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
     {postMutation.isPending ? (
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
     ) : (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
       <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
      </svg>
     )}
    </button>
   </div>

   {/* 에러 표시 */}
   {(postMutation.isError || editMutation.isError) && (
    <p className="text-[11px] text-red-400 mt-1">
     {postMutation.error?.message || editMutation.error?.message || '코멘트 저장에 실패했습니다'}
    </p>
   )}
  </div>
 );
}
