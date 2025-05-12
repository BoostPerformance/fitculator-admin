import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  WeeklyChartResponse,
  LeaderboardEntry,
  TodayCountResponse,
  ApiResponse,
} from './types'; // 타입 파일 경로에 맞게 수정

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
): Promise<NextResponse<WeeklyChartResponse>> {
  try {
    console.log(`Getting weekly chart data for challenge: ${challengeId}`);

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

    // 특정 사용자만 필터링 (선택적)
    if (userId && participantIds.includes(userId)) {
      participantIds.length = 0;
      participantIds.push(userId);
    }

    // 참가자가 없는 경우 빈 데이터 반환
    if (participantIds.length === 0) {
      return NextResponse.json({
        cardio: [],
        strength: [],
        users: [],
        weeks: [],
        challengePeriod: { startDate: null, endDate: null },
      });
    }

    // 2. 주간 기록 가져오기 (챌린지 참가자만)
    const { data: weeklyRecords, error: weeklyError } = await supabase
      .from('workout_weekly_records')
      .select('*')
      .in('user_id', participantIds)
      .order('start_date', { ascending: true });

    if (weeklyError) {
      console.error('Error fetching weekly records:', weeklyError);
      return NextResponse.json(
        { error: 'Failed to fetch weekly workout records' },
        { status: 500 }
      );
    }

    console.log(
      `Found ${weeklyRecords?.length || 0} weekly records for participants`
    );

    // 3. 사용자 정보 가져오기 (챌린지 참가자만)
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

    // 주차 계산 (고유한 start_date, end_date 페어링 추출)
    const uniqueWeeks: any = [];
    const weekMap = new Map();

    weeklyRecords.forEach((record) => {
      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);

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

    // 유산소 데이터 가공
    const cardioData = [];
    weeklyRecords.forEach((record) => {
      const user = users.find((u) => u.id === record.user_id);
      if (!user) return;

      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);

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
        dayLabel: getDayLabel(new Date(record.start_date)),
      });
    });

    // 근력 데이터 가공
    const strengthData = [];
    weeklyRecords.forEach((record) => {
      if (!record.strength_sessions_count) return;

      const user = users.find((u) => u.id === record.user_id);
      if (!user) return;

      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);

      const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
      const startDay = startDate.getDate().toString().padStart(2, '0');
      const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const endDay = endDate.getDate().toString().padStart(2, '0');

      const weekLabel = `${startMonth}.${startDay}-${endMonth}.${endDay}`;

      // 근력 세션 횟수만큼 데이터 추가 (각 세션을 개별 포인트로)
      for (let i = 0; i < record.strength_sessions_count; i++) {
        strengthData.push({
          userId: user.id,
          x: weekLabel,
          y: 1, // 1회로 표시
          user: user.name || user.username,
          date: record.start_date,
          dayLabel: getDayLabel(new Date(record.start_date)),
        });
      }
    });

    // 사용자별 근력 운동 횟수 계산
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

    // 챌린지 기간 가져오기
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

    const challengePeriod = {
      startDate: challenge.start_date,
      endDate: challenge.end_date,
    };

    return NextResponse.json({
      cardio: cardioData,
      strength: strengthData,
      users: usersWithCounts,
      weeks: uniqueWeeks,
      challengePeriod,
    });
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
): Promise<NextResponse<LeaderboardEntry[]>> {
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

    console.log(
      `Found ${
        participants?.length || 0
      } participants for challenge ${challengeId}`
    );

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
): Promise<NextResponse<TodayCountResponse>> {
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

// 기본 유저 워크아웃 데이터 조회 (챌린지 ID 고려)
async function getUserWorkoutData(
  userId: string,
  challengeId?: string | null
): Promise<NextResponse<ApiResponse>> {
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // 1. 사용자 정보 가져오기
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

    console.log('User data:', user);

    // 챌린지 참가 여부 확인 (챌린지 ID가 제공된 경우)
    if (challengeId) {
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
        // 챌린지 참가자가 아닌 경우 에러 반환 (선택적)
        // return NextResponse.json(
        //   { error: 'User is not a participant in this challenge' },
        //   { status: 403 }
        // );
      }
    }

    // 2. 사용자의 주간 운동 기록 조회
    const { data: weeklyRecords, error: weeklyError } = await supabase
      .from('workout_weekly_records')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true });

    if (weeklyError) {
      console.error('Error fetching weekly records:', weeklyError);
      return NextResponse.json(
        { error: 'Failed to fetch weekly workout records' },
        { status: 500 }
      );
    }

    console.log('Weekly records fetched:', weeklyRecords);

    // 3. 각 주차별 피드백 정보 조회
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

      // 코치 정보 조회 (피드백이 있고 코치 ID가 있는 경우)
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

      // 주차 번호 계산 (start_date 기준으로 몇 번째 주인지)
      const weekNumber = weeklyRecords.indexOf(record) + 1;

      weeklyRecordsWithFeedback.push({
        ...record,
        weekNumber,
        feedback: feedback || null,
        coach: coach || null,
      });
    }

    console.log('Weekly records with feedback:', weeklyRecordsWithFeedback);

    // 4. 개별 운동 기록 조회 (최근 5개)
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

    console.log('Recent workouts fetched:', recentWorkouts);

    // 5. 전체 통계 계산
    const totalCardioPoints = weeklyRecordsWithFeedback.reduce(
      (sum, record) => sum + (record.cardio_points_total || 0),
      0
    );

    const totalStrengthSessions = weeklyRecordsWithFeedback.reduce(
      (sum, record) => sum + (record.strength_sessions_count || 0),
      0
    );

    // 6. 결과 반환
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        displayName: user.username,
      },
      weeklyRecords: weeklyRecordsWithFeedback,
      recentWorkouts,
      stats: {
        totalWeeks: weeklyRecordsWithFeedback.length,
        totalCardioPoints,
        totalStrengthSessions,
      },
    });
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
