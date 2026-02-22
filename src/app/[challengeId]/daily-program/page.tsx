'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
 format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
 addMonths, subMonths, addWeeks, subWeeks,
} from 'date-fns';
import {
 DndContext, DragOverlay, pointerWithin,
 PointerSensor, useSensor, useSensors,
 type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { DailyProgram, DailyProgramCard, CalendarViewMode, ChallengeGroup } from '@/types/daily-program';
import { CalendarToolbar } from '@/components/daily-program/calendar-toolbar';
import { CalendarMonthView } from '@/components/daily-program/calendar-month-view';
import { CalendarWeekView } from '@/components/daily-program/calendar-week-view';
import { CalendarProgramChip } from '@/components/daily-program/calendar-program-chip';
import { CalendarCardPreview } from '@/components/daily-program/calendar-card-preview';
import { MobileCalendarView } from '@/components/daily-program/mobile-calendar-view';
import { ProgramModal } from '@/components/daily-program/program-modal';
import { useResponsive } from '@/components/hooks/useResponsive';

export default function DailyProgramPage() {
 const params = useParams();
 const challengeId = params.challengeId as string;
 const { isMobile } = useResponsive();

 const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
 const [currentDate, setCurrentDate] = useState(new Date());
 const [mobileSelectedDay, setMobileSelectedDay] = useState(new Date());
 const [programs, setPrograms] = useState<DailyProgram[]>([]);
 const [groups, setGroups] = useState<ChallengeGroup[]>([]);
 const [loading, setLoading] = useState(true);

 // Sheet state
 const [sheetOpen, setSheetOpen] = useState(false);
 const [selectedProgram, setSelectedProgram] = useState<DailyProgram | null>(null);
 const [selectedDate, setSelectedDate] = useState<string | null>(null);

 // DnD state
 const [activeDragProgram, setActiveDragProgram] = useState<DailyProgram | null>(null);
 const [activeDragCard, setActiveDragCard] = useState<DailyProgramCard | null>(null);
 const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
 );

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
 if (isMobile || viewMode === 'month') {
 setCurrentDate((d) => subMonths(d, 1));
 } else {
 setCurrentDate((d) => subWeeks(d, 1));
 }
 };

 const handleNext = () => {
 if (isMobile || viewMode === 'month') {
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

 // Card drag helpers
 const handleCardDragEnd = async (activeId: string, overId: string) => {
 const activeCardId = activeId.replace('card:', '');

 if (overId.startsWith('card:')) {
  // Card-to-card: reorder within same program or cross-program move
  const overCardId = overId.replace('card:', '');
  const activeProgram = programs.find((p) =>
   p.daily_program_cards?.some((c) => c.id === activeCardId)
  );
  const overProgram = programs.find((p) =>
   p.daily_program_cards?.some((c) => c.id === overCardId)
  );

  if (!activeProgram || !overProgram) return;

  if (activeProgram.id === overProgram.id) {
   // Same program — reorder
   const cards = [...(activeProgram.daily_program_cards || [])];
   const oldIndex = cards.findIndex((c) => c.id === activeCardId);
   const newIndex = cards.findIndex((c) => c.id === overCardId);
   if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

   const reordered = arrayMove(cards, oldIndex, newIndex);

   // Optimistic update
   setPrograms((prev) =>
    prev.map((p) =>
     p.id === activeProgram.id
      ? { ...p, daily_program_cards: reordered }
      : p
    )
   );

   try {
    const res = await fetch('/api/daily-program-cards', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      id: 'reorder',
      action: 'reorder',
      card_ids: reordered.map((c) => c.id),
     }),
    });
    if (!res.ok) fetchPrograms();
   } catch {
    fetchPrograms();
   }
  } else {
   // Different program — move card
   try {
    const res = await fetch('/api/daily-program-cards', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ id: activeCardId, program_id: overProgram.id }),
    });
    if (!res.ok) fetchPrograms();
    else fetchPrograms();
   } catch {
    fetchPrograms();
   }
  }
 } else {
  // Card dropped on a date cell
  const newDate = overId;
  const activeProgram = programs.find((p) =>
   p.daily_program_cards?.some((c) => c.id === activeCardId)
  );
  if (!activeProgram || activeProgram.date === newDate) return;

  let targetProgram = programs.find((p) => p.date === newDate);

  if (!targetProgram) {
   // Auto-create program on the target date
   try {
    const res = await fetch('/api/daily-programs', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      challenge_id: challengeId,
      date: newDate,
      title: '',
      status: 'draft',
     }),
    });
    if (res.ok) targetProgram = await res.json();
   } catch {
    return;
   }
  }

  if (targetProgram) {
   try {
    await fetch('/api/daily-program-cards', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ id: activeCardId, program_id: targetProgram.id }),
    });
    fetchPrograms();
   } catch {
    fetchPrograms();
   }
  }
 }
 };

 // DnD handlers
 const handleDragStart = (event: DragStartEvent) => {
 const id = event.active.id.toString();

 if (id.startsWith('card:')) {
  const cardId = id.replace('card:', '');
  for (const program of programs) {
   const card = program.daily_program_cards?.find((c) => c.id === cardId);
   if (card) {
    setActiveDragCard(card);
    setActiveDragProgram(null);
    return;
   }
  }
 } else {
  const program = programs.find((p) => p.id === id);
  setActiveDragProgram(program || null);
  setActiveDragCard(null);
 }
 };

 const handleDragEnd = (event: DragEndEvent) => {
 const { active, over } = event;
 setActiveDragProgram(null);
 setActiveDragCard(null);

 if (!over) return;

 const activeId = active.id.toString();
 const overId = over.id.toString();

 if (activeId.startsWith('card:')) {
  handleCardDragEnd(activeId, overId);
  return;
 }

 // Existing program drag logic
 const programId = activeId;
 const newDate = overId;

 const program = programs.find((p) => p.id === programId);
 if (!program || program.date === newDate) return;

 handleDateChange(programId, newDate);
 };

 return (
 <div className="w-full max-w-full overflow-hidden">
 <CalendarToolbar
 viewMode={viewMode}
 onViewModeChange={setViewMode}
 currentDate={currentDate}
 onPrev={handlePrev}
 onNext={handleNext}
 onToday={handleToday}
 onAdd={() => handleDayCellClick(format(isMobile ? mobileSelectedDay : new Date(), 'yyyy-MM-dd'))}
 />

 <div className="px-4 pb-4 sm:px-2 sm:pb-2 overflow-x-hidden">
 {loading ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
 </div>
 ) : isMobile ? (
 <MobileCalendarView
 currentDate={currentDate}
 programs={programs}
 selectedDay={mobileSelectedDay}
 onSelectedDayChange={setMobileSelectedDay}
 onProgramClick={handleProgramClick}
 onAddProgram={handleDayCellClick}
 />
 ) : (
 <DndContext
 sensors={sensors}
 collisionDetection={pointerWithin}
 onDragStart={handleDragStart}
 onDragEnd={handleDragEnd}
 >
 {viewMode === 'month' ? (
 <CalendarMonthView
 currentDate={currentDate}
 programs={programs}
 onProgramClick={handleProgramClick}
 onAddProgram={handleDayCellClick}
 onDateChange={handleDateChange}
 />
 ) : (
 <CalendarWeekView
 currentDate={currentDate}
 programs={programs}
 onProgramClick={handleProgramClick}
 onAddProgram={handleDayCellClick}
 onDateChange={handleDateChange}
 />
 )}

 {/* Drag overlay */}
 <DragOverlay>
 {activeDragProgram && (
 <div className="opacity-80 pointer-events-none">
 <CalendarProgramChip
 program={activeDragProgram}
 onClick={() => {}}
 disableDrag
 />
 </div>
 )}
 {activeDragCard && (
 <div className="opacity-80 pointer-events-none">
 <CalendarCardPreview card={activeDragCard} />
 </div>
 )}
 </DragOverlay>
 </DndContext>
 )}
 </div>

 <ProgramModal
 open={sheetOpen}
 onClose={handleSheetClose}
 program={selectedProgram}
 challengeId={challengeId}
 initialDate={selectedDate}
 groups={groups}
 onSaved={handleProgramSaved}
 />
 </div>
 );
}
