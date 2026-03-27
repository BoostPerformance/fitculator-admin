'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReactionType {
 id: number;
 name: string;
 emoji: string;
 display_order: number;
}

interface ReactionCount {
 reactionTypeId: number;
 reactionName: string;
 emoji: string;
 count: number;
 hasReacted: boolean;
}

interface WorkoutReactionBarProps {
 workoutId: string;
}

export default function WorkoutReactionBar({ workoutId }: WorkoutReactionBarProps) {
 const [reactionTypes, setReactionTypes] = useState<ReactionType[]>([]);
 const [reactions, setReactions] = useState<ReactionCount[]>([]);
 const [toggling, setToggling] = useState<number | null>(null);
 const [showPicker, setShowPicker] = useState(false);

 const fetchReactions = useCallback(async () => {
  try {
   const res = await fetch(`/api/workout-reactions?workoutIds=${workoutId}`);
   if (!res.ok) return;
   const data = await res.json();
   setReactionTypes(data.reactionTypes || []);
   setReactions(data.reactions?.[workoutId] || []);
  } catch { /* ignore */ }
 }, [workoutId]);

 useEffect(() => {
  fetchReactions();
 }, [fetchReactions]);

 const handleToggle = async (reactionTypeId: number) => {
  if (toggling !== null) return;
  setToggling(reactionTypeId);

  // Optimistic update
  setReactions((prev) => {
   const existing = prev.find((r) => r.reactionTypeId === reactionTypeId);
   if (existing) {
    if (existing.hasReacted) {
     // Remove my reaction
     const newCount = existing.count - 1;
     if (newCount <= 0) return prev.filter((r) => r.reactionTypeId !== reactionTypeId);
     return prev.map((r) =>
      r.reactionTypeId === reactionTypeId
       ? { ...r, count: newCount, hasReacted: false }
       : r
     );
    } else {
     // Add my reaction
     return prev.map((r) =>
      r.reactionTypeId === reactionTypeId
       ? { ...r, count: r.count + 1, hasReacted: true }
       : r
     );
    }
   } else {
    // New reaction
    const type = reactionTypes.find((t) => t.id === reactionTypeId);
    if (!type) return prev;
    return [...prev, {
     reactionTypeId,
     reactionName: type.name,
     emoji: type.emoji,
     count: 1,
     hasReacted: true,
    }];
   }
  });

  try {
   await fetch('/api/workout-reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workout_id: workoutId, reaction_type_id: reactionTypeId }),
   });
  } catch {
   // Rollback on error
   fetchReactions();
  } finally {
   setToggling(null);
   setShowPicker(false);
  }
 };

 // Available types that the user hasn't reacted to yet
 const myReactedIds = new Set(reactions.filter((r) => r.hasReacted).map((r) => r.reactionTypeId));
 const availableTypes = reactionTypes.filter((t) => !myReactedIds.has(t.id));

 return (
  <div className="flex items-center gap-1.5 flex-wrap relative">
   {/* Existing reactions */}
   {reactions.map((r) => (
    <button
     key={r.reactionTypeId}
     onClick={(e) => { e.stopPropagation(); handleToggle(r.reactionTypeId); }}
     disabled={toggling !== null}
     className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] transition-colors disabled:opacity-60 ${
      r.hasReacted
       ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600'
       : 'bg-surface-raised border border-line hover:border-blue-200 dark:hover:border-blue-700'
     }`}
     title={r.reactionName}
    >
     <span>{r.emoji}</span>
     <span className={`font-medium ${r.hasReacted ? 'text-blue-600 dark:text-blue-400' : 'text-content-tertiary'}`}>
      {r.count}
     </span>
    </button>
   ))}

   {/* Add reaction button */}
   {availableTypes.length > 0 && (
    <div className="relative">
     <button
      onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
      className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-line hover:border-blue-200 dark:hover:border-blue-700 text-content-disabled hover:text-content-tertiary transition-colors"
      title="리액션 추가"
     >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
     </button>

     {/* Reaction picker popup */}
     {showPicker && (
      <>
       <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
       <div className="absolute bottom-full left-0 mb-1 z-50 bg-surface border border-line rounded-full shadow-lg px-1.5 py-1 flex items-center gap-0.5">
        {availableTypes.map((type) => (
         <button
          key={type.id}
          onClick={(e) => { e.stopPropagation(); handleToggle(type.id); }}
          className="w-7 h-7 rounded-full hover:bg-surface-raised flex items-center justify-center transition-colors text-base"
          title={type.name}
         >
          {type.emoji}
         </button>
        ))}
       </div>
      </>
     )}
    </div>
   )}
  </div>
 );
}
