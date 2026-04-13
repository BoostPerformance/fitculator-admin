'use client';

import React, { useState } from 'react';
import {
 DndContext, closestCenter,
 PointerSensor, useSensor, useSensors,
 type DragEndEvent,
} from '@dnd-kit/core';
import {
 SortableContext, verticalListSortingStrategy,
 useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DailyProgramCard } from '@/types/daily-program';
import { CardItem } from './card-item';
import { CardForm } from './card-form';

interface CardListProps {
 programId: string;
 cards: DailyProgramCard[];
 onCardsChanged: () => void;
 onCardsReordered?: (cards: DailyProgramCard[]) => void;
 defaultAddingCard?: boolean;
}

function SortableCardItem({
 card,
 programId,
 onCardsChanged,
}: {
 card: DailyProgramCard;
 programId: string;
 onCardsChanged: () => void;
}) {
 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
 } = useSortable({ id: card.id });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : undefined,
 };

 return (
  <div ref={setNodeRef} style={style} {...attributes}>
   <CardItem
    card={card}
    programId={programId}
    onCardsChanged={onCardsChanged}
    dragHandleProps={listeners}
   />
  </div>
 );
}

export function CardList({ programId, cards, onCardsChanged, onCardsReordered, defaultAddingCard = false }: CardListProps) {
 const [addingCard, setAddingCard] = useState(defaultAddingCard);
 const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
 );

 const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = cards.findIndex((c) => c.id === active.id);
  const newIndex = cards.findIndex((c) => c.id === over.id);
  if (oldIndex === -1 || newIndex === -1) return;

  const reordered = arrayMove(cards, oldIndex, newIndex);

  // Optimistic UI update
  onCardsReordered(reordered);

  // Background API call
  const cardIds = reordered.map((c) => c.id);
  fetch('/api/daily-program-cards', {
   method: 'PUT',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ id: 'reorder', action: 'reorder', card_ids: cardIds }),
  }).catch(() => {
   onCardsChanged();
  });
 };

 return (
  <div className="space-y-3">
   <div className="flex items-center justify-between">
    <h3 className="text-body font-semibold text-content-secondary">
     카드 ({cards.length})
    </h3>
    {!addingCard && (
     <button
      onClick={() => setAddingCard(true)}
      className="px-2.5 py-1 text-body bg-accent text-white rounded-md hover:bg-accent-hover transition-colors font-medium"
     >
      + 카드 추가
     </button>
    )}
   </div>

   {/* Card items with drag reorder */}
   <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
     <div className="space-y-2">
      {cards.map((card) => (
       <SortableCardItem
        key={card.id}
        card={card}
        programId={programId}
        onCardsChanged={onCardsChanged}
       />
      ))}
     </div>
    </SortableContext>
   </DndContext>

   {/* Add new card form */}
   {addingCard && (
    <CardForm
     programId={programId}
     onSave={() => {
      setAddingCard(false);
      onCardsChanged();
     }}
     onCancel={() => setAddingCard(false)}
    />
   )}

   {cards.length === 0 && !addingCard && (
    <div className="text-center py-6 text-body text-content-disabled">
     카드가 없습니다. 카드를 추가해보세요.
    </div>
   )}
  </div>
 );
}
