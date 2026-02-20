import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserWorkoutTypes } from '@/types/useWorkoutDataTypes';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface WorkoutWeeklyRecord {
  id: string; // uuid
  user_id: string; // uuid
  start_date: string; // date (ISO string)
  end_date: string; // date (ISO string)
  cardio_points_total: number; // numeric
  strength_sessions_count: number; // int4
  created_at: string; // timestamptz (ISO string)
  updated_at: string;
}

// 관리자 시스템은 항상 최신 데이터 제공 (클라이언트에서 캐싱)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userIds = url.searchParams.get('userIds'); // 여러 사용자 ID 지원
    const challengeId = url.searchParams.get('challengeId'); // 챌린지 ID 추가
    const type = url.searchParams.get('type') || 'user-data'; // 기본값 추가

    // console.log(
    //   'Request received for type:',
    //   type,
    //   'user ID:',
    //   userId,
    //   'challenge ID:',
    //   challengeId
    // );

    if (type === 'test-connection') {
      return NextResponse.json({ status: 'OK' });
    } else if (type === 'batch-user-data' && userIds) {
      // 배치 처리를 위한 새 엔드포인트
      const userIdArray = userIds.split(',');
      return await getBatchUserWorkoutData(userIdArray, challengeId);
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
    } else if (type === 'distance-leaderboard') {
      // 거리 리더보드 - 챌린지 ID 필수 확인
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required for distance leaderboard data' },
          { status: 400 }
        );
      }
      const period = url.searchParams.get('period') || 'all';
      const weekStart = url.searchParams.get('weekStart') || undefined;
      const weekEnd = url.searchParams.get('weekEnd') || undefined;
      return await getDistanceLeaderboardData(challengeId, period, weekStart, weekEnd);
    } else if (type === 'recent-notes') {
      // 최근 운동 노트 - 챌린지 ID 필수 확인
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required for recent notes data' },
          { status: 400 }
        );
      }
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const startDate = url.searchParams.get('startDate') || undefined;
      const endDate = url.searchParams.get('endDate') || undefined;
      return await getRecentNotesData(challengeId, limit, offset, startDate, endDate);
    } else if (type === 'participant-list') {
      // 참가자 목록만 가져오기 (가벼운 API)
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required for participant list' },
          { status: 400 }
        );
      }
      return await getParticipantList(challengeId);
    } else if (type === 'paginated-user-data') {
      // 서버 사이드 페이지네이션된 유저 데이터
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required for paginated user data' },
          { status: 400 }
        );
      }
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '30');
      return await getPaginatedUserData(challengeId, page, limit);
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
// console.error('Error in workout API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 주간 차트 데이터 조회 (workout_weekly_records 테이블 기반)
async function getWeeklyChartData(
  userId: string | null,
  challengeId: string
): Promise<NextResponse> {
  try {
    // 1. 챌린지 정보 가져오기
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('start_date, end_date')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
// console.error('Error getting challenge:', challengeError);
      return NextResponse.json(
        { error: 'Failed to fetch challenge' },
        { status: 500 }
      );
    }

    // 로컬 시간으로 파싱 (타임존 영향 제거)
    const [startYear, startMonth, startDayNum] = challenge.start_date.split('-').map(Number);
    const [endYear, endMonth, endDayNum] = challenge.end_date.split('-').map(Number);
    const challengeStart = new Date(startYear, startMonth - 1, startDayNum);
    const challengeEnd = new Date(endYear, endMonth - 1, endDayNum);

    // 2. 챌린지 참가자 목록 조회
    const { data: participants } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    const participantIds = participants?.map((p) => p.service_user_id) || [];

    if (participantIds.length === 0) {
      return NextResponse.json({
        weeks: [],
        cardioData: [],
        strengthData: [],
        users: [],
        challengePeriod: {
          startDate: challenge.start_date,
          endDate: challenge.end_date,
        },
      });
    }

    // 3. W1 주차 계산 - 챌린지 시작일이 포함된 주의 월요일부터
    const startDay = challengeStart.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    let w1StartDate = new Date(challengeStart);
    
    // 챌린지 시작일이 월요일(1)이 아니면 해당 주의 월요일로 이동
    if (startDay !== 1) {
      const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
      w1StartDate.setDate(w1StartDate.getDate() - daysSinceMonday);
    }

    // 4. 주간 운동 기록 조회 (W1부터 챌린지 종료일까지)
    // 7.28-8.3 레코드를 포함하도록 end_date 기준으로 쿼리
    const { data: weeklyRecords } = await supabase
      .from('workout_weekly_records')
      .select('*')
      .in('user_id', participantIds)
      .gte('end_date', w1StartDate.toISOString().split('T')[0])
      .lte('end_date', challenge.end_date)
      .order('start_date', { ascending: true });

    // 5. 사용자 정보 조회
    const { data: users } = await supabase
      .from('users')
      .select('id, name, username')
      .in('id', participantIds);

    // 6. 먼저 전체 주차 구조를 생성 (W1부터 시작)
    const allWeeks: any[] = [];
    let currentWeekStart = new Date(w1StartDate);
    let weekNumber = 1;


    while (currentWeekStart <= challengeEnd) {
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6); // 일요일까지
      
      // 챌린지 종료일을 넘지 않도록 조정
      const actualEnd = currentWeekEnd > challengeEnd ? challengeEnd : currentWeekEnd;
      
      const startDateStr = currentWeekStart.toISOString().split('T')[0];
      const endDateStr = actualEnd.toISOString().split('T')[0];
      
      // 레이블 생성
      const [startYear, startMonth, startDayStr] = startDateStr.split('-');
      const [endYear, endMonth, endDayStr] = endDateStr.split('-');
      const weekLabel = `${parseInt(startMonth)}.${parseInt(startDayStr)}-${parseInt(endMonth)}.${parseInt(endDayStr)}`;
      
      
      allWeeks.push({
        weekNumber: `W${weekNumber}`,
        weekLabel,
        startDate: startDateStr,
        endDate: endDateStr
      });
      
      weekNumber++;
      // 다음 주 월요일로 이동
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    // 7. 주차별 데이터 구성
    const weekMap = new Map();
    allWeeks.forEach(week => {
      weekMap.set(week.weekNumber, week);
    });

    const cardioData: any = [];
    const strengthData: any = [];

    weeklyRecords?.forEach((record) => {
      // 로컬 시간으로 파싱
      const [recYear, recMonth, recDay] = record.start_date.split('-').map(Number);
      const recordStartDate = new Date(recYear, recMonth - 1, recDay);
      
      // 레코드가 속한 주차 찾기
      const matchedWeek = allWeeks.find(week => {
        const [weekStartYear, weekStartMonth, weekStartDay] = week.startDate.split('-').map(Number);
        const [weekEndYear, weekEndMonth, weekEndDay] = week.endDate.split('-').map(Number);
        const weekStart = new Date(weekStartYear, weekStartMonth - 1, weekStartDay);
        const weekEnd = new Date(weekEndYear, weekEndMonth - 1, weekEndDay);
        weekEnd.setHours(23, 59, 59); // 일요일 끝까지
        return recordStartDate >= weekStart && recordStartDate <= weekEnd;
      });


      if (!matchedWeek) return; // 매칭되는 주차가 없으면 스킵

      const user = users?.find((u) => u.id === record.user_id);
      if (!user) return;

      // 유산소 운동 데이터
      cardioData.push({
        weekNumber: matchedWeek.weekNumber,
        weekLabel: matchedWeek.weekLabel,
        userId: user.id,
        user: user.name || user.username,
        points: Math.round(record.cardio_points_total || 0),
        startDate: matchedWeek.startDate,
        endDate: matchedWeek.endDate
      });

      // 근력 운동 데이터
      strengthData.push({
        weekNumber: matchedWeek.weekNumber,
        weekLabel: matchedWeek.weekLabel,
        userId: user.id,
        user: user.name || user.username,
        sessions: record.strength_sessions_count || 0,
        startDate: matchedWeek.startDate,
        endDate: matchedWeek.endDate
      });
    });

    // 주차 순서대로 정렬 (이미 순서대로 생성되었지만 명시적으로)
    const sortedWeeks = allWeeks;

    const usersWithCounts = users?.map((user) => {
      const totalStrengthSessions = weeklyRecords
        ?.filter((record) => record.user_id === user.id)
        .reduce((sum, record) => sum + (record.strength_sessions_count || 0), 0) || 0;

      const totalCardioPoints = weeklyRecords
        ?.filter((record) => record.user_id === user.id)
        .reduce((sum, record) => sum + (record.cardio_points_total || 0), 0) || 0;

      return {
        id: user.id,
        name: user.name || user.username,
        username: user.username,
        totalStrengthSessions,
        totalCardioPoints: Math.round(totalCardioPoints),
      };
    }) || [];

    return NextResponse.json({
      weeks: sortedWeeks,
      cardioData,
      strengthData,
      users: usersWithCounts,
      challengePeriod: {
        startDate: challenge.start_date,
        endDate: challenge.end_date,
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
// console.error('Error in weekly chart data:', error);
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

    // 1. 챌린지 참가자 목록 조회
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    if (participantsError) {
// console.error(
      //   'Error fetching challenge participants:',
      //   participantsError
      // );
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
// console.error('Error fetching users:', usersError);
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
// console.error('Error fetching weekly records:', weeklyError);
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

    return NextResponse.json(leaderboardData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
// console.error('Error in leaderboard data:', error);
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

    // 1. 챌린지 참가자 목록 조회
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    if (participantsError) {
// console.error(
      //   'Error fetching challenge participants:',
      //   participantsError
      // );
      return NextResponse.json(
        { error: 'Failed to fetch challenge participants' },
        { status: 500 }
      );
    }


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
// console.error("Error fetching today's workouts:", workoutsError);
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
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
// console.error('Error in today count data:', error);
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

// 누락된 주간 레코드 자동 생성 함수
async function ensureWeeklyRecords(
  userId: string,
  challengeId: string,
  startDate: Date,
  endDate: Date,
  existingRecords: any[]
): Promise<void> {
  const missingWeeks: Array<{ start_date: string; end_date: string }> = [];
  
  // 챌린지 기간 내 모든 주차 생성
  let currentWeekStart = new Date(startDate);
  
  while (currentWeekStart <= endDate) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startDateStr = currentWeekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];
    
    // 기존 레코드에 이 주차가 있는지 확인
    const exists = existingRecords.some(record => 
      record.start_date === startDateStr && record.end_date === endDateStr
    );
    
    if (!exists) {
      missingWeeks.push({ start_date: startDateStr, end_date: endDateStr });
    }
    
    // 다음 주로 이동
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  // 누락된 주차 레코드들을 일괄 생성
  if (missingWeeks.length > 0) {
    const recordsToInsert = missingWeeks.map(week => ({
      user_id: userId,
      start_date: week.start_date,
      end_date: week.end_date,
      cardio_points_total: 0,
      strength_sessions_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('workout_weekly_records')
      .insert(recordsToInsert);
      
    if (error) {
      console.error('Error creating missing weekly records:', error);
    } else {
      console.log(`Created ${missingWeeks.length} missing weekly records for user ${userId}`);
    }
  }
}

async function getUserWorkoutData(
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
// console.error('Error fetching user:', userError);
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
// console.error('Error fetching challenge:', challengeError);
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
// console.error(
        //   'Error checking challenge participation:',
        //   participationError
        // );
      } else if (!participation) {
// console.warn(
        //   `User ${userId} is not an active participant in challenge ${challengeId}`
        // );
      }
    }

    // 챌린지 기간으로 필터링된 weeklyRecords 가져오기 - 실제 계산된 값 포함
    let query = supabase
      .from('workout_weekly_records')
      .select('id, start_date, end_date, cardio_points_total, strength_sessions_count')
      .eq('user_id', userId);

    let w1StartDate: Date | null = null;
    let challengeEnd: Date | null = null;

    if (challengeStartDate && challengeEndDate) {
      // W1을 포함한 전체 기간 조회 - 챌린지 시작일이 포함된 주의 월요일부터
      // 로컬 시간으로 파싱 (타임존 영향 제거)
      const [startYear, startMonth, startDay] = challengeStartDate.split('-').map(Number);
      const challengeStart = new Date(startYear, startMonth - 1, startDay);
      const dayOfWeek = challengeStart.getDay();
      
      // 챌린지 시작일이 포함된 주의 월요일 계산
      w1StartDate = new Date(challengeStart);
      if (dayOfWeek !== 1) {
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        w1StartDate.setDate(w1StartDate.getDate() - daysSinceMonday);
      }
      
      const [endYear, endMonth, endDay] = challengeEndDate.split('-').map(Number);
      challengeEnd = new Date(endYear, endMonth - 1, endDay);
      
      // 7.28-8.3 레코드를 포함하도록 쿼리 수정
      // start_date가 W1 월요일 이후이거나, end_date가 W1 월요일 이후인 모든 레코드
      query = query
        .gte('end_date', w1StartDate.toISOString().split('T')[0])
        .lte('end_date', challengeEndDate);
    }

    const { data: weeklyRecords, error: weeklyError } = await query.order(
      'start_date',
      { ascending: true }
    );


    if (weeklyError) {
// console.error('Error fetching weekly records:', weeklyError);
      return NextResponse.json(
        { error: 'Failed to fetch weekly workout records' },
        { status: 500 }
      );
    }

    // 🆕 누락된 주간 레코드 자동 생성 로직 (일시적으로 비활성화 - 중복 문제 해결)
    // if (challengeId && w1StartDate && challengeEnd) {
    //   await ensureWeeklyRecords(userId, challengeId, w1StartDate, challengeEnd, weeklyRecords || []);
      
    //   // 레코드 재조회 (새로 생성된 레코드 포함)
    //   const { data: updatedRecords, error: updateError } = await query.order('start_date', { ascending: true });
    //   if (!updateError && updatedRecords && weeklyRecords) {
    //     // 기존 weeklyRecords를 완전히 교체
    //     weeklyRecords.splice(0, weeklyRecords.length, ...updatedRecords);
    //   }
    // }

    // 중복 레코드 제거 - 같은 사용자의 같은 주차에 대해 첫 번째 레코드만 사용
    const uniqueWeeklyRecords = [];
    const seenWeeks = new Map<string, boolean>(); // userId-weekStartDate로 체크
    
    if (weeklyRecords) {
      for (const record of weeklyRecords) {
        // 주의 시작일(월요일)을 기준으로 중복 체크
        const recordStart = new Date(record.start_date + 'T00:00:00Z');
        const recordDay = recordStart.getDay();
        let weekMonday = new Date(recordStart);
        if (recordDay !== 1) {
          const daysSinceMonday = recordDay === 0 ? 6 : recordDay - 1;
          weekMonday.setDate(weekMonday.getDate() - daysSinceMonday);
        }
        const weekKey = `${userId}-${weekMonday.toISOString().split('T')[0]}`;
        
        if (!seenWeeks.has(weekKey)) {
          seenWeeks.set(weekKey, true);
          uniqueWeeklyRecords.push(record);
        }
      }
    }

    const weeklyRecordsWithFeedback = [];

    for (const record of uniqueWeeklyRecords) {
      const { data: feedback, error: feedbackError } = await supabase
        .from('workout_feedbacks')
        .select(
          'id, ai_feedback, coach_feedback, coach_memo, coach_id, created_at'
        )
        .eq('workout_weekly_records_id', record.id)
        .eq('challenge_id', challengeId)
        .maybeSingle();

      if (feedbackError) {
// console.error(
        //   'Error fetching feedback for record:',
        //   record.id,
        //   feedbackError
        // );
      }

      let coach = null;
      if (feedback && feedback.coach_id) {
        const { data: coachData, error: coachError } = await supabase
          .from('coaches')
          .select(`
            id, 
            profile_image_url,
            admin_users!admin_user_id (
              username
            )
          `)
          .eq('id', feedback.coach_id)
          .maybeSingle();

        if (!coachError && coachData) {
          coach = {
            id: coachData.id,
            name: coachData.admin_users?.[0]?.username || 'Unknown Coach',
            profile_image_url: coachData.profile_image_url
          };
        } else if (coachError) {
// console.error('Error fetching coach:', coachError);
        }
      }

      // Calculate weekNumber based on challenge start date
      let weekNumber = 1;
      if (challengeStartDate) {
        // 로컬 시간으로 파싱 (타임존 영향 제거)
        const [recYear, recMonth, recDay] = record.start_date.split('-').map(Number);
        const recordStart = new Date(recYear, recMonth - 1, recDay);
        
        const [chalYear, chalMonth, chalDay] = challengeStartDate.split('-').map(Number);
        const challengeStart = new Date(chalYear, chalMonth - 1, chalDay);
        
        // 챌린지 시작일이 속한 주의 월요일 계산
        const startDay = challengeStart.getDay();
        let firstWeekMonday = new Date(challengeStart);
        if (startDay !== 1) {
          const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
          firstWeekMonday.setDate(firstWeekMonday.getDate() - daysSinceMonday);
        }
        
        // 현재 레코드 시작일 (이미 월요일)
        let recordWeekMonday = new Date(recordStart);
        
        const timeDiff = recordWeekMonday.getTime() - firstWeekMonday.getTime();
        const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
        weekNumber = weeksDiff + 1; // W1부터 시작
      }

      // workout_weekly_records 테이블의 실제 계산된 값 사용
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
        // workout_weekly_records 테이블의 실제 값 사용
        cardio_points_total: record.cardio_points_total || 0,
        strength_sessions_count: record.strength_sessions_count || 0,
      });
    }

    // workout_weekly_records 테이블에서 이미 계산된 값을 사용하므로 
    // 별도의 workouts 테이블 집계 계산 불필요

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
      // recentWorkouts 제거 - week-detail API에서만 가져옴
      stats: {
        totalWeeks: weeklyRecordsWithFeedback.length,
        totalCardioPoints,
        totalStrengthSessions,
      },
      // challengePeriod 추가 (클라이언트에서 필요할 수 있음)
      challengePeriod: challengeStartDate && challengeEndDate ? {
        startDate: challengeStartDate,
        endDate: challengeEndDate,
      } : null,
    };
    return NextResponse.json(final, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
// console.error('Error fetching user workout data:', error);
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

// 배치 사용자 데이터 조회 (N+1 쿼리 최적화 적용)
async function getBatchUserWorkoutData(
  userIds: string[],
  challengeId?: string | null
): Promise<NextResponse> {
  try {
    // 챌린지 정보를 먼저 한 번만 가져오기
    let challengeStartDate: string | null = null;
    let challengeEndDate: string | null = null;
    let w1StartDateStr: string | null = null;

    if (challengeId) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('start_date, end_date')
        .eq('id', challengeId)
        .single();

      if (challenge) {
        challengeStartDate = challenge.start_date;
        challengeEndDate = challenge.end_date;

        // W1 시작일 계산 (한 번만)
        const [year, month, day] = challengeStartDate.split('-').map(Number);
        const challengeStart = new Date(year, month - 1, day);
        const startDay = challengeStart.getDay();
        let w1StartDate = new Date(challengeStart);
        if (startDay !== 1) {
          const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
          w1StartDate.setDate(w1StartDate.getDate() - daysSinceMonday);
        }
        w1StartDateStr = w1StartDate.toISOString().split('T')[0];
      }
    }

    // 모든 사용자 정보를 배치로 가져오기
    const { data: users } = await supabase
      .from('users')
      .select('id, name, username')
      .in('id', userIds);

    if (!users || users.length === 0) {
      return NextResponse.json([]);
    }

    // ========================================
    // 배치 쿼리 최적화: 모든 사용자의 주간 기록을 한 번에 조회
    // ========================================
    let weeklyRecordsQuery = supabase
      .from('workout_weekly_records')
      .select('*')
      .in('user_id', userIds);

    if (w1StartDateStr && challengeEndDate) {
      weeklyRecordsQuery = weeklyRecordsQuery
        .gte('start_date', w1StartDateStr)
        .lte('end_date', challengeEndDate);
    }

    const { data: allWeeklyRecords } = await weeklyRecordsQuery.order('start_date', {
      ascending: true,
    });

    // 사용자별로 중복 제거된 레코드 생성
    const userRecordsMap = new Map<string, any[]>();
    const allUniqueRecordIds: string[] = [];

    if (allWeeklyRecords) {
      for (const record of allWeeklyRecords) {
        const userId = record.user_id;
        if (!userRecordsMap.has(userId)) {
          userRecordsMap.set(userId, []);
        }

        // 중복 체크
        const [recordYear, recordMonth, recordDayNum] = record.start_date.split('-').map(Number);
        const recordStart = new Date(recordYear, recordMonth - 1, recordDayNum);
        const recordDay = recordStart.getDay();
        let weekMonday = new Date(recordStart);
        if (recordDay !== 1) {
          const daysSinceMonday = recordDay === 0 ? 6 : recordDay - 1;
          weekMonday.setDate(weekMonday.getDate() - daysSinceMonday);
        }
        const weekKey = `${userId}-${weekMonday.toISOString().split('T')[0]}`;

        const userRecords = userRecordsMap.get(userId)!;
        const alreadyExists = userRecords.some(r => {
          const [rYear, rMonth, rDay] = r.start_date.split('-').map(Number);
          const rStart = new Date(rYear, rMonth - 1, rDay);
          const rDayOfWeek = rStart.getDay();
          let rMonday = new Date(rStart);
          if (rDayOfWeek !== 1) {
            const days = rDayOfWeek === 0 ? 6 : rDayOfWeek - 1;
            rMonday.setDate(rMonday.getDate() - days);
          }
          return `${userId}-${rMonday.toISOString().split('T')[0]}` === weekKey;
        });

        if (!alreadyExists) {
          userRecords.push(record);
          allUniqueRecordIds.push(record.id);
        }
      }
    }

    // ========================================
    // 배치 쿼리: 모든 피드백을 한 번에 조회
    // ========================================
    let feedbackMap = new Map<string, any>();
    if (allUniqueRecordIds.length > 0 && challengeId) {
      const { data: allFeedbacks } = await supabase
        .from('workout_feedbacks')
        .select('workout_weekly_records_id, id, ai_feedback, coach_feedback, coach_memo, coach_id, created_at')
        .in('workout_weekly_records_id', allUniqueRecordIds)
        .eq('challenge_id', challengeId);

      if (allFeedbacks) {
        for (const feedback of allFeedbacks) {
          feedbackMap.set(feedback.workout_weekly_records_id, feedback);
        }
      }
    }

    // ========================================
    // 배치 쿼리: 모든 코치 정보를 한 번에 조회
    // ========================================
    const coachIds = [...new Set(
      Array.from(feedbackMap.values())
        .filter(f => f.coach_id)
        .map(f => f.coach_id)
    )];

    let coachMap = new Map<string, any>();
    if (coachIds.length > 0) {
      const { data: allCoaches } = await supabase
        .from('coaches')
        .select(`
          id,
          profile_image_url,
          admin_users!admin_user_id (
            username
          )
        `)
        .in('id', coachIds);

      if (allCoaches) {
        for (const coach of allCoaches) {
          coachMap.set(coach.id, {
            id: coach.id,
            name: (coach.admin_users as any)?.[0]?.username || 'Unknown Coach',
            profile_image_url: coach.profile_image_url
          });
        }
      }
    }

    // ========================================
    // 메모리에서 데이터 조합 (추가 DB 쿼리 없음)
    // ========================================
    const results = users.map((user) => {
      const userRecords = userRecordsMap.get(user.id) || [];

      const weeklyRecordsWithFeedback = userRecords.map(record => {
        const feedback = feedbackMap.get(record.id) || null;
        const coach = feedback?.coach_id ? coachMap.get(feedback.coach_id) || null : null;

        return {
          ...record,
          feedback,
          coach,
        };
      });

      const totalCardioPoints = userRecords.reduce(
        (sum, record) => sum + (record.cardio_points_total || 0),
        0
      );

      const totalStrengthSessions = userRecords.reduce(
        (sum, record) => sum + (record.strength_sessions_count || 0),
        0
      );

      return {
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          displayName: user.username,
        },
        weeklyRecords: weeklyRecordsWithFeedback,
        stats: {
          totalWeeks: userRecords.length,
          totalCardioPoints,
          totalStrengthSessions,
        },
      };
    });

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
// console.error('Error fetching batch user workout data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch user workout data' },
      { status: 500 }
    );
  }
}

// 거리 리더보드 데이터 조회
async function getDistanceLeaderboardData(
  challengeId: string,
  period: string = 'all',
  weekStart?: string,
  weekEnd?: string
): Promise<NextResponse> {
  try {
    // 1. 챌린지 정보 및 참가자 조회
    const { data: challenge } = await supabase
      .from('challenges')
      .select('start_date, end_date')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const { data: participants } = await supabase
      .from('challenge_participants')
      .select('service_user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    const participantIds = participants?.map((p) => p.service_user_id) || [];

    if (participantIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2. 사용자 정보 가져오기
    const { data: users } = await supabase
      .from('users')
      .select('id, name, username')
      .in('id', participantIds);

    // 3. 기간 설정 (주간 또는 전체)
    let startDate = challenge.start_date;
    let endDate = challenge.end_date;

    if (period === 'weekly' && weekStart && weekEnd) {
      // 선택된 주차 사용
      startDate = weekStart;
      endDate = weekEnd;
    } else if (period === 'weekly') {
      // 주차 미선택 시 현재 주
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
    }

    // 4. 운동 기록에서 거리 합계 계산
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('user_id, distance, points, title, category_id')
      .in('user_id', participantIds)
      .gte('timestamp', `${startDate}T00:00:00`)
      .lte('timestamp', `${endDate}T23:59:59`);

    if (workoutsError) {
      console.error('Workouts query error:', workoutsError);
    }

    // 5. 사용자별 거리/포인트 집계
    const userStats = new Map<string, { distance: number; points: number }>();

    workouts?.forEach((workout) => {
      const current = userStats.get(workout.user_id) || { distance: 0, points: 0 };
      userStats.set(workout.user_id, {
        distance: current.distance + (workout.distance || 0),
        points: current.points + (workout.points || 0),
      });
    });

    // 5. 리더보드 데이터 생성
    const leaderboardData = users?.map((user) => {
      const stats = userStats.get(user.id) || { distance: 0, points: 0 };
      return {
        user_id: user.id,
        user_name: user.name || user.username,
        total_distance: Math.round(stats.distance * 100) / 100, // km 단위, 소수점 2자리
        total_points: Math.round(stats.points * 10) / 10,
      };
    }) || [];

    // 거리 내림차순 정렬
    leaderboardData.sort((a, b) => b.total_distance - a.total_distance);

    // 순위 추가
    leaderboardData.forEach((item, index) => {
      (item as any).rank = index + 1;
    });

    return NextResponse.json(leaderboardData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error in distance leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to process distance leaderboard data' },
      { status: 500 }
    );
  }
}

// 최근 운동 노트 데이터 조회
async function getRecentNotesData(
  challengeId: string,
  limit: number = 10,
  offset: number = 0,
  startDate?: string,
  endDate?: string
): Promise<NextResponse> {
  try {
    // 1. 챌린지 참가자 조회 (id와 service_user_id 모두 필요)
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('id, service_user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    if (participantsError) {
      console.error('Participants query error:', participantsError);
    }

    const participantIds = participants?.map((p) => p.service_user_id) || [];
    const participantIdMap = new Map(
      participants?.map((p) => [p.service_user_id, p.id]) || []
    );

    if (participantIds.length === 0) {
      return NextResponse.json({ notes: [], hasMore: false });
    }

    // 2. 노트가 있는 최근 운동 기록 조회 (페이지네이션)
    let notesQuery = supabase
      .from('workouts')
      .select(`
        id,
        user_id,
        title,
        timestamp,
        duration_minutes,
        distance,
        points,
        note,
        intensity,
        pace_per_km,
        workout_categories (
          name_ko,
          name_en
        )
      `)
      .in('user_id', participantIds)
      .not('note', 'is', null)
      .neq('note', '');

    // 챌린지 기간 필터링
    if (startDate) {
      notesQuery = notesQuery.gte('timestamp', `${startDate}T00:00:00`);
    }
    if (endDate) {
      notesQuery = notesQuery.lte('timestamp', `${endDate}T23:59:59`);
    }

    const { data: workouts, error: workoutsError } = await notesQuery
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit);

    if (workoutsError) {
      console.error('Workouts query error in recent-notes:', workoutsError);
    }

    // 3. 사용자 정보 가져오기
    const userIds = [...new Set(workouts?.map((w) => w.user_id) || [])];
    const { data: users } = userIds.length > 0 ? await supabase
      .from('users')
      .select('id, name, username')
      .in('id', userIds) : { data: [] };

    const userMap = new Map(users?.map((u) => [u.id, u]) || []);

    // 4. 그룹 정보 가져오기 (challenge_group_participants 통해)
    const challengeParticipantIds = [...new Set(
      userIds.map((uid) => participantIdMap.get(uid)).filter(Boolean)
    )];

    const { data: groupParticipants } = challengeParticipantIds.length > 0 ? await supabase
      .from('challenge_group_participants')
      .select(`
        participant_id,
        challenge_groups (
          id,
          name,
          color_code
        )
      `)
      .in('participant_id', challengeParticipantIds)
      .eq('is_active', true) : { data: [] };

    // participant_id -> { name, color_code } 맵
    const participantGroupMap = new Map(
      groupParticipants?.map((gp: any) => [
        gp.participant_id,
        { name: gp.challenge_groups?.name, color: gp.challenge_groups?.color_code }
      ]) || []
    );

    // 5. 미션 완료 정보 가져오기 (challenge_mission_completions 통해)
    const workoutIds = workouts?.map((w) => w.id) || [];
    const { data: missionCompletions } = workoutIds.length > 0 ? await supabase
      .from('challenge_mission_completions')
      .select(`
        workout_id,
        challenge_missions (
          id,
          title
        )
      `)
      .in('workout_id', workoutIds) : { data: [] };

    // workout_id -> mission_title 맵
    const workoutMissionMap = new Map(
      missionCompletions?.map((mc: any) => [mc.workout_id, mc.challenge_missions?.title]) || []
    );

    // 6. 결과 포맷팅
    const notesData = workouts?.map((workout) => {
      const user = userMap.get(workout.user_id);
      const challengeParticipantId = participantIdMap.get(workout.user_id);
      const groupInfo = challengeParticipantId ? participantGroupMap.get(challengeParticipantId) : null;
      const missionTitle = workoutMissionMap.get(workout.id);

      // 페이스: pace_per_km 있으면 사용 (분 단위), 없으면 계산
      let pace = null;
      if (workout.pace_per_km) {
        // pace_per_km는 분 단위 (예: 6.44 = 6'26")
        const paceMin = Math.floor(workout.pace_per_km);
        const paceSec = Math.round((workout.pace_per_km - paceMin) * 60);
        pace = `${paceMin}'${paceSec.toString().padStart(2, '0')}"`;
      } else if (workout.distance && workout.distance > 0 && workout.duration_minutes && workout.duration_minutes > 0) {
        // 계산: duration_minutes / distance
        const paceMinutes = workout.duration_minutes / workout.distance;
        const paceMin = Math.floor(paceMinutes);
        const paceSec = Math.round((paceMinutes - paceMin) * 60);
        pace = `${paceMin}'${paceSec.toString().padStart(2, '0')}"`;
      }

      return {
        id: workout.id,
        user_id: workout.user_id,
        user_name: user?.name || user?.username || '알 수 없음',
        title: workout.title,
        category: (workout.workout_categories as any)?.name_ko || workout.title,
        timestamp: workout.timestamp,
        duration_minutes: workout.duration_minutes,
        distance: workout.distance,
        points: workout.points,
        note: workout.note,
        intensity: workout.intensity,
        pace: pace,
        group_name: groupInfo?.name || null,
        group_color: groupInfo?.color || null,
        mission_title: missionTitle || null,
      };
    }) || [];

    // 더 있는지 확인 (가져온 개수가 limit+1이면 더 있음)
    const hasMore = workouts?.length === limit + 1;
    if (hasMore) {
      notesData.pop(); // 마지막 항목 제거
    }

    return NextResponse.json({
      notes: notesData,
      hasMore: (workouts?.length || 0) > limit,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error in recent notes:', error);
    return NextResponse.json(
      { error: 'Failed to process recent notes data' },
      { status: 500 }
    );
  }
}

// 참가자 목록만 가져오기 (가벼운 API)
async function getParticipantList(challengeId: string): Promise<NextResponse> {
  try {
    // 1. 챌린지 정보
    const { data: challenge } = await supabase
      .from('challenges')
      .select('start_date, end_date, title')
      .eq('id', challengeId)
      .single();

    // 2. 참가자 목록 (유저 정보 join)
    const { data: participants } = await supabase
      .from('challenge_participants')
      .select(`
        service_user_id,
        users!service_user_id (
          id,
          name,
          username
        )
      `)
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    const users = participants?.map((p: any) => ({
      id: p.service_user_id,
      name: p.users?.name || p.users?.username || 'Unknown',
      username: p.users?.username,
    })) || [];

    return NextResponse.json({
      challenge: challenge ? {
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        title: challenge.title,
      } : null,
      users,
      totalCount: users.length,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in participant list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant list' },
      { status: 500 }
    );
  }
}

// 서버 사이드 페이지네이션된 유저 데이터
async function getPaginatedUserData(
  challengeId: string,
  page: number,
  limit: number
): Promise<NextResponse> {
  try {
    // 1. 챌린지 정보
    const { data: challenge } = await supabase
      .from('challenges')
      .select('start_date, end_date')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // 2. 전체 참가자 수 (페이지네이션 정보용)
    const { count: totalCount } = await supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    // 3. 페이지네이션된 참가자 목록
    const offset = (page - 1) * limit;
    const { data: participants } = await supabase
      .from('challenge_participants')
      .select(`
        service_user_id,
        users!service_user_id (
          id,
          name,
          username
        )
      `)
      .eq('challenge_id', challengeId)
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    const userIds = participants?.map((p: any) => p.service_user_id) || [];

    if (userIds.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // 4. W1 시작일 계산
    const [startYear, startMonth, startDay] = challenge.start_date.split('-').map(Number);
    const challengeStart = new Date(startYear, startMonth - 1, startDay);
    const dayOfWeek = challengeStart.getDay();
    let w1StartDate = new Date(challengeStart);
    if (dayOfWeek !== 1) {
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      w1StartDate.setDate(w1StartDate.getDate() - daysSinceMonday);
    }

    // 5. 해당 유저들의 주간 기록 한번에 가져오기
    const { data: weeklyRecords } = await supabase
      .from('workout_weekly_records')
      .select('*')
      .in('user_id', userIds)
      .gte('end_date', w1StartDate.toISOString().split('T')[0])
      .lte('end_date', challenge.end_date)
      .order('start_date', { ascending: true });

    // 6. 주간 기록 ID 목록으로 피드백 한번에 가져오기
    const recordIds = weeklyRecords?.map((r) => r.id) || [];
    const { data: feedbacks } = recordIds.length > 0 ? await supabase
      .from('workout_feedbacks')
      .select('workout_weekly_records_id, id, ai_feedback, coach_feedback, coach_memo, coach_id, created_at')
      .in('workout_weekly_records_id', recordIds)
      .eq('challenge_id', challengeId) : { data: [] };

    // 7. 코치 ID 목록으로 코치 정보 한번에 가져오기
    const coachIds = [...new Set(feedbacks?.filter((f) => f.coach_id).map((f) => f.coach_id) || [])];
    const { data: coaches } = coachIds.length > 0 ? await supabase
      .from('coaches')
      .select(`
        id,
        profile_image_url,
        admin_users!admin_user_id (
          username
        )
      `)
      .in('id', coachIds) : { data: [] };

    // 피드백/코치 맵 생성
    const feedbackMap = new Map(feedbacks?.map((f) => [f.workout_weekly_records_id, f]) || []);
    const coachMap = new Map(coaches?.map((c: any) => [c.id, {
      id: c.id,
      name: c.admin_users?.[0]?.username || 'Unknown Coach',
      profile_image_url: c.profile_image_url,
    }]) || []);

    // 8. 유저별 데이터 구성
    const usersData = participants?.map((p: any) => {
      const userId = p.service_user_id;
      const userRecords = weeklyRecords?.filter((r) => r.user_id === userId) || [];

      // 중복 제거
      const uniqueRecords: any[] = [];
      const seenWeeks = new Set<string>();
      for (const record of userRecords) {
        const weekKey = record.start_date;
        if (!seenWeeks.has(weekKey)) {
          seenWeeks.add(weekKey);

          const feedback = feedbackMap.get(record.id);
          const coach = feedback?.coach_id ? coachMap.get(feedback.coach_id) : null;

          uniqueRecords.push({
            ...record,
            feedback: feedback || null,
            coach: coach || null,
          });
        }
      }

      const totalCardioPoints = uniqueRecords.reduce(
        (sum, r) => sum + (r.cardio_points_total || 0), 0
      );
      const totalStrengthSessions = uniqueRecords.reduce(
        (sum, r) => sum + (r.strength_sessions_count || 0), 0
      );

      return {
        userId,
        user: {
          id: userId,
          name: p.users?.name || p.users?.username || 'Unknown',
          displayName: p.users?.username,
        },
        weeklyRecords: uniqueRecords,
        stats: {
          totalWeeks: uniqueRecords.length,
          totalCardioPoints,
          totalStrengthSessions,
        },
      };
    }) || [];

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      users: usersData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount || 0,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in paginated user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paginated user data' },
      { status: 500 }
    );
  }
}
