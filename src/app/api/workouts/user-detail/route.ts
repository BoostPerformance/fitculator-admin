import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ApiResponse,
  UserData,
  WeeklyWorkout,
  Feedback,
  DailyWorkout,
  WorkoutTypes,
  UserWorkoutTypes,
  WeeklyChartData,
} from '@/types/useWorkoutDataTypes';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const challengeId = url.searchParams.get('challengeId'); // 챌린지 ID 추가
    const type = url.searchParams.get('type') || 'user-data'; // 기본값 추가

    console.log(
      'Request received for type:',
      type,
      'user ID:',
      userId,
      'challenge ID:',
      challengeId
    );

    if (type === 'test-connection') {
      return NextResponse.json({ status: 'OK' });
    } else if (type === 'weekly-chart') {
      // 챌린지 ID 필수 확인
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required for weekly chart data' },
          { status: 400 }
        );
      }
      return await getWeeklyChartData(userId, challengeId);
    } else if (type === 'leaderboard') {
      // 챌린지 ID 필수 확인
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required for leaderboard data' },
          { status: 400 }
        );
      }
      return await getLeaderboardData(userId, challengeId);
    } else if (type === 'today-count') {
      // 챌린지 ID 필수 확인
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required for today count data' },
          { status: 400 }
        );
      }
      return await getTodayCountData(userId, challengeId);
    } else {
      // 기본 유저 데이터 요청
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }
      return await getUserWorkoutData(userId, challengeId);
    }
  } catch (error) {
    console.error('Error in workout API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 주간 차트 데이터 조회 (챌린지 ID로 필터링)
async function getWeeklyChartData(
  userId: string | null,
  challengeId: string
): Promise<NextResponse> {
  try {
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('start_date, end_date')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      console.error('Error getting challenge:', challengeError);
      return NextResponse.json(
        { error: 'Failed to fetch challenge' },
        { status: 500 }
      );
    }

    const challengeStart = new Date(challenge.start_date);
    const challengeEnd = new Date(challenge.end_date);

    const challengePeriod = {
      startDate: challenge.start_date,
      endDate: challenge.end_date,
    };

    const { data: participants } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    const participantIds = participants?.map((p) => p.service_user_id) || [];

    if (userId && participantIds.includes(userId)) {
      participantIds.length = 0;
      participantIds.push(userId);
    }

    if (participantIds.length === 0) {
      return NextResponse.json({
        cardio: [],
        strength: [],
        users: [],
        weeks: [],
        challengePeriod,
      });
    }

    const { data: weeklyRecords } = await supabase
      .from('workout_weekly_records')
      .select('*')
      .in('user_id', participantIds)
      .order('start_date', { ascending: true });

    const { data: users } = await supabase
      .from('users')
      .select('id, name, username')
      .in('id', participantIds);

    const uniqueWeeks: any = [];
    const weekMap = new Map();

    weeklyRecords.forEach((record) => {
      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);

      if (endDate < challengeStart || startDate > challengeEnd) return;

      const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
      const startDay = startDate.getDate().toString().padStart(2, '0');
      const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const endDay = endDate.getDate().toString().padStart(2, '0');
      const weekLabel = `${startMonth}.${startDay}-${endMonth}.${endDay}`;

      if (!weekMap.has(weekLabel)) {
        weekMap.set(weekLabel, true);
        uniqueWeeks.push({ label: weekLabel });
      }
    });

    const cardioData: any = [];
    const strengthData: any = [];

    weeklyRecords.forEach((record) => {
      const user = users.find((u) => u.id === record.user_id);
      if (!user) return;

      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);
      if (endDate < challengeStart || startDate > challengeEnd) return;

      const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
      const startDay = startDate.getDate().toString().padStart(2, '0');
      const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const endDay = endDate.getDate().toString().padStart(2, '0');
      const weekLabel = `${startMonth}.${startDay}-${endMonth}.${endDay}`;

      cardioData.push({
        userId: user.id,
        x: weekLabel,
        y: Math.round(record.cardio_points_total || 0),
        user: user.name || user.username,
        date: record.start_date,
        dayLabel: getDayLabel(startDate),
      });

      for (let i = 0; i < (record.strength_sessions_count || 0); i++) {
        strengthData.push({
          userId: user.id,
          x: weekLabel,
          y: 1,
          user: user.name || user.username,
          date: record.start_date,
          dayLabel: getDayLabel(startDate),
        });
      }
    });

    const usersWithCounts = users.map((user) => {
      const strengthWorkoutCount = weeklyRecords
        .filter((record) => record.user_id === user.id)
        .reduce(
          (sum, record) => sum + (record.strength_sessions_count || 0),
          0
        );

      return {
        id: user.id,
        name: user.name || user.username,
        strengthWorkoutCount,
      };
    });

    const forTypeCheck: UserWorkoutTypes = {
      cardio: cardioData,
      strength: strengthData,
      users: usersWithCounts,
      weeks: uniqueWeeks,
      challengePeriod,
    };

    console.log('🐸 challengeStart:', challengeStart.toISOString());
    console.log('🐸 challengeEnd:', challengeEnd.toISOString());
    console.log(
      '🐸 challengePeriod:',
      challengePeriod.startDate,
      challengePeriod.endDate
    );
    console.log(
      'Filtered uniqueWeeks:',
      uniqueWeeks.map((w) => w.label)
    );

    return NextResponse.json(forTypeCheck);
  } catch (error) {
    console.error('Error in weekly chart data:', error);
    return NextResponse.json(
      { error: 'Failed to process weekly chart data' },
      { status: 500 }
    );
  }
}

