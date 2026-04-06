import { WeeklyWorkout } from '@/components/hooks/useWorkoutData';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface WeeklyWorkoutChartProps {
 userName: string;
 weeklyWorkouts?: WeeklyWorkout[];
 userId?: string; // 사용자 ID
 weekNumberParam?: number;
 fetchedUserName?: string; // 사용자명
 username?: string | null; // 사용자 username
 // currentWeekRealPoints 제거 - 모든 주차에서 cardioPointsTotal 사용
}

export default function WeeklyWorkoutChart({
 userName = '사용자',
 weeklyWorkouts = [],
 userId = 'USER',
 weekNumberParam,
 fetchedUserName,
 username,
}: WeeklyWorkoutChartProps) {
 const router = useRouter();
 const params = useParams();
 const challengeId = params.challengeId as string;
 
 // 더 이상 week-detail API 호출하지 않음 - user-detail에서 실제 계산된 데이터 사용

 // 포인트 표시 함수 - 모든 주차에서 user-detail API의 실제 계산된 데이터 사용
 const getDisplayPoints = (week: WeeklyWorkout) => {
 // user-detail API에서 실제 계산된 데이터 우선 사용 (모든 주차 통일)
 if (week.cardioPointsTotal !== undefined) {
 return week.cardioPointsTotal.toFixed(1);
 }
 
 // fallback으로 totalAchievement 사용
 const fallbackValue = (typeof week.totalAchievement === 'number' ? week.totalAchievement : parseFloat(week.totalAchievement) || 0);
 return fallbackValue.toFixed(1);
 };

 // 주차 클릭 핸들러
 const handleWeekClick = (weekNumber: number, label: string) => {
 const targetUrl = `/${challengeId}/workout/${userId}/${weekNumber}?label=${label}`;
 router.push(targetUrl);
 };
 
 if (!weeklyWorkouts || weeklyWorkouts.length === 0) {
 return (
 <div className="bg-surface rounded-lg p-6 mb-4 shadow-sm border border-line">
 <p className="text-center text-content-tertiary">
 주간 운동 데이터가 없습니다.
 </p>
 </div>
 );
 }

 // fetchedUserName이 null이면 '-', 있으면 그것을 사용
 const displayName = fetchedUserName === null || fetchedUserName === undefined ? '-' : fetchedUserName;
 const displayId = displayName === '-' ? '-' : (displayName.length > 5 ? displayName.substring(0, 5) : displayName);

 return (
 <>
 <div className="bg-surface rounded-lg px-6 py-1.5 mb-4 shadow-sm border border-line w-full overflow-x-auto">
 {/* 데스크탑 레이아웃 */}
 <div className="sm:hidden block w-full overflow-x-auto">
 <table className="w-full text-sm min-w-max">
 <thead>
 <tr className="text-content-tertiary text-xs">
 <th className="text-left">Week no.</th>
 {weeklyWorkouts.map((week, index) => {
 const [startDate, endDate] = week.label.split('-');
 const formatDate = (date: string) => {
 const [month, day] = date.split('.');
 return `${month.replace(/^0/, '')}.${day.replace(/^0/, '')}`;
 };
 const isCurrentWeek = week.weekNumber === weekNumberParam;
 return (
 <th key={index} className={`text-center ${isCurrentWeek ? 'bg-accent-subtle' : ''}`}>
 <span className={isCurrentWeek ? 'text-blue-600 font-semibold' : ''}>
 W{week.weekNumber}
 </span>
 <br />
 <span className="text-xs font-light">
 {formatDate(startDate)}-{formatDate(endDate)}
 </span>
 </th>
 );
 })}
 </tr>
 </thead>
 <tbody>
 <tr className="border-t border-line-subtle">
 <td className="py-2 text-left">
 <div className="text-content-tertiary">유산소</div>
 <div className="text-content-tertiary">근력</div>
 </td>
 {weeklyWorkouts.map((week, index) => {
 const isCurrentWeek = week.weekNumber === weekNumberParam;
 return (
 <td 
 key={index} 
 className={`py-2 text-center cursor-pointer hover:bg-surface-raised transition-colors ${isCurrentWeek ? 'bg-accent-subtle' : ''}`}
 onClick={() => handleWeekClick(week.weekNumber, week.label)}
 >
 <div className={`text-blue-600 dark:text-blue-400 ${isCurrentWeek ? 'font-semibold' : ''}`}>
 {`${getDisplayPoints(week)}%`}
 </div>
 <div className="text-content-tertiary text-sm">
 {week.totalSessions}
 </div>
 </td>
 );
 })}
 </tr>
 </tbody>
 </table>
 </div>
 {/* 모바일 레이아웃 */}
 <div className="sm:block hidden">
 <div className="flex justify-between text-content-tertiary text-xs border-b pb-2">
 <div>Week no.</div>
 <div>유산소 / 근력</div>
 </div>

 {weeklyWorkouts.map((week, index) => {
 const isCurrentWeek = week.weekNumber === weekNumberParam;
 return (
 <div
 key={index}
 className={`${
 index < weeklyWorkouts.length - 1 ? 'border-b py-3' : 'py-3'
 } cursor-pointer hover:bg-surface-raised transition-colors ${isCurrentWeek ? 'bg-accent-subtle' : ''}`}
 onClick={() => handleWeekClick(week.weekNumber, week.label)}
 >
 <div className="flex justify-between items-center">
 <div className={`text-content-tertiary ${isCurrentWeek ? 'text-blue-600' : ''}`}>
 <span className={isCurrentWeek ? 'font-semibold' : ''}>
 W{week.weekNumber}
 </span>
 <br />
 <span className="text-xs font-light">
 {(() => {
 const [startDate, endDate] = week.label.split('-');
 const formatDate = (date: string) => {
 const [month, day] = date.split('.');
 return `${month.replace(/^0/, '')}.${day.replace(/^0/, '')}`;
 };
 return `${formatDate(startDate)}-${formatDate(endDate)}`;
 })()}
 </span>
 </div>
 <div className="text-right">
 <div className={`text-blue-600 dark:text-blue-400 ${isCurrentWeek ? 'font-semibold' : ''}`}>
 {`${getDisplayPoints(week)}%`}
 </div>
 <div className="text-content-tertiary text-sm">
 {week.totalSessions}
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </>
 );
}
