import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'leaderboard';

  // 주별 유산소/근력 운동 데이터를 가져오는 타입 추가
  if (type === 'weekly-chart') {
    try {
      const challengeId = url.searchParams.get('challengeId');
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required' },
          { status: 400 }
        );
      }

      // console.log('🔍 Getting weekly workout data for challenge:', challengeId);

      // 1. 챌린지 참가자 목록 조회
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('service_user_id')
        .eq('challenge_id', challengeId);

      if (participantsError) {
        console.error('❌ Error fetching participants:', participantsError);
        return NextResponse.json(
          { error: 'Failed to fetch participants' },
          { status: 500 }
        );
      }

      const participantIds = participants?.map((p) => p.service_user_id) || [];
      if (participantIds.length === 0) {
        // console.log('⚠️ No participants found for this challenge');
        // 참가자가 없는 경우 빈 데이터 반환
        return NextResponse.json({
          cardio: [],
          strength: [],
          users: [],
        });
      }

      // 2. 챌린지 기간 가져오기
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('start_date, end_date')
        .eq('id', challengeId)
        .single();

      if (challengeError) {
        console.error('❌ Error getting challenge:', challengeError);
        return NextResponse.json(
          { error: 'Failed to fetch challenge' },
          { status: 500 }
        );
      }

      // console.log('📅 Challenge period:', {
      //   start_date: challenge.start_date,
      //   end_date: challenge.end_date,
      // });

      // 3. 주별 데이터 구성을 위한 날짜 계산
      const weeks = generateWeekRanges(
        new Date(challenge.start_date),
        new Date(challenge.end_date)
      );

      // console.log(
      //   `📊 Generated ${weeks.length} weeks for the challenge period`
      // );

      // 4. 사용자 정보 조회
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', participantIds);

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      // 5. 운동 타입 정보 가져오기
      const { data: workoutTypes, error: typesError } = await supabase
        .from('workout_types')
        .select('id, name');

      if (typesError) {
        console.error('❌ Error getting workout types:', typesError);
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

      // 6. 운동 카테고리 조회
      const { data: categories, error: categoriesError } = await supabase
        .from('workout_categories')
        .select('id, type_id');

      if (categoriesError) {
        console.error('❌ Error fetching categories:', categoriesError);
        return NextResponse.json(
          { error: 'Failed to fetch categories' },
          { status: 500 }
        );
      }

      // 카테고리 ID를 타입으로 매핑
      const categoryToType: Record<string, string> = {};
      categories.forEach((category: any) => {
        const typeName = typeIdToName[category.type_id];
        if (typeName) {
          categoryToType[category.id] = typeName;
        }
      });

      // 7. 운동 데이터 조회
      const { data: workoutsData, error: workoutsError } = await supabase
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
        .gte('timestamp', challenge.start_date)
        .lte('timestamp', challenge.end_date);

      if (workoutsError) {
        console.error('❌ Error fetching workouts:', workoutsError);
        return NextResponse.json(
          { error: 'Failed to fetch workouts' },
          { status: 500 }
        );
      }

      // console.log(`📊 Total workouts found: ${workoutsData?.length || 0}`);

      // 8. 데이터 가공
      const result = processWeeklyWorkoutData(
        workoutsData,
        weeks,
        categoryToType,
        users
      );

      return NextResponse.json({
        ...result,
        challengePeriod: {
          startDate: challenge.start_date,
          endDate: challenge.end_date,
        },
        weeks: weeks.map((week) => ({
          label: week.label,
        })),
      });
    } catch (error) {
      console.error('Error in weekly-chart:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  // 오늘 운동한 멤버 수를 가져오는 새로운 타입 추가
  if (type === 'today-count') {
    try {
      const challengeId = url.searchParams.get('challengeId');
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required' },
          { status: 400 }
        );
      }

      const now = new Date();
      const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      )
        .toISOString()
        .split('T')[0];
      // console.log('📅 Checking workouts for date:', today);

      // 챌린지 참가자 목록 조회
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('service_user_id')
        .eq('challenge_id', challengeId);

      if (participantsError) {
        console.error('❌ Error fetching participants:', participantsError);
        return NextResponse.json(
          { error: 'Failed to fetch participants' },
          { status: 500 }
        );
      }

      const participantIds = participants?.map((p) => p.service_user_id) || [];
      // console.log('📊 Total participants:', participantIds.length);

      // 오늘 운동한 유저 조회
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('user_id')
        .in('user_id', participantIds)
        .gte('timestamp', today)
        .lt(
          'timestamp',
          new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate() + 1
            )
          )
            .toISOString()
            .split('T')[0]
        );

      if (workoutsError) {
        console.error('❌ Error fetching workouts:', workoutsError);
        return NextResponse.json(
          { error: 'Failed to fetch workouts' },
          { status: 500 }
        );
      }

      // 중복 제거하여 실제 운동한 유저 수 계산
      const uniqueUsers = new Set(workouts?.map((w) => w.user_id) || []);
      // console.log("📊 Today's workout stats:", {
      //   workoutUsers: uniqueUsers.size,
      //   totalParticipants: participantIds.length,
      // });

      return NextResponse.json({
        count: uniqueUsers.size,
        total: participantIds.length,
      });
    } catch (error) {
      console.error('Error in today-count:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // console.log('🔄 === Workouts API Request Start ===');
  try {
    // console.log('🔍 Getting server session...');
    const session = (await getServerSession(authOptions)) as Session;
    // console.log('📥 Session:', session?.user?.email || 'No session');

    if (!session?.user?.email) {
      console.log('❌ Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // console.log('🔍 Executing workouts query...');

    // Get challengeId and period from query params
    const url = new URL(request.url);
    let challengeId = url.searchParams.get('challengeId');
    const period = url.searchParams.get('period') || 'weekly';

    // Get challenge dates
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('start_date, end_date')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      console.error('❌ Error getting challenge:', challengeError);
      return NextResponse.json(
        { error: 'Failed to fetch challenge' },
        { status: 500 }
      );
    }

    let startStr: string, endStr: string;

    if (period === 'weekly') {
      // 이번 주 월요일과 일요일 계산 (UTC 기준)
      const now = new Date();
      const day = now.getUTCDay();
      const date = now.getUTCDate();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');

      // 이번 주 월요일 날짜 계산
      const mondayDate = date - (day === 0 ? 6 : day - 1);
      const mondayMonth =
        mondayDate < 1 ? String(now.getUTCMonth()).padStart(2, '0') : month;
      startStr = `${year}-${mondayMonth}-${String(
        Math.abs(mondayDate)
      ).padStart(2, '0')}`;

      // 이번 주 일요일 날짜 계산
      const sundayDate = date + (day === 0 ? 0 : 7 - day);
      const sundayMonth =
        sundayDate > 31
          ? String(now.getUTCMonth() + 2).padStart(2, '0')
          : month;
      endStr = `${year}-${sundayMonth}-${String(sundayDate).padStart(2, '0')}`;
    } else {
      // 챌린지 전체 기간
      startStr = challenge.start_date;
      endStr = challenge.end_date;
    }

    // console.log('\n📅 리더보드 조회 기간:');
    // console.log('시작:', startStr);
    // console.log('종료:', endStr);

    // challengeId가 없는 경우 코치 확인
    if (!challengeId) {
      console.log('🔍 No challengeId provided, checking if user is coach...');

      // 먼저 admin_users 테이블에서 코치인지 확인
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, admin_role')
        .eq('email', session.user.email)
        .single();

      if (
        !adminError &&
        (adminUser?.admin_role === 'coach' ||
          adminUser?.admin_role === 'internal_operator')
      ) {
        // 코치인 경우 담당 챌린지 확인
        const { data: coachData, error: coachError } = await supabase
          .from('coaches')
          .select('challenge_coaches!inner(challenge_id)')
          .eq('admin_user_id', adminUser.id)
          .single();

        if (!coachError && coachData?.challenge_coaches) {
          // 담당 챌린지가 하나인 경우
          if (coachData.challenge_coaches.length === 1) {
            challengeId = coachData.challenge_coaches[0].challenge_id;
            // console.log("📥 Using coach's challenge ID:", challengeId);
          }
        }
      }
    }

    // console.log('📥 Challenge ID:', challengeId);

    if (!challengeId) {
      console.log('❌ Challenge ID is missing');
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // First get challenge participants
    console.log('🔍 Getting challenge participants...');
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId);

    if (participantsError) {
      console.error('❌ Error getting participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    // console.log('📥 Participants count:', participants?.length || 0);

    // If no participants, return empty array
    if (!participants || participants.length === 0) {
      console.log('ℹ️ No participants found');
      return NextResponse.json([]);
    }

    const participantIds = participants.map((p) => p.service_user_id);
    // console.log('🔍 Fetching workouts for participants:', participantIds);

    // Get workout types first to get CARDIO type ID
    const { data: workoutTypes, error: typesError } = await supabase
      .from('workout_types')
      .select('id')
      .eq('name', 'CARDIO')
      .single();

    if (typesError) {
      console.error('❌ Error getting workout types:', typesError);
      return NextResponse.json(
        { error: 'Failed to fetch workout types' },
        { status: 500 }
      );
    }

    const cardioTypeId = workoutTypes.id;

    const type = url.searchParams.get('type') || 'leaderboard';

    // In the workouts route.ts file, modify the leaderboard section:

    if (type === 'leaderboard') {
      // Get cardio type ID first
      const { data: cardioType, error: cardioTypeError } = await supabase
        .from('workout_types')
        .select('id')
        .eq('name', 'CARDIO')
        .single();

      if (cardioTypeError) {
        console.error('❌ Error getting CARDIO type:', cardioTypeError);
        return NextResponse.json(
          { error: 'Failed to fetch workout types' },
          { status: 500 }
        );
      }

      // Get all cardio categories
      const { data: cardioCategories, error: cardioError } = await supabase
        .from('workout_categories')
        .select('id')
        .eq('type_id', cardioType.id);

      if (cardioError) {
        console.error('❌ Error fetching cardio categories:', cardioError);
        return NextResponse.json(
          { error: 'Failed to fetch categories' },
          { status: 500 }
        );
      }

      const cardioCategoryIds = cardioCategories.map((cat) => cat.id);

      // Get workouts with user information for leaderboard, filtering by cardio category IDs
      let query = supabase
        .from('workouts')
        .select(
          `
          id,
          user_id,
          points,
          title,
          timestamp,
          users (
            name
          )
        `
        )
        .in('user_id', participantIds)
        .in('category_id', cardioCategoryIds); // Only cardio workouts

      // Get strength workout counts for the same period (needed for display)
      const { data: strengthType, error: strengthTypeError } = await supabase
        .from('workout_types')
        .select('id')
        .eq('name', 'STRENGTH')
        .single();

      if (strengthTypeError) {
        console.error('❌ Error getting STRENGTH type:', strengthTypeError);
        return NextResponse.json(
          { error: 'Failed to fetch workout types' },
          { status: 500 }
        );
      }

      const { data: strengthCategories, error: categoriesError } =
        await supabase
          .from('workout_categories')
          .select('id')
          .eq('type_id', strengthType.id);

      if (categoriesError) {
        console.error(
          '❌ Error fetching strength categories:',
          categoriesError
        );
        return NextResponse.json(
          { error: 'Failed to fetch categories' },
          { status: 500 }
        );
      }

      const strengthCategoryIds = strengthCategories.map((cat) => cat.id);

      const { data: strengthWorkouts, error: strengthWorkoutsError } =
        await supabase
          .from('workouts')
          .select('user_id, timestamp')
          .in('category_id', strengthCategoryIds)
          .in('user_id', participantIds)
          .gte('timestamp', challenge.start_date)
          .lte('timestamp', challenge.end_date);

      if (strengthWorkoutsError) {
        console.error(
          '❌ Error fetching strength workouts:',
          strengthWorkoutsError
        );
        return NextResponse.json(
          { error: 'Failed to fetch strength workouts' },
          { status: 500 }
        );
      }

      // 기간에 따른 필터 추가
      query = query
        .gte('timestamp', startStr)
        .lt(
          'timestamp',
          new Date(
            Date.UTC(
              parseInt(endStr.split('-')[0]),
              parseInt(endStr.split('-')[1]) - 1,
              parseInt(endStr.split('-')[2]) + 1
            )
          )
            .toISOString()
            .split('T')[0]
        );

      const { data: workoutData, error: workoutError } = await query;

      if (workoutError) {
        console.error('❌ Supabase query error at workoutData:', workoutError);
        return NextResponse.json(
          { error: 'Failed to fetch workout data' },
          { status: 500 }
        );
      }

      // 사용자별 유산소 포인트 합계 계산
      const userPoints: { [key: string]: { points: number; name: string } } =
        {};
      workoutData?.forEach((workout: any) => {
        const userId = workout.user_id;
        if (!userPoints[userId]) {
          userPoints[userId] = {
            points: 0,
            name: workout.users?.name || '알 수 없음',
          };
        }
        userPoints[userId].points += workout.points || 0;
      });

      // Calculate strength workout counts per user
      const userStrengthCounts: { [key: string]: number } = {};
      const userStrengthSessions = new Map();

      strengthWorkouts.forEach((workout) => {
        const userId = workout.user_id;
        const workoutDate = new Date(workout.timestamp)
          .toISOString()
          .split('T')[0];
        const sessionKey = `${userId}_${workoutDate}`;

        if (!userStrengthSessions.has(sessionKey)) {
          userStrengthSessions.set(sessionKey, true);
          userStrengthCounts[userId] = (userStrengthCounts[userId] || 0) + 1;
        }
      });

      // 리더보드 데이터에 포함할 정보: 유산소 포인트 + 근력운동 횟수
      const leaderboardData = Object.entries(userPoints)
        .map(([userId, data]) => ({
          user_id: userId,
          user: {
            name: data.name,
            strengthWorkoutCount: userStrengthCounts[userId] || 0,
          },
          points: data.points,
        }))
        .sort((a, b) => b.points - a.points);

      return NextResponse.json(leaderboardData);
    } else {
      // Get workouts with categories for chart
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select(
          `
          points,
          workout_categories:workout_categories!inner (
            id,
            name_ko,
            name_en,
            type_id
          )
        `
        )
        .in('user_id', participantIds)
        .eq('workout_categories.type_id', cardioTypeId);

      //console.log(workoutData);

      if (workoutError) {
        console.error(
          '❌ Supabase query error at workouts table:',
          workoutError
        );
        return NextResponse.json(
          { error: 'Failed to fetch workout data' },
          { status: 500 }
        );
      }

      // Group workouts by category and sum points
      const categoryPoints: { [key: string]: number } = {};
      let totalPoints = 0;

      workoutData?.forEach((workout: any) => {
        if (!workout?.workout_categories?.name_ko) return;

        const categoryName = workout.workout_categories.name_ko;
        const points = workout.points || 0;

        categoryPoints[categoryName] =
          (categoryPoints[categoryName] || 0) + points;
        totalPoints += points;
      });

      // Convert to percentage and format for chart
      const chartData = Object.entries(categoryPoints)
        .map(([category, points]) => ({
          category,
          percentage: (points / totalPoints) * 100,
        }))
        .sort((a, b) => b.percentage - a.percentage);

      // 데이터가 없는 경우 기본 데이터 반환
      if (chartData.length === 0) {
        return NextResponse.json([
          { category: '데이터 없음', percentage: 100 },
        ]);
      }

      return NextResponse.json(chartData);
    }
  } catch (error) {
    console.error('❌ === Workouts API Error ===');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

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

// 데이터 가공 함수
// 백엔드에서 수정해야 할 데이터 가공 함수
function processWeeklyWorkoutData(
  workouts: any[],
  weeks: any[],
  categoryToType: Record<string, string>,
  users: any[]
) {
  // 결과 데이터 구조 초기화
  const result = {
    cardio: [] as any[],
    strength: [] as any[],
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      strengthWorkoutCount: 0,
    })),
  };

  const userStrengthSessions = new Map();

  // 날짜 포맷 변환 헬퍼 함수
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 요일 레이블 정의
  const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

  // 각 운동 데이터를 개별적으로 처리하여 정확한 날짜/요일 정보 추가
  workouts.forEach((workout) => {
    // 운동 타입 확인
    const workoutType = categoryToType[workout.category_id];
    if (!workoutType) return; // 타입 정보가 없으면 건너뛰기

    // 해당 유저 찾기
    const user = users.find((u) => u.id === workout.user_id);
    if (!user) return; // 유저 정보가 없으면 건너뛰기

    // 운동 날짜 정보 추출
    const workoutDate = new Date(workout.timestamp);
    const workoutDay = workoutDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일

    // 해당 날짜가 속하는 주차 찾기
    const week = weeks.find(
      (w) => workoutDate >= w.startDate && workoutDate <= w.endDate
    );

    if (!week) return; // 주차에 속하지 않으면 건너뛰기

    // 주차 레이블 (예: "02.10-02.16")
    const weekLabel = week.label;

    // 날짜 정보 포맷팅
    const formattedDate = formatDate(workoutDate);

    // 운동 타입에 따라 분류하여 저장
    if (workoutType === 'CARDIO') {
      result.cardio.push({
        x: weekLabel,
        y: workout.points || 0,
        user: user.name,
        userId: user.id,
        day: workoutDay,
        dayLabel: DAY_LABELS[workoutDay],
        date: formattedDate,
        timestamp: workout.timestamp,
      });
    } else if (workoutType === 'STRENGTH') {
      const sessionKey = `${user.id}_${formattedDate}`;
      if (!userStrengthSessions.has(sessionKey)) {
        userStrengthSessions.set(sessionKey, true);

        // 해당 유저의 근력운동 카운트 증가
        const userIndex = result.users.findIndex((u) => u.id === user.id);
        if (userIndex !== -1) {
          result.users[userIndex].strengthWorkoutCount += 1;
        }
      }

      result.strength.push({
        x: weekLabel,
        y: 1, // 근력 운동은 수행 여부만 기록 (1로 표준화)
        user: user.name,
        userId: user.id,
        day: workoutDay,
        dayLabel: DAY_LABELS[workoutDay],
        date: formattedDate,
        timestamp: workout.timestamp,
      });
    }
  });

  // 근력 운동 중복 제거 (같은 날짜+사용자는 한 번만 카운트)
  const uniqueStrengthEntries = new Map();
  result.strength.forEach((item) => {
    const key = `${item.userId}_${item.date}`;
    uniqueStrengthEntries.set(key, item);
  });

  // 각 사용자별로 주간 근력 운동 횟수를 최대 2회로 제한
  const userWeekStrength = new Map();
  Array.from(uniqueStrengthEntries.values()).forEach((item) => {
    const key = `${item.userId}_${item.x}`;
    if (!userWeekStrength.has(key)) {
      userWeekStrength.set(key, [item]);
    } else {
      const items = userWeekStrength.get(key);
      if (items.length < 2) {
        items.push(item);
      }
    }
  });

  // 최종 근력 운동 데이터 생성
  const finalStrength: string[] = [];
  userWeekStrength.forEach((items) => {
    items.forEach((item: any) => {
      finalStrength.push(item);
    });
  });

  return {
    cardio: result.cardio,
    strength: finalStrength,
    users: result.users,
  };
}
