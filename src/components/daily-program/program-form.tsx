'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { DailyProgram, ChallengeGroup } from '@/types/daily-program';
import { ProgramStatusBadge } from './program-status-badge';

interface ProgramFormProps {
 program: DailyProgram | null;
 initialDate: string | null;
 onSubmit: (data: {
 title: string;
 description?: string;
 date: string;
 show_on_main: boolean;
 target_group_ids: string[];
 }) => void;
 saving: boolean;
 groups?: ChallengeGroup[];
 onGroupsChange?: (groupIds: string[]) => void;
 hideSubmitButton?: boolean;
 formRef?: React.Ref<HTMLFormElement>;
 hideHeader?: boolean;
 onDirtyChange?: (dirty: boolean) => void;
}

export function ProgramForm({ program, initialDate, onSubmit, saving, groups, onGroupsChange, hideSubmitButton, formRef, hideHeader, onDirtyChange }: ProgramFormProps) {
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [date, setDate] = useState('');
 const [showOnMain, setShowOnMain] = useState(true);
 const [groupMode, setGroupMode] = useState<'all' | 'specific'>('all');
 const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

 useEffect(() => {
 if (program) {
 setTitle(program.title || '');
 setDescription(program.description || '');
 setDate(program.date);
 setShowOnMain(program.show_on_main);
 const ids = program.daily_program_target_groups?.map((g) => g.group_id) || [];
 setSelectedGroupIds(ids);
 setGroupMode(ids.length === 0 ? 'all' : 'specific');
 } else {
 setTitle('');
 setDescription('');
 setDate(initialDate || new Date().toISOString().split('T')[0]);
 setShowOnMain(true);
 setSelectedGroupIds([]);
 setGroupMode('all');
 }
 }, [program, initialDate]);

 const initialRef = useRef({
 title: program?.title || '',
 description: program?.description || '',
 date: program?.date || initialDate || new Date().toISOString().split('T')[0],
 showOnMain: program?.show_on_main ?? true,
 groupIds: program?.daily_program_target_groups?.map((g) => g.group_id) || [],
 });

 useEffect(() => {
 initialRef.current = {
 title: program?.title || '',
 description: program?.description || '',
 date: program?.date || initialDate || new Date().toISOString().split('T')[0],
 showOnMain: program?.show_on_main ?? true,
 groupIds: program?.daily_program_target_groups?.map((g) => g.group_id) || [],
 };
 }, [program, initialDate]);

 const isDirty = useMemo(() => {
 const iv = initialRef.current;
 return (
 title !== iv.title ||
 (description || '') !== (iv.description || '') ||
 date !== iv.date ||
 showOnMain !== iv.showOnMain ||
 JSON.stringify([...selectedGroupIds].sort()) !== JSON.stringify([...iv.groupIds].sort())
 );
 }, [title, description, date, showOnMain, selectedGroupIds]);

 useEffect(() => {
 onDirtyChange?.(isDirty);
 }, [isDirty, onDirtyChange]);

 const handleGroupModeChange = (newMode: 'all' | 'specific') => {
 setGroupMode(newMode);
 if (newMode === 'all') {
 setSelectedGroupIds([]);
 onGroupsChange?.([]);
 }
 };

 const handleToggleGroup = (groupId: string) => {
 const newSelected = selectedGroupIds.includes(groupId)
 ? selectedGroupIds.filter((id) => id !== groupId)
 : [...selectedGroupIds, groupId];
 setSelectedGroupIds(newSelected);
 onGroupsChange?.(newSelected);
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 onSubmit({
 title,
 description: description || undefined,
 date,
 show_on_main: showOnMain,
 target_group_ids: selectedGroupIds,
 });
 };

 return (
 <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
 {!hideHeader && (
 <div className="flex items-center gap-2">
 <h3 className="text-body font-semibold text-content-secondary">
 프로그램 정보
 </h3>
 {program && <ProgramStatusBadge status={program.status} size="md" />}
 </div>
 )}

 <div>
 <label className="block text-body font-medium text-content-secondary mb-1">
 날짜 *
 </label>
 <input
 type="date"
 value={date}
 onChange={(e) => setDate(e.target.value)}
 required
 className="w-full px-2.5 py-1.5 border border-line rounded-md bg-surface text-content-primary dark:text-white text-body focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 </div>

 <div>
 <label className="block text-body font-medium text-content-secondary mb-1">
 제목
 </label>
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="프로그램 제목 (선택)"
 className="w-full px-2.5 py-1.5 border border-line rounded-md bg-surface text-content-primary dark:text-white text-body focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 </div>

 <div>
 <label className="block text-body font-medium text-content-secondary mb-1">
 설명
 </label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="프로그램 설명 (선택)"
 rows={2}
 className="w-full px-2.5 py-1.5 border border-line rounded-md bg-surface text-content-primary dark:text-white text-body focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
 />
 </div>

 <div>
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="show_on_main"
 checked={showOnMain}
 onChange={(e) => setShowOnMain(e.target.checked)}
 className="h-3.5 w-3.5 rounded border-line text-blue-600 focus:ring-blue-500"
 />
 <label htmlFor="show_on_main" className="text-body text-content-secondary">
 메인에 표시
 </label>
 </div>
 </div>

 {groups && groups.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-body font-semibold text-content-secondary">
 대상 그룹
 </h3>

 <div className="flex items-center gap-3">
 <label className="flex items-center gap-1.5 cursor-pointer">
 <input
 type="radio"
 name="group-mode"
 checked={groupMode === 'all'}
 onChange={() => handleGroupModeChange('all')}
 className="h-3.5 w-3.5 text-blue-600"
 />
 <span className="text-body text-content-secondary">전체</span>
 </label>
 <label className="flex items-center gap-1.5 cursor-pointer">
 <input
 type="radio"
 name="group-mode"
 checked={groupMode === 'specific'}
 onChange={() => handleGroupModeChange('specific')}
 className="h-3.5 w-3.5 text-blue-600"
 />
 <span className="text-body text-content-secondary">특정 그룹</span>
 </label>
 </div>

 {groupMode === 'specific' && (
 <div className="flex flex-wrap gap-1.5">
 {groups.map((group) => (
 <button
 key={group.id}
 type="button"
 onClick={() => handleToggleGroup(group.id)}
 className={`px-2.5 py-1 text-body rounded-full border transition-colors ${
 selectedGroupIds.includes(group.id)
 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
 : 'border-line text-content-tertiary hover:border-line hover:text-content-secondary'
 }`}
 style={
 selectedGroupIds.includes(group.id) && group.color_code
 ? {
 borderColor: group.color_code,
 backgroundColor: `${group.color_code}15`,
 color: group.color_code,
 }
 : undefined
 }
 >
 {group.name}
 </button>
 ))}
 </div>
 )}
 </div>
 )}

 {!hideSubmitButton && (
 <button
 type="submit"
 disabled={saving || !date}
 className="w-full px-4 py-1.5 bg-blue-600 text-white text-body font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 {saving ? '저장 중...' : program ? '수정' : '생성'}
 </button>
 )}
 </form>
 );
}
