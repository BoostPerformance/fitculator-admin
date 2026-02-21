'use client';

import React, { useState, useEffect } from 'react';
import type { ChallengeGroup } from '@/types/daily-program';

interface GroupSelectorProps {
 groups: ChallengeGroup[];
 selectedGroupIds: string[];
 onSave: (groupIds: string[]) => void;
}

export function GroupSelector({ groups, selectedGroupIds, onSave }: GroupSelectorProps) {
 const [selected, setSelected] = useState<string[]>(selectedGroupIds);
 const [mode, setMode] = useState<'all' | 'specific'>(
 selectedGroupIds.length === 0 ? 'all' : 'specific'
 );

 useEffect(() => {
 setSelected(selectedGroupIds);
 setMode(selectedGroupIds.length === 0 ? 'all' : 'specific');
 }, [selectedGroupIds]);

 const handleModeChange = (newMode: 'all' | 'specific') => {
 setMode(newMode);
 if (newMode === 'all') {
 setSelected([]);
 onSave([]);
 }
 };

 const handleToggleGroup = (groupId: string) => {
 const newSelected = selected.includes(groupId)
 ? selected.filter((id) => id !== groupId)
 : [...selected, groupId];
 setSelected(newSelected);
 onSave(newSelected);
 };

 return (
 <div className="space-y-3">
 <h3 className="text-sm font-semibold text-content-secondary">
 대상 그룹
 </h3>

 <div className="flex items-center gap-4">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 name="group-mode"
 checked={mode === 'all'}
 onChange={() => handleModeChange('all')}
 className="h-4 w-4 text-blue-600"
 />
 <span className="text-sm text-content-secondary">전체</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 name="group-mode"
 checked={mode === 'specific'}
 onChange={() => handleModeChange('specific')}
 className="h-4 w-4 text-blue-600"
 />
 <span className="text-sm text-content-secondary">특정 그룹</span>
 </label>
 </div>

 {mode === 'specific' && (
 <div className="flex flex-wrap gap-2">
 {groups.map((group) => (
 <button
 key={group.id}
 type="button"
 onClick={() => handleToggleGroup(group.id)}
 className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
 selected.includes(group.id)
 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
 : 'border-line text-content-secondary hover:border-line'
 }`}
 style={
 selected.includes(group.id) && group.color_code
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
 );
}
