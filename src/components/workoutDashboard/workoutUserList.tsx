'use client';
import React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// Helper function to generate week labels based on challenge period
const generateWeekLabels = (startDateStr: string, endDateStr: string) => {
 const startDate = new Date(startDateStr);
 const endDate = new Date(endDateStr);

 const weeks: WeekInfo[] = [];
 let weekNumber = 1; // W1부터 시작

 // Get the day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 const startDay = startDate.getDay();

 // Calculate the Monday of the week containing the start date
 let currentStart = new Date(startDate);
 if (startDay !== 1) {
 // If not Monday, go back to the previous Monday
 const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
 currentStart.setDate(currentStart.getDate() - daysSinceMonday);
 }
 // If start date is not Monday, create W0 from that week's Monday
 if (startDay !== 1) {
 const currentEnd = new Date(currentStart);
 currentEnd.setDate(currentEnd.getDate() + 6); // Sunday

 const formattedStart = formatDateToMMDD(currentStart);
 const formattedEnd = formatDateToMMDD(currentEnd);

 weeks.push({
 label: `${formattedStart}-${formattedEnd}`,
 startDate: new Date(currentStart),
 endDate: new Date(currentEnd),
 weekNumber: weekNumber,
 });
 weekNumber++;

 // Move to next Monday for W1
 currentStart = new Date(currentEnd);
 currentStart.setDate(currentStart.getDate() + 1);
 }

 // Generate full weeks starting from Monday
 while (currentStart < endDate) {
 const currentEnd = new Date(currentStart);
 currentEnd.setDate(currentEnd.getDate() + 6); // Sunday (7-day week)

 // Don't exceed the end date
 const actualEnd = currentEnd > endDate ? endDate : currentEnd;

 const formattedStart = formatDateToMMDD(currentStart);
 const formattedEnd = formatDateToMMDD(actualEnd);

 weeks.push({
 label: `${formattedStart}-${formattedEnd}`,
 startDate: new Date(currentStart),
 endDate: new Date(actualEnd),
 weekNumber: weekNumber,
 });
 weekNumber++;

 // Move to next Monday
 currentStart = new Date(currentEnd);
 currentStart.setDate(currentStart.getDate() + 1);
 }

 return weeks;
};

const isWorkoutUploaded = (workoutName: number) => {
 return workoutName !== 0 ? (
 <>
 <div>
 <Image
 src="/svg/check-orange.svg"
 width={30}
 height={30}
 alt="meal-done"
 className="w-[1.5rem] h-[1.5rem]"
 />
 </div>
 </>
 ) : (
 <>
 <Image
 src="/svg/incomplete-icon.svg"
 width={30}
 height={30}
 alt="meal-incompleted"
 className="w-[1.5rem] h-[1.5rem]"
 />
 </>
 );
};

