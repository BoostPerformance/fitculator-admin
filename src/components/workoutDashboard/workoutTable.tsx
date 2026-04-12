'use client';
import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { WorkoutPageSkeleton } from '../layout/skeleton';
import {
 WeeklyChartData,
 LeaderboardEntry,
 TodayCountData,
 WeekInfo,
 WorkoutItem,
 WorkoutTableProps,
} from '@/types/workoutTableTypes';

// Helper function to format date to MM.DD format
const formatDateToMMDD = (dateString: string | Date) => {
 const date = new Date(dateString);
 const month = (date.getMonth() + 1).toString().padStart(2, '0');
 const day = date.getDate().toString().padStart(2, '0');
 return `${month}.${day}`;
};

// Helper function to generate week labels based on challenge period (서버 로직과 일치)
const generateWeekLabels = (startDateStr: string, endDateStr: string) => {
 const [year, month, day] = startDateStr.split('-').map(Number);
 const challengeStartDate = new Date(year, month - 1, day);
 
 const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
 const challengeEndDate = new Date(endYear, endMonth - 1, endDay);

 const weeks: WeekInfo[] = [];

 // 챌린지 시작일이 포함된 주의 월요일 찾기 (이 주가 W1이 됨)
 let currentStart = new Date(challengeStartDate);
 const startDay = challengeStartDate.getDay();
 const daysFromMonday = startDay === 0 ? 6 : startDay - 1;
 currentStart.setDate(challengeStartDate.getDate() - daysFromMonday);

 let weekNumber = 1;

 // 챌린지 종료일까지 주차별로 생성
 while (currentStart <= challengeEndDate) {
 const currentEnd = new Date(currentStart);
 currentEnd.setDate(currentStart.getDate() + 6); // 일요일

 // 챌린지 종료일을 넘지 않도록 조정
 const actualEnd = currentEnd > challengeEndDate ? challengeEndDate : currentEnd;

 const formattedStart = formatDateToMMDD(currentStart);
 const formattedEnd = formatDateToMMDD(actualEnd);

 weeks.push({
 label: `${formattedStart}-${formattedEnd}`,
 startDate: new Date(currentStart),
 endDate: new Date(actualEnd),
 weekNumber: weekNumber,
 });

 // 다음 주 월요일로 이동
 currentStart = new Date(currentEnd);
 currentStart.setDate(currentEnd.getDate() + 1);
 weekNumber++;
 }

 return weeks;
};

// Helper function to check if current date is within a week range
const isCurrentWeek = (startDate: Date, endDate: Date): boolean => {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const start = new Date(startDate);
 start.setHours(0, 0, 0, 0);
 const end = new Date(endDate);
 end.setHours(23, 59, 59, 999);

 return today >= start && today <= end;
};

// WorkoutTable component
type SortConfig = {
 key: string;
 direction: 'asc' | 'desc';
};

const WorkoutTable: React.FC<
 WorkoutTableProps & {
 weeklyChart?: any;
 leaderboard?: any;
 todayCount?: any;
 batchUserData?: any;
 isLoading?: boolean;
 error?: any;
 }
