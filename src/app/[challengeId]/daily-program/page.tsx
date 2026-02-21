'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
 format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
 addMonths, subMonths, addWeeks, subWeeks,
} from 'date-fns';
import {
 DndContext, DragOverlay, pointerWithin,
 type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import type { DailyProgram, DailyProgramCard, CalendarViewMode, ChallengeGroup, ProgramStatus } from '@/types/daily-program';
import { CalendarToolbar } from '@/components/daily-program/calendar-toolbar';
import { CalendarMonthView } from '@/components/daily-program/calendar-month-view';
import { CalendarWeekView } from '@/components/daily-program/calendar-week-view';
import { CalendarProgramChip } from '@/components/daily-program/calendar-program-chip';
import { ProgramDetailSheet } from '@/components/daily-program/program-detail-sheet';
import { CardEditDialog } from '@/components/daily-program/card-edit-dialog';
import Title from '@/components/layout/title';

export default function DailyProgramPage() {
 const params = useParams();
 const challengeId = params.challengeId as string;

 const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
 const [currentDate, setCurrentDate] = useState(new Date());
 const [programs, setPrograms] = useState<DailyProgram[]>([]);
 const [groups, setGroups] = useState<ChallengeGroup[]>([]);
 const [loading, setLoading] = useState(true);

 // Sheet state
 const [sheetOpen, setSheetOpen] = useState(false);
 const [selectedProgram, setSelectedProgram] = useState<DailyProgram | null>(null);
 const [selectedDate, setSelectedDate] = useState<string | null>(null);

 // Card edit dialog state
 const [cardDialogOpen, setCardDialogOpen] = useState(false);
 const [editingCard, setEditingCard] = useState<DailyProgramCard | null>(null);
 const [cardDialogProgramId, setCardDialogProgramId] = useState('');
 const [cardDialogProgramTitle, setCardDialogProgramTitle] = useState('');
 const [cardDialogProgramStatus, setCardDialogProgramStatus] = useState<ProgramStatus>('draft');
 const [cardDialogDateLabel, setCardDialogDateLabel] = useState('');
 const [hideCheckHint, setHideCheckHint] = useState(false);

 // DnD state
 const [activeDragProgram, setActiveDragProgram] = useState<DailyProgram | null>(null);

 const getDateRange = useCallback(() => {
 if (viewMode === 'month') {
 const monthStart = startOfMonth(currentDate);
 const monthEnd = endOfMonth(currentDate);
 const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
 const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
 return {
 startDate: format(calStart, 'yyyy-MM-dd'),
 endDate: format(calEnd, 'yyyy-MM-dd'),
 };
 } else {
 const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
 const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
 return {
 startDate: format(weekStart, 'yyyy-MM-dd'),
 endDate: format(weekEnd, 'yyyy-MM-dd'),
 };
 }
 }, [currentDate, viewMode]);

 const fetchPrograms = useCallback(async () => {
 setLoading(true);
 try {
 const { startDate, endDate } = getDateRange();
 const res = await fetch(
 `/api/daily-programs?challengeId=${challengeId}&startDate=${startDate}&endDate=${endDate}`
 );
 if (res.ok) {
 const data = await res.json();
 setPrograms(data);
 }
 } catch (error) {
 console.error('Failed to fetch programs:', error);
 } finally {
 setLoading(false);
 }
 }, [challengeId, getDateRange]);

 const fetchGroups = useCallback(async () => {
 try {
 const res = await fetch(`/api/challenge-groups?challenge_id=${challengeId}`);
 if (res.ok) {
 const data = await res.json();
 setGroups(data);
 }
 } catch {
 // Groups might not be configured for this challenge
 }
 }, [challengeId]);

 useEffect(() => {
 fetchPrograms();
 }, [fetchPrograms]);

 useEffect(() => {
 fetchGroups();
 }, [fetchGroups]);

 const handlePrev = () => {
 if (viewMode === 'month') {
 setCurrentDate((d) => subMonths(d, 1));
 } else {
 setCurrentDate((d) => subWeeks(d, 1));
 }
 };

 const handleNext = () => {
 if (viewMode === 'month') {
 setCurrentDate((d) => addMonths(d, 1));
 } else {
 setCurrentDate((d) => addWeeks(d, 1));
 }
 };

 const handleToday = () => {
 setCurrentDate(new Date());
 };

 const handleProgramClick = async (program: DailyProgram) => {
 try {
 const res = await fetch(`/api/daily-programs?id=${program.id}`);
 if (res.ok) {
 const fullProgram = await res.json();
 setSelectedProgram(fullProgram);
 setSelectedDate(null);
 setSheetOpen(true);
 }
 } catch (error) {
 console.error('Failed to fetch program details:', error);
 }
 };

 const handleDayCellClick = (date: string) => {
 setSelectedProgram(null);
 setSelectedDate(date);
 setSheetOpen(true);
 };

 const handleSheetClose = () => {
 setSheetOpen(false);
 setSelectedProgram(null);
 setSelectedDate(null);
 };

 const handleProgramSaved = () => {
 fetchPrograms();
 };

 const handleAddCard = (date: string) => {
 const existingProgram = programs.find((p) => p.date === date);

 setEditingCard(null);
 setCardDialogProgramId(existingProgram?.id ?? '');
 setCardDialogProgramTitle(existingProgram?.title ?? '');
 setCardDialogProgramStatus(existingProgram?.status ?? 'draft');
 setCardDialogDateLabel(date);
 setCardDialogOpen(true);
 };

 const handleCardClick = (card: DailyProgramCard, program: DailyProgram) => {
 setEditingCard(card);
 setCardDialogProgramId(program.id);
 setCardDialogProgramTitle(program.title ?? '');
 setCardDialogProgramStatus(program.status);
 setCardDialogDateLabel(program.date);
 setCardDialogOpen(true);
 };

 const handleCardDialogClose = () => {
 setCardDialogOpen(false);
 setEditingCard(null);
 setCardDialogProgramId('');
 setCardDialogDateLabel('');
 };

 const handleCardSaved = () => {
 fetchPrograms();
 };

 const handleDateChange = async (programId: string, newDate: string) => {
 // Optimistic update
 setPrograms((prev) =>
 prev.map((p) => (p.id === programId ? { ...p, date: newDate } : p))
 );

 try {
 const res = await fetch('/api/daily-programs', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id: programId, date: newDate }),
 });
 if (!res.ok) {
 fetchPrograms();
 }
 } catch {
 fetchPrograms();
 }
 };

 // DnD handlers
 const handleDragStart = (event: DragStartEvent) => {
 const programId = event.active.id as string;
 const program = programs.find((p) => p.id === programId);
 setActiveDragProgram(program || null);
 };

 const handleDragEnd = (event: DragEndEvent) => {
 const { active, over } = event;
 setActiveDragProgram(null);

 if (!over) return;

 const programId = active.id as string;
 const newDate = over.id as string; // droppable id = date string

 const program = programs.find((p) => p.id === programId);
 if (!program || program.date === newDate) return;

 handleDateChange(programId, newDate);
 };

 return (
 <div className="h-full flex flex-col">
 <Title title="데일리 프로그램" />

 <CalendarToolbar
 viewMode={viewMode}
 onViewModeChange={setViewMode}
 currentDate={currentDate}
 onPrev={handlePrev}
 onNext={handleNext}
 onToday={handleToday}
 />

 <div className="flex-1 overflow-auto px-4 pb-4">
 {loading ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
 </div>
 ) : (
 <DndContext
 collisionDetection={pointerWithin}
 onDragStart={handleDragStart}
 onDragEnd={handleDragEnd}
 >
 {viewMode === 'month' ? (
 <CalendarMonthView
 currentDate={currentDate}
 programs={programs}
 onProgramClick={handleProgramClick}
 onDayCellClick={handleDayCellClick}
 onDateChange={handleDateChange}
 onAddCard={handleAddCard}
 onCardClick={handleCardClick}
 />
 ) : (
 <CalendarWeekView
 currentDate={currentDate}
 programs={programs}
 onProgramClick={handleProgramClick}
 onDayCellClick={handleDayCellClick}
 onDateChange={handleDateChange}
 onAddCard={handleAddCard}
 onCardClick={handleCardClick}
 />
 )}

 {/* Drag overlay */}
 <DragOverlay>
 {activeDragProgram && (
 <div className="opacity-80 pointer-events-none">
 <CalendarProgramChip
 program={activeDragProgram}
 onClick={() => {}}
 />
 </div>
 )}
 </DragOverlay>
 </DndContext>
 )}
 </div>

 <ProgramDetailSheet
 open={sheetOpen}
 onClose={handleSheetClose}
 program={selectedProgram}
 challengeId={challengeId}
 initialDate={selectedDate}
 groups={groups}
 onSaved={handleProgramSaved}
 />

 <CardEditDialog
 open={cardDialogOpen}
 onClose={handleCardDialogClose}
 card={editingCard}
 programId={cardDialogProgramId}
 programTitle={cardDialogProgramTitle}
 programStatus={cardDialogProgramStatus}
 challengeId={challengeId}
 dateLabel={cardDialogDateLabel}
 onSaved={handleCardSaved}
 hideCheckHint={hideCheckHint}
 onDismissCheckHint={() => setHideCheckHint(true)}
 />
 </div>
 );
}