// WorkoutTable component
const WorkoutUserList: React.FC<
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
 const observerRef = useRef<IntersectionObserver | null>(null);
 const lastRowRef = useRef(null);
 const router = useRouter();

 // Props로 데이터 받음 (중복 API 호출 방지)

 // 주차 정보를 useMemo로 메모화하여 무한 렌더링 방지
 const generatedWeeks = useMemo(() => {
 console.log('🔍 generatedWeeks useMemo 실행:', {
 hasWeeklyChart: !!weeklyChart,
 challengePeriod: weeklyChart?.challengePeriod,
 weeklyChartWeeks: weeklyChart?.weeks?.length || 0,
 });

 if (!weeklyChart) return [];

 if (
 weeklyChart.challengePeriod &&
 weeklyChart.challengePeriod.startDate &&
 weeklyChart.challengePeriod.endDate
 ) {
 console.log('📅 challengePeriod로 주차 생성:', {
 startDate: weeklyChart.challengePeriod.startDate,
 endDate: weeklyChart.challengePeriod.endDate,
 });
 const generated = generateWeekLabels(
 weeklyChart.challengePeriod.startDate,
 weeklyChart.challengePeriod.endDate
 );
 console.log('📊 generateWeekLabels 결과:', generated);
 return generated;
 } else if (weeklyChart.weeks && weeklyChart.weeks.length > 0) {
 console.log('📋 API weeks 사용:', weeklyChart.weeks);
 return weeklyChart.weeks;
 }

 console.log('⚠️ 주차 데이터 없음');
 return [];
 }, [
 weeklyChart?.challengePeriod?.startDate,
 weeklyChart?.challengePeriod?.endDate,
 weeklyChart?.weeks,
 ]);

 // weekInfo 업데이트는 별도 useEffect로 분리
 useEffect(() => {
 if (generatedWeeks.length > 0) {
 setWeekInfo(generatedWeeks);
 }
 }, [generatedWeeks]);

 // Process API data to workout items 함수를 메모화
 const processApiDataToWorkoutItems = useCallback(
 async (
 weeklyChartData: WeeklyChartData,
 leaderboardData: LeaderboardEntry[],
 todayCountData: TodayCountData,
 generatedWeeks: WeekInfo[],
 batchUserData?: any
 ): Promise<WorkoutItem[]> => {
 const users = weeklyChartData.users || [];
 const cardioData = weeklyChartData.cardio || [];
 const strengthData = weeklyChartData.strength || [];

 console.log('🔍 API 데이터 구조:', {
 usersCount: users.length,
 cardioDataCount: cardioData.length,
 strengthDataCount: strengthData.length,
 cardioSample: cardioData[0],
 strengthSample: strengthData[0],
 generatedWeeksCount: generatedWeeks.length,
 });

 const userPointsMap: Record<string, number> = {};
 leaderboardData?.forEach((item) => {
 userPointsMap[item.user_id] = item.points;
 });

 // 대용량 데이터 처리를 위한 배치 처리
 const BATCH_SIZE = 20; // 한 번에 20명씩 처리
 const results: WorkoutItem[] = [];

 for (let i = 0; i < users.length; i += BATCH_SIZE) {
 const userBatch = users.slice(i, i + BATCH_SIZE);

 const batchResults = await Promise.all(
 userBatch.map(async (user) => {
 // 기존 로직을 여기에 구현
 const userData = batchUserData?.find(
 (data: any) => data.userId === user.id
 );
 const totalCardioPoints = userData?.stats?.totalCardioPoints || 0;

 // 주차별 데이터 처리
 const weeklyData = generatedWeeks.map((week, idx) => {
 console.log(`👤 ${user.name} W${idx} 처리:`, {
 week,
 idx,
 weekNumber: week.weekNumber,
 parsedWeekNumber: week.weekNumber
 ? parseInt(week.weekNumber.replace('W', ''))
 : idx + 1,
 });

 // 날짜 범위로 운동 데이터 매칭 (라벨이 아닌 실제 날짜로)
 const cardioPoints = cardioData
 .filter((c) => {
 if (c.userId !== user.id) return false;
 // API 데이터의 startDate, endDate와 현재 주차의 날짜 범위 비교
 const apiStartDate = new Date(c.startDate + 'T00:00:00Z');
 const apiEndDate = new Date(c.endDate + 'T00:00:00Z');
 const weekStartDate = new Date(week.startDate);
 const weekEndDate = new Date(week.endDate);

 // 날짜 범위가 겹치는지 확인
 return (
 apiStartDate.getTime() <= weekEndDate.getTime() &&
 apiEndDate.getTime() >= weekStartDate.getTime()
 );
 })
 .reduce((sum, c) => sum + c.y, 0);

 const strengthSessions = strengthData.filter((s) => {
 if (s.userId !== user.id) return false;
 // API 데이터의 startDate, endDate와 현재 주차의 날짜 범위 비교
 const apiStartDate = new Date(s.startDate + 'T00:00:00Z');
 const apiEndDate = new Date(s.endDate + 'T00:00:00Z');
 const weekStartDate = new Date(week.startDate);
 const weekEndDate = new Date(week.endDate);

 // 날짜 범위가 겹치는지 확인
 return (
 apiStartDate.getTime() <= weekEndDate.getTime() &&
 apiEndDate.getTime() >= weekStartDate.getTime()
 );
 }).length;

 const weekRecord = userData?.weeklyRecords?.find(
 (record: any) => {
 const recordStartDate = new Date(record.start_date);
 const recordEndDate = new Date(record.end_date);
 return (
 recordStartDate.getTime() === week.startDate.getTime() &&
 recordEndDate.getTime() === week.endDate.getTime()
 );
 }
 );

 const finalWeekNumber = week.weekNumber
 ? parseInt(week.weekNumber.replace('W', ''))
 : idx + 1;

 console.log(`📊 최종 weekNumber: ${finalWeekNumber}`);

 return {
 weekNumber: finalWeekNumber,
 startDate: week.label.split('-')[0],
 endDate: week.label.split('-')[1],
 aerobicPercentage: cardioPoints,
 actualPercentage: cardioPoints,
 strengthSessions,
 cardio_points_total: weekRecord?.cardio_points_total || 0,
 };
 });

 return {
 id: user.id,
 challenge_id: challengeId,
 userId: user.id,
 userName: user.name?.split(' ')[0] || '유저',
 name: user.name || '유저',
 weeklyData,
 hasUploaded: (userPointsMap[user.id] || 0) > 0,
 totalAchievements: totalCardioPoints,
 activeThisWeek: true,
 };
 })
 );

 results.push(...batchResults);

 // 브라우저가 다른 작업을 처리할 수 있도록 잠깐 대기
 if (i + BATCH_SIZE < users.length) {
 await new Promise((resolve) => setTimeout(resolve, 0));
 }
 }

 return results;
 },
 [challengeId]
 );

 // Process data when React Query data changes
 const processWorkoutData = useCallback(async () => {
 if (
 !weeklyChart ||
 !leaderboard ||
 !todayCount ||
 generatedWeeks.length === 0
 ) {
 return;
 }

 try {
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
 }, [
 weeklyChart,
 leaderboard,
 todayCount,
 batchUserData,
 generatedWeeks,
 processApiDataToWorkoutItems,
 ]);

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
 }, [handleObserver, workoutItems]);

 if (isLoading) {
 // console.log('🔄 WorkoutUserList 로딩 중...', { challengeId, isLoading });
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

 return (
 <div className="mt-[3rem] sm:px-[1rem] lg:hidden md:hidden sm:block w-full">
 <div className="flex flex-col gap-4">
 {workoutItems.map((user, index) => {
 return (
 <div
 key={index}
 className="pt-[0rem] pb-[2rem] sm:bg-surface rounded-md shadow dark:shadow-none dark:border cursor-pointer"
 onClick={() => {
 // console.log('👤 사용자 카드 클릭됨!', {
 // user: user.name,
 // userId: user.userId,
 // challengeId,
 // weeklyDataLength: user.weeklyData.length
 // });

 // 첫 번째 주차로 이동
 const firstWeek = user.weeklyData[0];
 if (firstWeek) {
 const weekLabel =
 firstWeek.startDate && firstWeek.endDate
 ? `${firstWeek.startDate}-${firstWeek.endDate}`
 : `W${firstWeek.weekNumber}`;

 const targetUrl = `/${challengeId}/workout/${user.userId}/${firstWeek.weekNumber}?label=${weekLabel}`;
 // console.log('🚀 이동할 URL (카드 클릭):', targetUrl);

 router.push(targetUrl);
 } else {
 // fallback: 기본 사용자 페이지
 const fallbackUrl = `/${challengeId}/workout/${user.userId}/0`;
 // console.log('🚀 이동할 URL (fallback):', fallbackUrl);
 router.push(fallbackUrl);
 }
 }}
 >
 <div className="text-content-tertiary text-title-lg font-bold pt-[1rem] pl-[1rem] pb-[1rem]">
 {user.name}
 </div>
 <table className="w-full">
 <tbody>
 {Array.from({
 length: Math.ceil(user.weeklyData.length / 7),
 }).map((_, groupIdx) => {
 const start = groupIdx * 7;
 const end = start + 7;
 const weekSlice = user.weeklyData.slice(start, end);
 return (
 <React.Fragment key={groupIdx}>
 <tr className="sm:pl-[0.5rem] flex w-full justify-start gap-[0.9rem] text-content-disabled text-title font-medium">
 {weekSlice.map((week, i) => (
 <th key={i} className="text-center min-w-[2.5rem]">
 {week.weekNumber}주
 </th>
 ))}
 </tr>
 <tr className="flex w-full justify-start gap-[0.5rem]">
 {weekSlice.map((week, i) => (
 <td
 key={i}
 className="text-center p-3 cursor-pointer hover:bg-surface-raised"
 onClick={(e) => {
 e.stopPropagation(); // 부모 클릭 이벤트 방지
 // console.log('🎯 주차별 운동량 칸 클릭됨!', {
 // user: user.name,
 // userId: user.userId,
 // weekNumber: week.weekNumber,
 // challengeId,
 // week
 // });

 // startDate와 endDate가 있으면 MM.DD-MM.DD 형식으로, 아니면 기본 라벨 사용
 const weekLabel =
 week.startDate && week.endDate
 ? `${week.startDate}-${week.endDate}`
 : `W${week.weekNumber}`;

 const targetUrl = `/${challengeId}/workout/${user.userId}/${week.weekNumber}?label=${weekLabel}`;
 // console.log('🚀 이동할 URL:', targetUrl);

 router.push(targetUrl);
 }}
 >
 <div className="flex flex-col items-center">
 {isWorkoutUploaded(week.aerobicPercentage)}
 <div className="text-xs text-content-disabled mt-1">
 {week.strengthSessions === 0
 ? '-'
 : `${week.strengthSessions}`}
 </div>
 </div>
 </td>
 ))}
 </tr>
 </React.Fragment>
 );
 })}
 </tbody>
 </table>
 </div>
 );
 })}
 </div>
 </div>
 );
};

export default WorkoutUserList;