> = ({
 challengeId,
 weeklyChart,
 leaderboard,
 todayCount,
 batchUserData,
 isLoading = false,
 error,
}) => {
 const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
 const [weekInfo, setWeekInfo] = useState<WeekInfo[]>([]);
 const [hasMore, setHasMore] = useState(false);
 const [page, setPage] = useState(1);
 const [isMobile, setIsMobile] = useState(false);
 const [totalAchievements, setTotalAchievements] = useState(0);
 const [activeMembersPercent, setActiveMembersPercent] = useState(0);
 const [sortConfig, setSortConfig] = useState<SortConfig>({
 key: '',
 direction: 'asc',
 });
 const observerRef = useRef<IntersectionObserver | null>(null);
 const lastRowRef = useRef(null);
 const router = useRouter();

 // React Query 훅 사용으로 API 호출 최적화
 // Props로 데이터 받음 (중복 API 호출 방지)

 // Process data when React Query data changes
 const processWorkoutData = useCallback(async () => {
 if (!weeklyChart || !leaderboard || !todayCount) return;

 try {
 // Generate proper week info based on challenge period
 let generatedWeeks = [];
 if (
 weeklyChart.challengePeriod &&
 weeklyChart.challengePeriod.startDate &&
 weeklyChart.challengePeriod.endDate
 ) {
 generatedWeeks = generateWeekLabels(
 weeklyChart.challengePeriod.startDate,
 weeklyChart.challengePeriod.endDate
 );
 setWeekInfo(generatedWeeks);
 } else if (weeklyChart.weeks && weeklyChart.weeks.length > 0) {
 // Fallback to existing weeks if challenge period is not available
 setWeekInfo(weeklyChart.weeks);
 generatedWeeks = weeklyChart.weeks;
 }

 // Process API data to workout items using the generated weeks
 const workoutData = await processApiDataToWorkoutItems(
 weeklyChart,
 leaderboard,
 todayCount,
 generatedWeeks,
 batchUserData
 );

 setWorkoutItems(workoutData);
 setTotalAchievements(calculateTotalAchievements(workoutData));
 setActiveMembersPercent(calculateActiveMembersPercent(workoutData));
 setHasMore(false);
 } catch (error) {
 // console.error('운동 데이터 처리 실패:', error);
 }
 }, [weeklyChart, leaderboard, todayCount, batchUserData]);

 // Process API data to workout items
 const processApiDataToWorkoutItems = async (
 weeklyChartData: WeeklyChartData,
 leaderboardData: LeaderboardEntry[],
 todayCountData: TodayCountData,
 generatedWeeks: WeekInfo[],
 batchUserData?: any
 ): Promise<WorkoutItem[]> => {
 const users = weeklyChartData.users || [];
 const cardioData = weeklyChartData.cardio || [];
 const strengthData = weeklyChartData.strength || [];

 const userPointsMap: Record<string, number> = {};
 leaderboardData?.forEach((item) => {
 userPointsMap[item.user_id] = item.points;
 });

 const items = users.map((user) => {
 // batchUserData에서 해당 사용자 데이터 찾기
 const userStatsData = batchUserData?.find(
 (data: any) => data.userId === user.id
 ) || { weeklyRecords: [] };

 // 데이터 연결 확인을 위한 로그 (첫 번째 사용자만)
 if (user.id === users[0]?.id) {
 // console.log('🔍 첫 번째 사용자 데이터:', {
 // userId: user.id,
 // userName: user.name,
 // weeklyRecordsCount: userStatsData.weeklyRecords?.length || 0,
 // generatedWeeksCount: generatedWeeks.length,
 // weeklyRecords: userStatsData.weeklyRecords,
 // generatedWeeks: generatedWeeks.map(w => ({
 // weekNumber: w.weekNumber,
 // label: w.label,
 // startDate: w.startDate.toISOString().split('T')[0],
 // endDate: w.endDate.toISOString().split('T')[0]
 // }))
 // });
 }

 const weeksCount = generatedWeeks.length || 1;

 const userWeeklyData = generatedWeeks.map((week, index) => {
 const userCardioInWeek = cardioData.filter((item) => {
 const workoutDate = new Date(item.date);
 return (
 item.userId === user.id &&
 workoutDate >= week.startDate &&
 workoutDate <= week.endDate
 );
 });

 const userStrengthInWeek = strengthData.filter((item) => {
 const workoutDate = new Date(item.date);
 return (
 item.userId === user.id &&
 workoutDate >= week.startDate &&
 workoutDate <= week.endDate
 );
 });

 const startDate = formatDateToMMDD(week.startDate);
 const endDate = formatDateToMMDD(week.endDate);

 // 해당 주차의 weeklyRecord 찾기 - 서버와 동일한 로직 적용
 const weekRecord = userStatsData.weeklyRecords?.find((record: any) => {
 // 서버와 동일하게 로컬 타임으로 파싱
 const [recordStartYear, recordStartMonth, recordStartDay] = record.start_date.split('-').map(Number);
 const recordStartDate = new Date(recordStartYear, recordStartMonth - 1, recordStartDay);
 
 const [recordEndYear, recordEndMonth, recordEndDay] = record.end_date.split('-').map(Number);
 const recordEndDate = new Date(recordEndYear, recordEndMonth - 1, recordEndDay);

 // 모든 주차에 대해 일관된 매핑 로직 사용
 // record의 end_date가 해당 주차의 start_date와 같거나 이후인 record를 찾음
 const isMatching =
 recordEndDate >= week.startDate && recordStartDate <= week.endDate;

 // 첫 번째 사용자의 첫 두 주차만 상세 매핑 로그
 // if (user.id === users[0]?.id && index < 2) {
 // console.log(`📅 W${week.weekNumber} 레코드 ${record.start_date}~${record.end_date} 체크:`, {
 // recordStart: recordStartDate.toISOString().split('T')[0],
 // recordEnd: recordEndDate.toISOString().split('T')[0],
 // weekStart: week.startDate.toISOString().split('T')[0],
 // weekEnd: week.endDate.toISOString().split('T')[0],
 // condition1: `recordEndDate >= week.startDate: ${recordEndDate >= week.startDate}`,
 // condition2: `recordStartDate <= week.endDate: ${recordStartDate <= week.endDate}`,
 // isMatching,
 // cardioPoints: record.cardio_points_total
 // });
 // }

 return isMatching;
 });

 const totalCardioPoints = weekRecord?.cardio_points_total || 0;
 const strengthSessions = weekRecord?.strength_sessions_count || 0;
 const actualPercentage = Math.round(totalCardioPoints * 10) / 10;

 // 첫 번째 사용자의 첫 두 주차만 매핑 상황 로그
 // if (user.id === users[0]?.id && index < 2) {
 // console.log(`🔗 W${week.weekNumber} 매핑 결과:`, {
 // weekLabel: week.label,
 // weekStartEnd: `${week.startDate.toISOString().split('T')[0]} ~ ${week.endDate.toISOString().split('T')[0]}`,
 // foundRecord: !!weekRecord,
 // recordInfo: weekRecord ? {
 // start_date: weekRecord.start_date,
 // end_date: weekRecord.end_date,
 // cardio_points_total: weekRecord.cardio_points_total
 // } : null,
 // totalCardioPoints,
 // strengthSessions
 // });
 // }

 return {
 weekNumber: week.weekNumber,
 startDate,
 endDate,
 aerobicPercentage: totalCardioPoints,
 actualPercentage,
 strengthSessions,
 label: week.label,
 };
 });

 const lastWeek = userWeeklyData.at(-1);
 const isActiveThisWeek =
 userWeeklyData.length > 0 &&
 ((lastWeek?.aerobicPercentage ?? 0) > 0 ||
 (lastWeek?.strengthSessions ?? 0) > 0);

 const totalAchievement = userWeeklyData.reduce(
 (sum, week) => sum + week.aerobicPercentage,
 0
 );

 return {
 id: user.id,
 challenge_id: challengeId || 'default-challenge',
 userId: user.id,
 userName: user.username || '-',
 name: user.name || '유저',
 weeklyData: userWeeklyData,
 hasUploaded: userPointsMap[user.id] > 0,
 activeThisWeek: isActiveThisWeek,
 totalAchievements: totalAchievement,
 };
 });

 return items.sort((a, b) => {
 const aTotal = a.weeklyData.reduce(
 (sum, week) => sum + week.aerobicPercentage,
 0
 );
 const bTotal = b.weeklyData.reduce(
 (sum, week) => sum + week.aerobicPercentage,
 0
 );
 return bTotal - aTotal;
 });
 };

 // Calculate total achievements
 const calculateTotalAchievements = (items: WorkoutItem[]): number => {
 return items.reduce((sum, item) => {
 return sum + (item.totalAchievements || 0);
 }, 0);
 };

 const calculateActiveMembersPercent = (items: WorkoutItem[]): number => {
 if (!items || items.length === 0) return 0;
 const activeMembers = items.filter((item) => item.activeThisWeek).length;
 return Math.round((activeMembers / items.length) * 100);
 };

 const handleSort = (key: string) => {
 let direction: 'asc' | 'desc' = 'asc';
 if (sortConfig.key === key && sortConfig.direction === 'asc') {
 direction = 'desc';
 }
 setSortConfig({ key, direction });
 };

 const sortedWorkoutItems = useMemo(() => {
 if (!sortConfig.key) return workoutItems;

 const sorted = [...workoutItems].sort((a, b) => {
 let aValue: any;
 let bValue: any;

 if (sortConfig.key === 'id') {
 aValue = a.userName || '';
 bValue = b.userName || '';
 } else if (sortConfig.key === 'name') {
 aValue = a.name || '';
 bValue = b.name || '';
 } else if (sortConfig.key.startsWith('week-')) {
 const weekIndex = parseInt(sortConfig.key.split('-')[1]);
 const aWeekData = a.weeklyData[weekIndex];
 const bWeekData = b.weeklyData[weekIndex];
 aValue = aWeekData ? aWeekData.aerobicPercentage : 0;
 bValue = bWeekData ? bWeekData.aerobicPercentage : 0;
 }

 if (typeof aValue === 'string' && typeof bValue === 'string') {
 return sortConfig.direction === 'asc'
 ? aValue.localeCompare(bValue)
 : bValue.localeCompare(aValue);
 }

 if (typeof aValue === 'number' && typeof bValue === 'number') {
 return sortConfig.direction === 'asc'
 ? aValue - bValue
 : bValue - aValue;
 }

 return 0;
 });

 return sorted;
 }, [workoutItems, sortConfig]);

 const getSortIcon = (columnKey: string) => {
 if (sortConfig.key !== columnKey) {
 return (
 <Image
 src="/svg/arrow-down.svg"
 width={10}
 height={10}
 alt="sort"
 className="opacity-50"
 />
 );
 }
 return (
 <Image
 src="/svg/arrow-down.svg"
 width={10}
 height={10}
 alt="sort"
 className={`transition-transform ${
 sortConfig.direction === 'desc' ? 'rotate-180' : ''
 }`}
 />
 );
 };

 // Process data when React Query data is available
 useEffect(() => {
 processWorkoutData();
 }, [processWorkoutData]);

 // Media query detection
 useEffect(() => {
 const checkIsMobile = () => {
 setIsMobile(window.innerWidth < 768);
 };

 checkIsMobile();
 window.addEventListener('resize', checkIsMobile);

 return () => {
 window.removeEventListener('resize', checkIsMobile);
 };
 }, []);

 // Intersection observer handler
 const handleObserver = useCallback(
 (entries: IntersectionObserverEntry[]) => {
 const target = entries[0];
 if (target.isIntersecting && !isLoading && hasMore) {
 const currentScrollPosition = window.scrollY;
 setPage((prev) => {
 const nextPage = prev + 1;
 requestAnimationFrame(() => {
 window.scrollTo(0, currentScrollPosition);
 });
 return nextPage;
 });
 }
 },
 [isLoading, hasMore]
 );

 // Set up intersection observer
 useEffect(() => {
 const observer = new IntersectionObserver(handleObserver, {
 root: null,
 rootMargin: '20px',
 threshold: 0.1,
 });
 observerRef.current = observer;

 const currentLastRow = lastRowRef.current;
 if (currentLastRow) {
 observer.observe(currentLastRow);
 }

 return () => {
 if (currentLastRow) {
 observer.unobserve(currentLastRow);
 }
 };
 }, [handleObserver, sortedWorkoutItems]);

 if (isLoading) {
 return <WorkoutPageSkeleton />;
 }

 if (error) {
 return (
 <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
 <h2 className="font-bold">API 오류 발생</h2>
 <p>{error.message}</p>
 </div>
 );
 }

 // Mobile card component
 const MobileCard = ({ item, index }: { item: WorkoutItem; index: number }) => {
 const currentWeekIndex = weekInfo.findIndex((week) =>
 isCurrentWeek(week.startDate, week.endDate)
 );
 const currentWeekData = currentWeekIndex >= 0 ? item.weeklyData[currentWeekIndex] : null;

 return (
 <div
 className="bg-surface rounded-xl shadow-sm border border-line p-4 mb-3 active:bg-surface-raised dark:active:bg-neutral-700 transition-colors"
 onClick={() => {
 if (currentWeekData) {
 router.push(
 `/${item.challenge_id}/workout/${item.userId}/${currentWeekData.weekNumber}?label=${currentWeekData.label}`
 );
 }
 }}
 >
 {/* 헤더: 순위, 이름, ID */}
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
 {index + 1}
 </div>
 <div>
 <div className="font-medium text-content-primary">{item.name}</div>
 <div className="text-xs text-content-tertiary">{item.userName}</div>
 </div>
 </div>
 <svg className="w-5 h-5 text-content-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </div>

 {/* 이번 주 데이터 */}
 {currentWeekData && (
 <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-3">
 <div className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">
 이번 주 (W{currentWeekData.weekNumber})
 </div>
 <div className="flex items-center gap-4">
 <div>
 <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
 {currentWeekData.aerobicPercentage === 0
 ? '-'
 : `${currentWeekData.aerobicPercentage.toFixed(1)}%`}
 </span>
 <span className="text-xs text-content-tertiary ml-1">유산소</span>
 </div>
 <div className="w-px h-6 bg-surface-sunken" />
 <div>
 <span className="text-lg font-bold text-content-secondary">
 {currentWeekData.strengthSessions === 0
 ? '-'
 : currentWeekData.strengthSessions}
 </span>
 <span className="text-xs text-content-tertiary ml-1">근력</span>
 </div>
 </div>
 </div>
 )}

 {/* 주차별 미니 차트 */}
 <div className="flex gap-1 overflow-x-auto pb-1">
 {item.weeklyData.slice(-6).map((week, weekIndex) => {
 const actualIndex = Math.max(0, item.weeklyData.length - 6) + weekIndex;
 const weekData = weekInfo[actualIndex];
 const isCurrent = weekData ? isCurrentWeek(weekData.startDate, weekData.endDate) : false;
 const percentage = Math.min(week.aerobicPercentage, 100);

 return (
 <div
 key={weekIndex}
 className={`flex-1 min-w-[40px] cursor-pointer ${isCurrent ? 'opacity-100' : 'opacity-70'}`}
 onClick={(e) => {
 e.stopPropagation();
 router.push(
 `/${item.challenge_id}/workout/${item.userId}/${week.weekNumber}?label=${week.label}`
 );
 }}
 >
 <div className="text-[10px] text-center text-content-tertiary mb-1">
 W{week.weekNumber}
 </div>
 <div className="h-12 bg-surface-raised rounded relative overflow-hidden">
 <div
 className={`absolute bottom-0 left-0 right-0 transition-all ${
 isCurrent ? 'bg-blue-500' : 'bg-blue-300 dark:bg-blue-600'
 }`}
 style={{ height: `${percentage}%` }}
 />
 </div>
 <div className="text-[10px] text-center text-content-secondary mt-1">
 {week.aerobicPercentage === 0 ? '-' : `${week.aerobicPercentage.toFixed(0)}%`}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
 };

 // Render mobile or desktop view
 if (isMobile) {
 return (
 <div className="mt-4 px-4">
 {/* 모바일 헤더 */}
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-content-primary">
 참가자 ({sortedWorkoutItems.length}명)
 </h2>
 </div>

 {/* 모바일 카드 리스트 */}
 <div className="space-y-3">
 {sortedWorkoutItems.map((item, index) => (
 <MobileCard key={item.id} item={item} index={index} />
 ))}
 </div>

 {sortedWorkoutItems.length === 0 && (
 <div className="text-center py-12 text-content-tertiary">
 참가자 데이터가 없습니다
 </div>
 )}
 </div>
 );
 }

 // Desktop rendering
 return (
 <div className="mt-6 px-8 overflow-x-auto w-full">
 {/* Main workout table */}
 <div className="w-full overflow-x-auto bg-surface shadow rounded-lg border border-line">
 <table className="w-full min-w-[1000px]">
 <thead>
 <tr className="bg-surface text-content-tertiary">
 <th className="w-[3%] p-3 text-center">
 <span className="text-sm">#</span>
 </th>
 <th className="w-[5%] p-3 text-left">
 <div className="flex items-center justify-start gap-1">
 <span className="text-sm">ID</span>
 <button
 onClick={() => handleSort('id')}
 className="hover:opacity-75 transition-opacity"
 >
 {getSortIcon('id')}
 </button>
 </div>
 </th>
 <th className="w-[10%] p-3 text-left">
 <div className="flex items-center justify-start gap-1">
 <span className="text-sm">이름</span>
 <button
 onClick={() => handleSort('name')}
 className="hover:opacity-75 transition-opacity"
 >
 {getSortIcon('name')}
 </button>
 </div>
 </th>
 {/* Dynamic week headers */}
 {weekInfo.map((week, index) => {
 const isCurrent = isCurrentWeek(week.startDate, week.endDate);
 return (
 <th
 key={index}
 className={`w-[10%] p-3 text-center ${
 isCurrent
 ? 'bg-blue-50 dark:bg-blue-900/30'
 : ''
 }`}
 >
 <div className="text-sm">
 <div className="flex items-center justify-center gap-1">
 <div
 className={`font-semibold ${
 isCurrent ? 'text-blue-600' : ''
 }`}
 >
 W{week.weekNumber}
 </div>
 <button
 onClick={() => handleSort(`week-${index}`)}
 className="hover:opacity-75 transition-opacity"
 >
 {getSortIcon(`week-${index}`)}
 </button>
 </div>
 <div
 className={`text-[10px] font-normal mt-1 ${
 isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-content-tertiary'
 }`}
 >
 {typeof week.label === 'string'
 ? week.label
 : `${week.startDate}-${week.endDate}`}
 </div>
 </div>
 </th>
 );
 })}
 </tr>
 </thead>
 <tbody>
 {sortedWorkoutItems.map((item, index) => {
 // console.log('item', item);
 return (
 <tr
 key={index}
 ref={
 index === sortedWorkoutItems.length - 1 ? lastRowRef : null
 }
 className="border-b border-line hover:bg-[#F4F6FC]"
 >
 <td className="p-3 text-center text-content-tertiary">{index + 1}</td>
 <td className="p-3">
 <div className="text-content-primary">
 {item.userName || '-'}
 </div>
 </td>
 <td className="p-3 text-content-primary">{item.name}</td>
 {item.weeklyData.map((week, weekIndex) => {
 const currentWeekInfo = weekInfo[weekIndex];
 const isCurrent = currentWeekInfo
 ? isCurrentWeek(
 currentWeekInfo.startDate,
 currentWeekInfo.endDate
 )
 : false;

 return (
 <td
 key={weekIndex}
 className={`p-3 text-center cursor-pointer ${
 isCurrent
 ? 'bg-blue-50 dark:bg-blue-900/30'
 : ''
 }`}
 onClick={() =>
 router.push(
 `/${item.challenge_id}/workout/${item.userId}/${week.weekNumber}?label=${week.label}`
 )
 }
 >
 <div className="flex flex-col">
 <span
 className={
 week.aerobicPercentage === 0
 ? 'text-content-disabled'
 : 'text-blue-600 dark:text-blue-400'
 }
 >
 {week.aerobicPercentage === 0
 ? '-'
 : `${week.aerobicPercentage.toFixed(1)}%`}
 </span>
 <span className="text-content-disabled text-sm">
 {week.strengthSessions === 0
 ? '-'
 : `${week.strengthSessions}`}
 </span>
 </div>
 </td>
 );
 })}
 {[
 ...Array(
 Math.max(0, weekInfo.length - item.weeklyData.length)
 ),
 ].map((_, i) => {
 const emptyWeekIndex = item.weeklyData.length + i;
 const currentWeekInfo = weekInfo[emptyWeekIndex];
 const isCurrent = currentWeekInfo
 ? isCurrentWeek(
 currentWeekInfo.startDate,
 currentWeekInfo.endDate
 )
 : false;

 return (
 <td
 key={`empty-${i}`}
 className={`p-3 text-center ${
 isCurrent
 ? 'bg-blue-50 dark:bg-blue-900/30'
 : ''
 }`}
 >
 -
 </td>
 );
 })}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default memo(WorkoutTable);
