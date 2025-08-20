import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const challengeId = url.searchParams.get('challengeId');
    const userId = url.searchParams.get('userId'); // 특정 사용자 필터링 (선택적)
    const weekLabel = url.searchParams.get('weekLabel'); // 특정 주 필터링 (선택적)
    const startDate = url.searchParams.get('startDate'); // 시작 날짜 (선택적)
    const endDate = url.searchParams.get('endDate'); // 종료 날짜 (선택적)
    //console.log('Received weekLabel:', weekLabel);

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // 1. 챌린지 참가자 목록 조회
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId);

    if (participantsError) {
// console.error('❌ Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    // 모든 참가자 또는 특정 사용자만 필터링
    let participantIds = participants?.map((p) => p.service_user_id) || [];
    if (userId && participantIds.includes(userId)) {
      participantIds = [userId];
    }

    if (participantIds.length === 0) {
      return NextResponse.json({
        weeks: [],
        categories: [],
        data: [],
      });
    }

    // 2. 챌린지 기간 가져오기
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('start_date, end_date')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
// console.error('❌ Error getting challenge:', challengeError);
      return NextResponse.json(
        { error: 'Failed to fetch challenge' },
        { status: 500 }
      );
    }

    // 3. 주별 데이터 구성을 위한 날짜 계산
    const weeks = generateWeekRanges(
      new Date(challenge.start_date),
      new Date(challenge.end_date)
    );

    // 특정 주차만 필터링
    let filteredWeeks = weeks;
    if (weekLabel) {
      // console.log('🔍 Looking for weekLabel:', weekLabel);
      // console.log('📅 Available weeks:', weeks.map(w => w.label));
      filteredWeeks = weeks.filter((week) => week.label === weekLabel);
      if (filteredWeeks.length === 0) {
        // console.log('❌ Week not found:', weekLabel);
        return NextResponse.json({ 
          error: 'Week not found',
          requestedWeek: weekLabel,
          availableWeeks: weeks.map(w => w.label)
        }, { status: 400 });
      }
    }

    // 4. 유산소 타입 ID 가져오기
    const { data: cardioType, error: cardioTypeError } = await supabase
      .from('workout_types')
      .select('id')
      .eq('name', 'CARDIO')
      .single();

    if (cardioTypeError) {
// console.error('❌ Error getting CARDIO type:', cardioTypeError);
      return NextResponse.json(
        { error: 'Failed to fetch workout types' },
        { status: 500 }
      );
    }

    // 5. 유산소 카테고리 가져오기
    const { data: cardioCategories, error: categoriesError } = await supabase
      .from('workout_categories')
      .select('id, name_ko, name_en, color')
      .eq('type_id', cardioType.id);

    if (categoriesError) {
// console.error('❌ Error fetching cardio categories:', categoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    const categoryMap = {};
    cardioCategories.forEach((category) => {
      categoryMap[category.id] = {
        name_ko: category.name_ko,
        name_en: category.name_en,
        color: category.color,
      };
    });

    // 6. 유산소 운동 데이터 가져오기
    const workoutQuery = supabase
      .from('workouts')
      .select(
        `
        id,
        user_id,
        category_id,
        timestamp,
        points,
        duration_minutes
      `
      )
      .in('user_id', participantIds)
      .in(
        'category_id',
        cardioCategories.map((c) => c.id)
      );

    // 기간 필터링
    if (startDate && endDate) {
      // 날짜 범위로 직접 필터링
      workoutQuery
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
      
      // filteredWeeks를 해당 날짜 범위로 재설정
      filteredWeeks = [{
        label: `custom`,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }];
    } else if (filteredWeeks.length === 1) {
      // 특정 주차만 필터링
      workoutQuery
        .gte('timestamp', filteredWeeks[0].startDate.toISOString())
        .lte('timestamp', filteredWeeks[0].endDate.toISOString());
    } else {
      // 챌린지 전체 기간
      workoutQuery
        .gte('timestamp', challenge.start_date)
        .lte('timestamp', challenge.end_date);
    }

    const { data: workouts, error: workoutsError } = await workoutQuery;

    if (workoutsError) {
// console.error('❌ Error fetching workouts:', workoutsError);
      return NextResponse.json(
        { error: 'Failed to fetch workouts' },
        { status: 500 }
      );
    }

    // 7. 주별, 카테고리별 데이터 처리
    const weeklyData = {};

    // 모든 주차와 카테고리를 포함하는 데이터 구조 초기화
    filteredWeeks.forEach((week) => {
      weeklyData[week.label] = {};
      cardioCategories.forEach((category) => {
        weeklyData[week.label][category.id] = {
          points: 0,
          count: 0,
          name_ko: category.name_ko,
          name_en: category.name_en,
          color: category.color,
        };
      });
    });

    // 운동 데이터 처리
    workouts.forEach((workout) => {
      // 해당 날짜가 속하는 주차 찾기
      const workoutDate = new Date(workout.timestamp);
      const week = filteredWeeks.find(
        (w) => workoutDate >= w.startDate && workoutDate <= w.endDate
      );

      if (
        week &&
        workout.category_id &&
        weeklyData[week.label][workout.category_id]
      ) {
        weeklyData[week.label][workout.category_id].points +=
          workout.points || 0;
        weeklyData[week.label][workout.category_id].count += 1;
      }
    });

    // 8. 결과 데이터 포맷 구성
    const result = {
      weeks: filteredWeeks.map((week) => ({
        label: week.label,
        startDate: week.startDate.toISOString().split('T')[0],
        endDate: week.endDate.toISOString().split('T')[0],
      })),
      categories: cardioCategories.map((cat) => ({
        id: cat.id,
        name_ko: cat.name_ko,
        name_en: cat.name_en,
        color: cat.color,
      })),
      data: [],
    };

    // 주별 데이터 처리
    Object.entries(weeklyData).forEach(([weekLabel, weekData]) => {
      // 해당 주의 총 포인트 계산
      let totalPoints = 0;
      Object.values(weekData).forEach((catData: any) => {
        totalPoints += catData.points;
      });

      // 카테고리별 비율 계산 및 결과 데이터에 추가
      const weekResult = {
        weekLabel,
        totalPoints,
        categories: [],
      };

      // 포인트 내림차순으로 카테고리 정렬
      const sortedCategories = Object.entries(weekData)
        .map(([catId, catData]: [string, any]) => ({
          categoryId: catId,
          ...catData,
          percentage:
            totalPoints > 0 ? (catData.points / totalPoints) * 100 : 0,
        }))
        .sort((a, b) => b.points - a.points);

      weekResult.categories = sortedCategories.map((cat) => ({
        categoryId: cat.categoryId,
        name_ko: cat.name_ko,
        name_en: cat.name_en,
        color: cat.color,
        points: cat.points,
        count: cat.count,
        percentage: parseFloat(cat.percentage.toFixed(1)),
      }));

      result.data.push(weekResult);
    });
    //console.log('Final result.data:', result.data);
    // 결과 반환
    return NextResponse.json(result);
  } catch (error) {
// console.error('Error in weekly categories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 주차 생성 함수
function generateWeekRanges(startDate: Date, endDate: Date) {
  const weeks = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);

    // 주의 끝은 현재 날짜 + 6일 또는 종료일 중 더 빠른 날짜
    let weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    if (weekEnd > endDate) {
      weekEnd = new Date(endDate);
    }

    // MM.DD-MM.DD 형식의 주 레이블 생성
    const startMonth = (weekStart.getMonth() + 1).toString().padStart(2, '0');
    const startDay = weekStart.getDate().toString().padStart(2, '0');
    const endMonth = (weekEnd.getMonth() + 1).toString().padStart(2, '0');
    const endDay = weekEnd.getDate().toString().padStart(2, '0');

    const weekLabel = `${startMonth}.${startDay}-${endMonth}.${endDay}`;

    weeks.push({
      label: weekLabel,
      startDate: new Date(weekStart),
      endDate: new Date(weekEnd),
    });

    // 다음 주의 시작일로 이동 (현재 주의 끝 + 1일)
    currentDate = new Date(weekEnd);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weeks;
}
