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
    const userId = url.searchParams.get('userId');

    if (!challengeId || !userId) {
      return NextResponse.json(
        { error: 'Challenge ID and User ID are required' },
        { status: 400 }
      );
    }

    // 1. 챌린지 정보 가져오기
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('start_date, end_date, title')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      return NextResponse.json(
        { error: 'Failed to fetch challenge' },
        { status: 500 }
      );
    }

    // 2. 사용자 정보 가져오기
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    // 3. 주차 범위 생성
    const weeks = generateWeekRanges(
      new Date(challenge.start_date),
      new Date(challenge.end_date)
    );

    // 4. 운동 타입 정보 가져오기
    const { data: workoutTypes, error: typesError } = await supabase
      .from('workout_types')
      .select('id, name');

    if (typesError) {
      return NextResponse.json(
        { error: 'Failed to fetch workout types' },
        { status: 500 }
      );
    }

    // 타입 ID를 이름에 매핑
    const typeIdToName: Record<string, string> = {};
    workoutTypes.forEach((type: any) => {
      typeIdToName[type.id] = type.name;
    });

    // 5. 운동 카테고리 조회
    const { data: categories, error: categoriesError } = await supabase
      .from('workout_categories')
      .select('id, type_id, name_ko');

    if (categoriesError) {
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // 카테고리 ID를 타입으로 매핑
    const categoryToType: Record<string, string> = {};
    const categoryIdToName: Record<string, string> = {};

    categories.forEach((category: any) => {
      const typeName = typeIdToName[category.type_id];
      if (typeName) {
        categoryToType[category.id] = typeName;
        categoryIdToName[category.id] = category.name_ko;
      }
    });

    // 6. 사용자의 운동 데이터 조회
    const { data: workoutsData, error: workoutsError } = await supabase
      .from('workouts')
      .select(
        `
        id,
        user_id,
        category_id,
        timestamp,
        points,
        duration_minutes,
        title
      `
      )
      .eq('user_id', userId)
      .gte('timestamp', challenge.start_date)
      .lte('timestamp', challenge.end_date);

    if (workoutsError) {
      return NextResponse.json(
        { error: 'Failed to fetch workouts' },
        { status: 500 }
      );
    }

    // 7. 주차별 데이터 계산
    const weeklyData = calculateWeeklyData(workoutsData, weeks, categoryToType);

    // 8. 유산소/근력 운동 분류
    const cardioWorkouts = workoutsData
      .filter((workout) => categoryToType[workout.category_id] === 'CARDIO')
      .map((workout) => ({
        ...workout,
        categoryName: categoryIdToName[workout.category_id] || '유산소 운동',
      }));

    const strengthWorkouts = workoutsData
      .filter((workout) => categoryToType[workout.category_id] === 'STRENGTH')
      .map((workout) => ({
        ...workout,
        categoryName: categoryIdToName[workout.category_id] || '근력 운동',
      }));

    // 9. 결과 반환
    return NextResponse.json({
      userId: user.id,
      userName: user.name,
      challengeTitle: challenge.title,
      weeklyData,
      cardioWorkouts,
      strengthWorkouts,
      totalWorkouts: workoutsData.length,
      totalCardio: cardioWorkouts.length,
      totalStrength: strengthWorkouts.length,
      totalPoints: workoutsData.reduce(
        (sum, workout) => sum + (workout.points || 0),
        0
      ),
    });
  } catch (error) {
    console.error('Error in user-detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 주차 범위 생성 함수 (기존 함수 재사용)
function generateWeekRanges(startDate: Date, endDate: Date) {
  const weeks = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    let weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    if (weekEnd > endDate) {
      weekEnd = new Date(endDate);
    }

    const startMonth = (weekStart.getMonth() + 1).toString().padStart(2, '0');
    const startDay = weekStart.getDate().toString().padStart(2, '0');
    const endMonth = (weekEnd.getMonth() + 1).toString().padStart(2, '0');
    const endDay = weekEnd.getDate().toString().padStart(2, '0');

    const weekLabel = `${startMonth}.${startDay}-${endMonth}.${endDay}`;
    const weekNumber = weeks.length + 1;

    weeks.push({
      weekNumber,
      label: weekLabel,
      dateRange: `${startMonth}/${startDay} - ${endMonth}/${endDay}`,
      startDate: new Date(weekStart),
      endDate: new Date(weekEnd),
    });

    // 다음 주로 이동
    currentDate = new Date(weekEnd);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weeks;
}

// 주차별 데이터 계산 함수
function calculateWeeklyData(workouts, weeks, categoryToType) {
  // 주차별 데이터 초기화
  const weeklyData = weeks.map((week) => ({
    weekNumber: week.weekNumber,
    label: week.label,
    dateRange: week.dateRange,
    completionRate: 0,
    sessions: 0,
    points: 0,
    cardioWorkouts: 0,
    strengthWorkouts: 0,
  }));

  // 각 운동을 해당 주차에 할당
  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.timestamp);

    // 해당 날짜가 속하는 주차 찾기
    const weekIndex = weeks.findIndex(
      (week) => workoutDate >= week.startDate && workoutDate <= week.endDate
    );

    if (weekIndex === -1) return;

    // 운동 타입에 따라 데이터 업데이트
    const workoutType = categoryToType[workout.category_id];

    if (workoutType === 'CARDIO') {
      weeklyData[weekIndex].cardioWorkouts++;
      weeklyData[weekIndex].points += workout.points || 0;

      // 유산소 달성률 계산 (예: 100점 만점)
      const targetPoints = 100; // 목표 포인트 (실제 값으로 대체 필요)
      weeklyData[weekIndex].completionRate = Math.min(
        100,
        Math.round((weeklyData[weekIndex].points / targetPoints) * 100)
      );
    } else if (workoutType === 'STRENGTH') {
      weeklyData[weekIndex].strengthWorkouts++;

      // 같은 날짜의 근력 운동은 1회로 카운트
      const dateStr = workoutDate.toISOString().split('T')[0];
      const uniqueDates = new Set();

      workouts
        .filter(
          (w) =>
            categoryToType[w.category_id] === 'STRENGTH' &&
            new Date(w.timestamp) >= weeks[weekIndex].startDate &&
            new Date(w.timestamp) <= weeks[weekIndex].endDate
        )
        .forEach((w) => {
          uniqueDates.add(new Date(w.timestamp).toISOString().split('T')[0]);
        });

      weeklyData[weekIndex].sessions = uniqueDates.size;
    }
  });

  return weeklyData;
}