// 리더보드 데이터 조회 (챌린지 ID로 필터링)
async function getLeaderboardData(
  userId: string | null,
  challengeId: string
): Promise<NextResponse> {
  try {
    console.log(`Getting leaderboard data for challenge: ${challengeId}`);

    // 1. 챌린지 참가자 목록 조회
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    if (participantsError) {
      console.error(
        'Error fetching challenge participants:',
        participantsError
      );
      return NextResponse.json(
        { error: 'Failed to fetch challenge participants' },
        { status: 500 }
      );
    }

    // console.log(
    //   `Found ${
    //     participants?.length || 0
    //   } participants for challenge ${challengeId}`
    // );

    // 참가자 ID 목록 생성
    const participantIds = participants?.map((p) => p.service_user_id) || [];

    // 특정 사용자만 필터링 (선택적)
    if (userId && participantIds.includes(userId)) {
      participantIds.length = 0;
      participantIds.push(userId);
    }

    // 참가자가 없는 경우 빈 데이터 반환
    if (participantIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2. 사용자 정보 가져오기 (챌린지 참가자만)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, username')
      .in('id', participantIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // 3. 주간 운동 기록 조회 (챌린지 참가자만)
    const { data: weeklyRecords, error: weeklyError } = await supabase
      .from('workout_weekly_records')
      .select('*')
      .in('user_id', participantIds);

    if (weeklyError) {
      console.error('Error fetching weekly records:', weeklyError);
      return NextResponse.json(
        { error: 'Failed to fetch weekly workout records' },
        { status: 500 }
      );
    }

    // 사용자별 총 포인트 계산
    const leaderboardData = users.map((user) => {
      // 해당 사용자의 모든 주간 기록
      const userRecords = weeklyRecords.filter(
        (record) => record.user_id === user.id
      );

      // 총 포인트 계산 (유산소 포인트 + 근력 세션 * 20)
      const totalCardioPoints = userRecords.reduce(
        (sum, record) => sum + (record.cardio_points_total || 0),
        0
      );
      const totalStrengthSessions = userRecords.reduce(
        (sum, record) => sum + (record.strength_sessions_count || 0),
        0
      );
      const strengthPoints = totalStrengthSessions * 20; // 근력 세션당 20점으로 계산

      const totalPoints = Math.round(totalCardioPoints + strengthPoints);

      const strengthWorkoutCount = userRecords.reduce(
        (sum, record) => sum + (record.strength_sessions_count || 0),
        0
      );

      return {
        user_id: user.id,
        user: {
          name: user.name || user.username,
          strengthWorkoutCount,
        },
        points: totalPoints,
      };
    });

    // 포인트 내림차순 정렬
    leaderboardData.sort((a, b) => b.points - a.points);

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error('Error in leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to process leaderboard data' },
      { status: 500 }
    );
  }
}

// 오늘 카운트 데이터 조회 (챌린지 ID로 필터링)
async function getTodayCountData(
  userId: string | null,
  challengeId: string
): Promise<NextResponse> {
  try {
    console.log(`Getting today count data for challenge: ${challengeId}`);

    // 1. 챌린지 참가자 목록 조회
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    if (participantsError) {
      console.error(
        'Error fetching challenge participants:',
        participantsError
      );
      return NextResponse.json(
        { error: 'Failed to fetch challenge participants' },
        { status: 500 }
      );
    }

    console.log(
      `Found ${
        participants?.length || 0
      } participants for challenge ${challengeId}`
    );

    // 참가자 ID 목록 생성
    const participantIds = participants?.map((p) => p.service_user_id) || [];

    // 참가자가 없는 경우 빈 데이터 반환
    if (participantIds.length === 0) {
      return NextResponse.json({
        count: 0,
        total: 0,
      });
    }

    // 2. 오늘 운동 기록이 있는 사용자 수 카운트
    const today = new Date().toISOString().split('T')[0];

    const { data: todayWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('user_id')
      .in('user_id', participantIds)
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`);

    if (workoutsError) {
      console.error("Error fetching today's workouts:", workoutsError);
      return NextResponse.json(
        { error: "Failed to fetch today's workouts" },
        { status: 500 }
      );
    }

    // 중복 제거하여 오늘 운동한 유저 수 계산
    const uniqueUserIds = new Set(
      todayWorkouts.map((workout) => workout.user_id)
    );
    const todayActiveUsers = uniqueUserIds.size;

    return NextResponse.json({
      count: todayActiveUsers,
      total: participantIds.length,
    });
  } catch (error) {
    console.error('Error in today count data:', error);
    return NextResponse.json(
      { error: 'Failed to process today count data' },
      { status: 500 }
    );
  }
}

// UTC → KST 변환 함수
const convertToKoreanTime = (utcString: string): string => {
  const date = new Date(utcString);
  const offsetMs = 9 * 60 * 60 * 1000; // 9시간
  const koreanDate = new Date(date.getTime() + offsetMs);
  return koreanDate.toISOString();
};

export async function getUserWorkoutData(
  userId: string,
  challengeId?: string | null
): Promise<NextResponse> {
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, username')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    // 챌린지 정보 가져오기
    let challengeStartDate: string | null = null;
    let challengeEndDate: string | null = null;

    if (challengeId) {
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('start_date, end_date')
        .eq('id', challengeId)
        .single();

      if (challengeError) {
        console.error('Error fetching challenge:', challengeError);
      } else if (challenge) {
        challengeStartDate = challenge.start_date;
        challengeEndDate = challenge.end_date;
      }

      const { data: participation, error: participationError } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('service_user_id', userId)
        .eq('challenge_id', challengeId)
        .eq('status', 'active')
        .maybeSingle();

      if (participationError) {
        console.error(
          'Error checking challenge participation:',
          participationError
        );
      } else if (!participation) {
        console.warn(
          `User ${userId} is not an active participant in challenge ${challengeId}`
        );
      }
    }

    // 챌린지 기간으로 필터링된 weeklyRecords 가져오기
    let query = supabase
      .from('workout_weekly_records')
      .select('*')
      .eq('user_id', userId);

    if (challengeStartDate && challengeEndDate) {
      query = query
        .gte('start_date', challengeStartDate)
        .lte('end_date', challengeEndDate);
    }

    const { data: weeklyRecords, error: weeklyError } = await query.order(
      'start_date',
      { ascending: true }
    );

    if (weeklyError) {
      console.error('Error fetching weekly records:', weeklyError);
      return NextResponse.json(
        { error: 'Failed to fetch weekly workout records' },
        { status: 500 }
      );
    }

    const weeklyRecordsWithFeedback = [];

    for (const record of weeklyRecords) {
      const { data: feedback, error: feedbackError } = await supabase
        .from('workout_feedbacks')
        .select(
          'id, ai_feedback, coach_feedback, coach_memo, coach_id, created_at'
        )
        .eq('workout_weekly_records_id', record.id)
        .maybeSingle();

      if (feedbackError) {
        console.error(
          'Error fetching feedback for record:',
          record.id,
          feedbackError
        );
      }

      let coach = null;
      if (feedback && feedback.coach_id) {
        const { data: coachData, error: coachError } = await supabase
          .from('coaches')
          .select('id, name, profile_image_url')
          .eq('id', feedback.coach_id)
          .maybeSingle();

        if (!coachError) {
          coach = coachData;
        } else {
          console.error('Error fetching coach:', coachError);
        }
      }

      const weekNumber = weeklyRecords.indexOf(record) + 1;

      weeklyRecordsWithFeedback.push({
        ...record,
        weekNumber,
        feedback: feedback
          ? {
              ...feedback,
              created_at_kst: convertToKoreanTime(feedback.created_at),
            }
          : null,
        coach: coach || null,
      });
    }

    const { data: recentWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select(
        `
        id,
        user_id,
        category_id,
        title,
        timestamp,
        duration_minutes,
        avg_heart_rate,
        max_heart_rate,
        points,
        calories,
        progress,
        workout_categories(id, name_ko, name_en, type_id, workout_types(id, name))
      `
      )
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (workoutsError) {
      console.error('Error fetching recent workouts:', workoutsError);
      return NextResponse.json(
        { error: 'Failed to fetch recent workouts' },
        { status: 500 }
      );
    }

    const recentWorkoutsWithKST = recentWorkouts.map((w) => ({
      ...w,
      timestamp_kst: convertToKoreanTime(w.timestamp),
    }));

    const totalCardioPoints = weeklyRecordsWithFeedback.reduce(
      (sum, record) => sum + (record.cardio_points_total || 0),
      0
    );

    const totalStrengthSessions = weeklyRecordsWithFeedback.reduce(
      (sum, record) => sum + (record.strength_sessions_count || 0),
      0
    );
    const final = {
      user: {
        id: user.id,
        name: user.name,
        displayName: user.username,
      },
      weeklyRecords: weeklyRecordsWithFeedback,
      recentWorkouts: recentWorkoutsWithKST,
      stats: {
        totalWeeks: weeklyRecordsWithFeedback.length,
        totalCardioPoints,
        totalStrengthSessions,
      },
    };
    return NextResponse.json(final);
  } catch (error) {
    console.error('Error fetching user workout data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user workout data' },
      { status: 500 }
    );
  }
}

// 요일 라벨 반환 함수
function getDayLabel(date: Date): string {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return dayNames[date.getDay()];
}
