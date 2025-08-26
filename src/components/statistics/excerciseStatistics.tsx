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
}

const ExcerciseStatistics = memo(function ExcerciseStatistics({
  processedMeals,
  selectedChallengeId,
  dailyRecords,
  selectedDate,
  weeklyChart,
  todayCount,
  isLoading = false,
}: ExcerciseStatsProps) {

  // 계산 결과를 useMemo로 캐싱하여 불필요한 재계산 방지
  const { totalWorkouts, weeklyAverage } = useMemo(() => {
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
      
      // 이번주에 해당하는 주차 찾기 (현재 날짜 기준)
      const now = new Date();
      const thisWeekCardioData = weeklyChart.cardioData.filter(item => {
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        return now >= startDate && now <= endDate && item.points > 0;
      });

      // 사용자별 이번주 유산소 포인트 계산
      const thisWeekUserPoints = new Map();
      thisWeekCardioData.forEach(item => {
        const currentPoints = thisWeekUserPoints.get(item.userId) || 0;
        thisWeekUserPoints.set(item.userId, currentPoints + item.points);
      });

      // 주간 평균 운동점수 = 이번주 참여한 사용자들의 평균 유산소 포인트
      participantCount = thisWeekUserPoints.size;
      if (participantCount > 0) {
        thisWeekUserPoints.forEach(points => {
          totalCardioPoints += points;
        });
      }
      
      const avgPercentage = participantCount > 0 ? Math.round(totalCardioPoints / participantCount * 10) / 10 : 0;
      
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
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
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
  }, [weeklyChart]);

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
            textColor="text-blue-5"
            loading={false}
          />
        </div>
        <div className="transition-all duration-300 ease-in-out">
          <TotalFeedbackCounts
            counts={`${todayStats.count}`}
            total={`${todayStats.total} 명`}
            title="오늘 운동 업로드 멤버"
            borderColor="border-blue-5"
            textColor="text-blue-5"
            loading={false}
          />
        </div>
        <div className="transition-all duration-300 ease-in-out">
          <TotalFeedbackCounts
            counts={`${weeklyAverage}`}
            title="주간 평균 운동점수"
            borderColor="border-blue-5"
            textColor="text-blue-5"
            loading={false}
          />
        </div>
      </div>
    </>
  );
});

export { ExcerciseStatistics };