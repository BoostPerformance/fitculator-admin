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
      console.log('📅 Checking workouts for date:', today);

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
      console.log('📊 Total participants:', participantIds.length);

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
      console.log("📊 Today's workout stats:", {
        workoutUsers: uniqueUsers.size,
        totalParticipants: participantIds.length,
      });

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

  console.log('🔄 === Workouts API Request Start ===');
  try {
    console.log('🔍 Getting server session...');
    const session = (await getServerSession(authOptions)) as Session;
    console.log('📥 Session:', session?.user?.email || 'No session');

    if (!session?.user?.email) {
      console.log('❌ Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🔍 Executing workouts query...');

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

    console.log('\n📅 리더보드 조회 기간:');
    console.log('시작:', startStr);
    console.log('종료:', endStr);

    // challengeId가 없는 경우 코치 확인
    if (!challengeId) {
      console.log('🔍 No challengeId provided, checking if user is coach...');

      // 먼저 admin_users 테이블에서 코치인지 확인
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, admin_role')
        .eq('email', session.user.email)
        .single();

      if (!adminError && adminUser?.admin_role === 'coach') {
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
            console.log("📥 Using coach's challenge ID:", challengeId);
          }
        }
      }
    }

    console.log('📥 Challenge ID:', challengeId);

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

    if (type === 'leaderboard') {
      // Get workouts with user information for leaderboard
      let query = supabase
        .from('workouts')
        .select(
          `
          id,
          user_id,
          points,
          timestamp,
          users (
            name
          )
        `
        )
        .in('user_id', participantIds);

      // 기간에 따른 필터 추가
      console.log('📊 조회 기간:', startStr, '~', endStr);
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
      console.log('📊 조회된 운동 데이터 수:', workoutData?.length || 0);

      if (workoutError) {
        console.error('❌ Supabase query error at workoutData:', workoutError);
        return NextResponse.json(
          { error: 'Failed to fetch workout data' },
          { status: 500 }
        );
      }

      // 사용자별 포인트 합계 계산
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

      // 리더보드 데이터 형식으로 변환 및 정렬
      const leaderboardData = Object.entries(userPoints)
        .map(([userId, data]) => ({
          user_id: userId,
          user: {
            name: data.name,
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
