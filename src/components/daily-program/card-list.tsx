'use client';

import React, { useState } from 'react';
import type { DailyProgramCard } from '@/types/daily-program';
import { CardItem } from './card-item';
import { CardForm } from './card-form';

interface CardListProps {
 programId: string;
 cards: DailyProgramCard[];
 onCardsChanged: () => void;
}

export function CardList({ programId, cards, onCardsChanged }: CardListProps) {
 const [addingCard, setAddingCard] = useState(false);

 const handleReorder = async (fromIndex: number, toIndex: number) => {
 if (fromIndex === toIndex) return;

 const newCards = [...cards];
 const [moved] = newCards.splice(fromIndex, 1);
 newCards.splice(toIndex, 0, moved);

 const cardIds = newCards.map((c) => c.id);

 try {
 await fetch('/api/daily-program-cards', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id: 'reorder', action: 'reorder', card_ids: cardIds }),
 });
 onCardsChanged();
 } catch (error) {
 console.error('Failed to reorder cards:', error);
 }
 };

 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-content-secondary">
 카드 ({cards.length})
 </h3>
 {!addingCard && (
 <button
 onClick={() => setAddingCard(true)}
 className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
 >
 + 카드 추가
 </button>
 )}
 </div>

 {/* Card items */}
 <div className="space-y-2">
 {cards.map((card, index) => (
 <CardItem
 key={card.id}
 card={card}
 programId={programId}
 onCardsChanged={onCardsChanged}
 />
 ))}
 </div>

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
 <div className="text-center py-6 text-sm text-content-disabled">
 카드가 없습니다. 카드를 추가해보세요.
 </div>
 )}
 </div>
 );
}
