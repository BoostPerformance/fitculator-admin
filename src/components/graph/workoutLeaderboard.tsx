'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

interface WorkoutLeaderboardProps {
 challengeId: string;
 startDate?: string;
 endDate?: string;
}

type Period = 'weekly' | 'all';

interface LeaderboardEntry {
 user_id: string;
 user_name: string;
 total_points: number;
 rank: number;
 strengthWorkoutCount: number;
}

interface WorkoutData {
 user_id: string;
 user: {
 name: string;
 strengthWorkoutCount: number;
 };
 points: number;
}

const fetchWorkoutLeaderboard = async (
 challengeId: string,
 period: Period,
 weekStart?: string,
 weekEnd?: string
) => {
 let url = `/api/workouts/user-detail?type=leaderboard&challengeId=${challengeId}&period=${period}&t=${Date.now()}`;
 if (period === 'weekly' && weekStart && weekEnd) {
 url += `&weekStart=${weekStart}&weekEnd=${weekEnd}`;
 }
 const response = await fetch(url);
 if (!response.ok) throw new Error('운동 데이터 가져오기 실패');
 return response.json();
};

// 주차 목록 생성 함수
const generateWeeks = (startDate: string, endDate: string) => {
 const weeks: { label: string; startDate: string; endDate: string }[] = [];
 const start = new Date(startDate);
 const end = new Date(endDate);

 // 시작일이 포함된 주의 월요일 찾기
 const startDay = start.getDay();
 const firstMonday = new Date(start);
 if (startDay !== 1) {
 const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
 firstMonday.setDate(firstMonday.getDate() - daysSinceMonday);
 }

 let weekNum = 1;
 let currentStart = new Date(firstMonday);

 while (currentStart <= end) {
 const currentEnd = new Date(currentStart);
 currentEnd.setDate(currentEnd.getDate() + 6);

 const startMonth = currentStart.getMonth() + 1;
 const startDateNum = currentStart.getDate();
 const endMonth = currentEnd.getMonth() + 1;
 const endDateNum = currentEnd.getDate();

 weeks.push({
 label: `W${weekNum} (${startMonth}.${startDateNum}-${endMonth}.${endDateNum})`,
 startDate: currentStart.toISOString().split('T')[0],
 endDate: currentEnd.toISOString().split('T')[0],
 });

 weekNum++;
 currentStart.setDate(currentStart.getDate() + 7);
 }

 return weeks;
};

