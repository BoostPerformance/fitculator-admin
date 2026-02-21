'use client';
import { ProcessedMeal } from '@/types/dietDetaileTableTypes';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import { ChallengeParticipant } from '@/types/userPageTypes';
import { useEffect, useState, memo, useMemo } from 'react';
import { ExcerciseStatisticsSkeleton } from './excerciseStatisticsSkeleton';

interface ExcerciseStatsProps {
 processedMeals: ProcessedMeal[];
 selectedChallengeId?: string;
 dailyRecords?: ChallengeParticipant[];
 selectedDate: string;
 weeklyChart?: any;
 todayCount?: any;
 isLoading?: boolean;
 challengeEndDate?: string;
}

const ExcerciseStatistics = memo(function ExcerciseStatistics({
 processedMeals,
 selectedChallengeId,
 dailyRecords,
 selectedDate,
 weeklyChart,
 todayCount,
 isLoading = false,
 challengeEndDate,
}: ExcerciseStatsProps) {

 // 계산 결과를 useMemo로 캐싱하여 불필요한 재계산 방지
 const { totalWorkouts, weeklyAverage } = useMemo(() => {
 console.log('🔍 ExcerciseStatistics - weeklyChart 데이터:', weeklyChart);
 if (!weeklyChart) return { totalWorkouts: 0, weeklyAverage: 0 };

 // 새로운 API 응답 형식 처리
 // workout_weekly_records 기반 데이터
 if (weeklyChart.cardioData && weeklyChart.strengthData) {
 // 전체 운동 업로드 수 계산
 let totalCount = 0;
 let totalCardioPoints = 0;
 let participantCount = 0;

 // 사용자별 유산소 포인트 집계
 const userCardioPoints = new Map();

 if (Array.isArray(weeklyChart.cardioData)) {
 weeklyChart.cardioData.forEach(item => {
 if (item.points > 0) {
 totalCount++;
 const currentPoints = userCardioPoints.get(item.userId) || 0;
 userCardioPoints.set(item.userId, currentPoints + item.points);
 }
 });
 }

 if (Array.isArray(weeklyChart.strengthData)) {
 weeklyChart.strengthData.forEach(item => {
 totalCount += item.sessions || 0;
 });
 }

 // 기준 날짜 결정: 종료된 프로그램은 종료일, 진행 중인 프로그램은 오늘
 const now = new Date();
 let referenceDate = now;

 if (challengeEndDate) {
 const endDate = new Date(challengeEndDate);
 // 종료일이 오늘보다 이전이면 종료된 프로그램
 if (endDate < now) {
 referenceDate = endDate;
 }
 }

 // 해당 주에 해당하는 주차 찾기 (referenceDate 기준)
 const targetWeekCardioData = weeklyChart.cardioData.filter(item => {
 const startDate = new Date(item.startDate);
 const endDate = new Date(item.endDate);
 return referenceDate >= startDate && referenceDate <= endDate && item.points > 0;
 });

 // 사용자별 해당 주 유산소 포인트 계산
 const targetWeekUserPoints = new Map();
 targetWeekCardioData.forEach(item => {
 const currentPoints = targetWeekUserPoints.get(item.userId) || 0;
 targetWeekUserPoints.set(item.userId, currentPoints + item.points);
 });

 // 주간 평균 운동점수 = 해당 주 참여한 사용자들의 평균 유산소 포인트
 participantCount = targetWeekUserPoints.size;
 console.log('🔍 해당 주 데이터:', {
 기준날짜: referenceDate.toISOString().split('T')[0],
 종료일: challengeEndDate,
 해당주운동한사용자수: participantCount,
 해당주사용자포인트맵: Array.from(targetWeekUserPoints.entries()),
 전체cardioData길이: weeklyChart.cardioData.length
 });

 if (participantCount > 0) {
 targetWeekUserPoints.forEach(points => {
 totalCardioPoints += points;
 });
 }

 const avgPercentage = participantCount > 0 ? Math.round(totalCardioPoints / participantCount * 10) / 10 : 0;
 console.log('📊 주간 평균 계산 결과:', {
 총참여자수: participantCount,
 총포인트: totalCardioPoints,
 평균점수: avgPercentage
 });

 return {
 totalWorkouts: totalCount,
 weeklyAverage: avgPercentage
 };
 }
 
 // 기존 API 응답 형식 (폴백)
 let totalCount = 0;
 
 if (weeklyChart.cardio && Array.isArray(weeklyChart.cardio)) {
 totalCount += weeklyChart.cardio.length;
 }
 if (weeklyChart.strength && Array.isArray(weeklyChart.strength)) {
 totalCount += weeklyChart.strength.length;
 }

 // 주간 평균 계산
 let avgPercentage = 0;
 if (weeklyChart.cardio && weeklyChart.cardio.length > 0) {
 // 기준 날짜 결정: 종료된 프로그램은 종료일, 진행 중인 프로그램은 오늘
 const now = new Date();
 let referenceDate = now;

 if (challengeEndDate) {
 const endDate = new Date(challengeEndDate);
 // 종료일이 오늘보다 이전이면 종료된 프로그램
 if (endDate < now) {
 referenceDate = endDate;
 }
 }

 const dayOfWeek = referenceDate.getDay();
 const startOfWeek = new Date(referenceDate);
 startOfWeek.setDate(referenceDate.getDate() - dayOfWeek);
 startOfWeek.setHours(0, 0, 0, 0);

 const endOfWeek = new Date(startOfWeek);
 endOfWeek.setDate(startOfWeek.getDate() + 6);
 endOfWeek.setHours(23, 59, 59, 999);

 const currentWeekData = weeklyChart.cardio.filter((item) => {
 const itemDate = new Date(item.date || item.startDate);
 return itemDate >= startOfWeek && itemDate <= endOfWeek;
 });

 if (currentWeekData.length > 0) {
 const totalPercentage = currentWeekData.reduce(
 (sum, item) => sum + (item.y || item.points || 0),
 0
 );
 avgPercentage = parseFloat(
 (totalPercentage / currentWeekData.length).toFixed(1)
 );
 }
 }

 return { totalWorkouts: totalCount, weeklyAverage: avgPercentage };
 }, [weeklyChart, challengeEndDate]);

 const todayStats = useMemo(() => 
 todayCount || { count: 0, total: 0 }, 
 [todayCount]
 );

 // 로딩 중이고 데이터가 없을 때만 스켈레톤 표시
 if (isLoading && !weeklyChart && !todayCount) {
 return <ExcerciseStatisticsSkeleton />;
 }

 return (
 <>
 <div className="grid grid-cols-3 sm:grid-cols-1 gap-4 px-8 pb-[3rem] sm:px-3">
 <div className="transition-all duration-300 ease-in-out">
 <TotalFeedbackCounts
 counts={`${totalWorkouts}개`}
 title="전체 운동 업로드 수"
 borderColor="border-blue-5"
 textColor="text-accent"
 loading={false}
 />
 </div>
 <div className="transition-all duration-300 ease-in-out">
 <TotalFeedbackCounts
 counts={`${todayStats.count}`}
 total={`${todayStats.total} 명`}
 title="오늘 운동 업로드 멤버"
 borderColor="border-blue-5"
 textColor="text-accent"
 loading={false}
 />
 </div>
 <div className="transition-all duration-300 ease-in-out">
 <TotalFeedbackCounts
 counts={`${weeklyAverage}`}
 title="주간 평균 운동점수"
 borderColor="border-blue-5"
 textColor="text-accent"
 loading={false}
 />
 </div>
 </div>
 </>
 );
});

export { ExcerciseStatistics };