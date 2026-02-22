'use client';

import React, { useState, useEffect } from 'react';
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
}

export function ProgramForm({ program, initialDate, onSubmit, saving, groups, onGroupsChange }: ProgramFormProps) {
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
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-semibold text-content-secondary">
 프로그램 정보
 </h3>
 {program && <ProgramStatusBadge status={program.status} size="md" />}
 </div>

 <div>
 <label className="block text-sm font-medium text-content-secondary mb-1">
 날짜 *
 </label>
 <input
 type="date"
 value={date}
 onChange={(e) => setDate(e.target.value)}
 required
 className="w-full px-3 py-2 border border-line rounded-md bg-surface text-content-primary dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 <p className="mt-1 text-xs text-content-tertiary">프로그램이 표시될 날짜입니다</p>
 </div>

 <div>
 <label className="block text-sm font-medium text-content-secondary mb-1">
 제목
 </label>
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="프로그램 제목 (선택)"
 className="w-full px-3 py-2 border border-line rounded-md bg-surface text-content-primary dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 <p className="mt-1 text-xs text-content-tertiary">캘린더와 멤버 화면에 표시되는 이름입니다</p>
 </div>

 <div>
 <label className="block text-sm font-medium text-content-secondary mb-1">
 설명
 </label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="프로그램 설명 (선택)"
 rows={2}
 className="w-full px-3 py-2 border border-line rounded-md bg-surface text-content-primary dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
 />
 <p className="mt-1 text-xs text-content-tertiary">멤버에게 보이는 프로그램 안내 텍스트입니다</p>
 </div>

 <div>
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="show_on_main"
 checked={showOnMain}
 onChange={(e) => setShowOnMain(e.target.checked)}
 className="h-4 w-4 rounded border-line text-blue-600 focus:ring-blue-500"
 />
 <label htmlFor="show_on_main" className="text-sm text-content-secondary">
 메인에 표시
 </label>
 </div>
 <p className="mt-1 text-xs text-content-tertiary">활성화하면 메인 화면의 오늘의 프로그램에 노출됩니다</p>
 </div>

 {groups && groups.length > 0 && (
 <div className="space-y-3">
 <h3 className="text-sm font-semibold text-content-secondary">
 대상 그룹
 </h3>
 <p className="text-xs text-content-tertiary -mt-1">특정 그룹에만 프로그램을 노출할 수 있습니다</p>

 <div className="flex items-center gap-4">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 name="group-mode"
 checked={groupMode === 'all'}
 onChange={() => handleGroupModeChange('all')}
 className="h-4 w-4 text-blue-600"
 />
 <span className="text-sm text-content-secondary">전체</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 name="group-mode"
 checked={groupMode === 'specific'}
 onChange={() => handleGroupModeChange('specific')}
 className="h-4 w-4 text-blue-600"
 />
 <span className="text-sm text-content-secondary">특정 그룹</span>
 </label>
 </div>

 {groupMode === 'specific' && (
 <div className="flex flex-wrap gap-2">
 {groups.map((group) => (
 <button
 key={group.id}
 type="button"
 onClick={() => handleToggleGroup(group.id)}
 className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
 selectedGroupIds.includes(group.id)
 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
 : 'border-line text-content-secondary hover:border-line'
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

 <button
 type="submit"
 disabled={saving || !date}
 className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 {saving ? '저장 중...' : program ? '수정' : '생성'}
 </button>
 </form>
 );
}