export default function WorkoutLeaderboard({
 challengeId,
 startDate,
 endDate,
}: WorkoutLeaderboardProps) {
 const [period, setPeriod] = useState<Period>('weekly');
 const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(-1);

 // 주차 목록 생성
 const weeks = useMemo(() => {
 if (!startDate || !endDate) return [];
 return generateWeeks(startDate, endDate);
 }, [startDate, endDate]);

 // 현재 주차 자동 선택 (초기값)
 useEffect(() => {
 if (weeks.length > 0 && selectedWeekIndex === -1) {
 const today = new Date().toISOString().split('T')[0];
 const currentWeekIdx = weeks.findIndex(
 (w) => w.startDate <= today && w.endDate >= today
 );
 if (currentWeekIdx >= 0) {
 setSelectedWeekIndex(currentWeekIdx);
 } else {
 setSelectedWeekIndex(weeks.length - 1);
 }
 }
 }, [weeks, selectedWeekIndex]);

 const selectedWeek = selectedWeekIndex >= 0 ? weeks[selectedWeekIndex] : undefined;

 const { data: workouts, isLoading, error } = useQuery({
 queryKey: ['workout', 'leaderboard', challengeId, period, selectedWeek?.startDate, selectedWeek?.endDate],
 queryFn: () => fetchWorkoutLeaderboard(
 challengeId,
 period,
 selectedWeek?.startDate,
 selectedWeek?.endDate
 ),
 enabled: !!challengeId && (period === 'all' || !!selectedWeek),
 staleTime: 30 * 1000,
 refetchOnWindowFocus: false,
 });

 // 데이터 변환: API 응답 → 리더보드 형식
 const leaderboardData = useMemo(() => {
 if (!workouts || !Array.isArray(workouts)) return [];

 type UserPointsMap = {
 [key: string]: {
 points: number;
 name: string;
 strengthWorkoutCount: number;
 };
 };

 const userPoints: UserPointsMap = workouts.reduce(
 (acc: UserPointsMap, workout: WorkoutData) => {
 const userId = workout.user_id;
 if (!acc[userId]) {
 acc[userId] = {
 points: 0,
 name: workout.user?.name || '알 수 없음',
 strengthWorkoutCount: workout.user?.strengthWorkoutCount,
 };
 }
 acc[userId].points += workout.points || 0;
 return acc;
 },
 {} as UserPointsMap
 );

 return Object.entries(userPoints)
 .map(([userId, data]) => ({
 user_id: userId,
 user_name: data.name,
 total_points: data.points,
 rank: 0,
 strengthWorkoutCount: data.strengthWorkoutCount,
 }))
 .sort((a, b) => b.total_points - a.total_points)
 .map((entry, index) => ({
 ...entry,
 rank: index + 1,
 }));
 }, [workouts]);

 if (isLoading) {
 return (
 <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto shadow dark:shadow-neutral-900 border border-line">
 <div className="animate-pulse">
 <div className="h-6 bg-surface-sunken rounded w-1/3 mb-4"></div>
 <div className="space-y-3">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="h-8 bg-surface-raised rounded"></div>
 ))}
 </div>
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] shadow dark:shadow-neutral-900 border border-line">
 <p className="text-red-500">리더보드를 불러오는데 실패했습니다.</p>
 </div>
 );
 }

 return (
 <div className="col-span-2 bg-surface rounded-[0.625rem] p-[1.25rem] h-[36rem] overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-surface-raised dark:[&::-webkit-scrollbar-track]:bg-neutral-700 shadow dark:shadow-neutral-900 border border-line">
 <div className="mb-4">
 <div className="flex justify-between items-center mb-3">
 <h2 className="text-lg font-semibold text-content-tertiary pt-1 pl-1">
 운동 리더보드
 </h2>
 <div className="flex rounded-full bg-surface-raised p-0.5">
 <button
 onClick={() => setPeriod('weekly')}
 className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
 period === 'weekly'
 ? 'bg-surface text-content-secondary shadow-sm'
 : 'text-content-tertiary hover:text-content-secondary'
 }`}
 >
 주간
 </button>
 <button
 onClick={() => setPeriod('all')}
 className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
 period === 'all'
 ? 'bg-surface text-content-secondary shadow-sm'
 : 'text-content-tertiary hover:text-content-secondary'
 }`}
 >
 전체
 </button>
 </div>
 </div>
 {/* 주차 선택 (주간 선택 시에만 표시) */}
 {period === 'weekly' && weeks.length > 0 && (
 <div className="flex justify-end">
 <select
 value={selectedWeekIndex}
 onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
 className="px-2 py-1 rounded-lg text-[10px] bg-surface-raised text-content-secondary border-none outline-none cursor-pointer"
 >
 {weeks.map((week, idx) => {
 const today = new Date().toISOString().split('T')[0];
 if (week.startDate > today) return null;
 return (
 <option key={idx} value={idx}>
 {week.label}
 </option>
 );
 })}
 </select>
 </div>
 )}
 </div>
 <div className="space-y-4">
 <div className="text-right text-label-sm font-medium text-content-tertiary">
 유산소포인트/근력횟수
 </div>
 {leaderboardData.map((entry) => {
 return (
 <div key={entry.user_id} className="grid grid-cols-12 gap-2 items-center">
 <div className="col-span-1 text-center font-bold text-content-tertiary text-[14px]">
 {entry.rank}
 </div>
 <div className="col-span-3 font-medium text-content-tertiary text-[12px]">
 {entry.user_name.split(' ')[0]}
 </div>
 <div className="col-span-4 bg-surface-sunken rounded-full h-2 relative">
 <div
 className="h-2 rounded-full transition-all duration-300"
 style={{
 width: `${Math.min(
 (entry.total_points / 100) * 100,
 100
 )}%`,
 background:
 'linear-gradient(90deg, #FF007A 0%, #FF70AC 100%)',
 }}
 />
 {entry.total_points >= 100 && (
 <div className="absolute -right-2 -top-2">
 <Image
 src="/svg/fire.svg"
 alt="fire"
 width={15}
 height={20}
 />
 </div>
 )}
 </div>
 <div className="col-span-4 text-right text-[12px] text-content-tertiary">
 {entry.total_points.toFixed(1)}pt/
 {entry.strengthWorkoutCount}회
 </div>
 </div>
 );
 })}
 {leaderboardData.length === 0 && (
 <div className="flex flex-col items-center justify-center py-12 text-content-tertiary">
 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
 </svg>
 <p className="text-sm">
 {period === 'weekly' && selectedWeek
 ? `${selectedWeek.label} 운동 기록이 없습니다`
 : '아직 운동 기록이 없습니다'}
 </p>
 </div>
 )}
 </div>
 </div>
 );
}
