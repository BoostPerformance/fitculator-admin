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

    const challengeStart = new Date(challenge.start_date);
    const challengeEnd = new Date(challenge.end_date);

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
    const { data: weeklyRecords } = await supabase
      .from('workout_weekly_records')
      .select('*')
      .in('user_id', participantIds)
      .gte('start_date', w1StartDate.toISOString().split('T')[0])
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
      const recordStartDate = new Date(record.start_date + 'T00:00:00Z');
      
      // 레코드가 속한 주차 찾기
      const matchedWeek = allWeeks.find(week => {
        const weekStart = new Date(week.startDate + 'T00:00:00Z');
        const weekEnd = new Date(week.endDate + 'T23:59:59Z');
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
      const challengeStart = new Date(challengeStartDate);
      const startDay = challengeStart.getDay();
      
      // 챌린지 시작일이 포함된 주의 월요일 계산
      w1StartDate = new Date(challengeStart);
      if (startDay !== 1) {
        const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
        w1StartDate.setDate(w1StartDate.getDate() - daysSinceMonday);
      }
      
      challengeEnd = new Date(challengeEndDate);
      
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
        const recordStart = new Date(record.start_date + 'T00:00:00Z');
        const challengeStart = new Date(challengeStartDate + 'T00:00:00Z');
        
        // 챌린지 시작일이 속한 주의 월요일 계산
        const startDay = challengeStart.getDay();
        let firstWeekMonday = new Date(challengeStart);
        if (startDay !== 1) {
          const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
          firstWeekMonday.setDate(firstWeekMonday.getDate() - daysSinceMonday);
        }
        
        // 현재 레코드가 속한 주의 월요일 계산
        const recordDay = recordStart.getDay();
        let recordWeekMonday = new Date(recordStart);
        if (recordDay !== 1) {
          const daysSinceMonday = recordDay === 0 ? 6 : recordDay - 1;
          recordWeekMonday.setDate(recordWeekMonday.getDate() - daysSinceMonday);
        }
        
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

// 배치 사용자 데이터 조회
async function getBatchUserWorkoutData(
  userIds: string[],
  challengeId?: string | null
): Promise<NextResponse> {
  try {
    // 챌린지 정보를 먼저 한 번만 가져오기
    let challengeStartDate: string | null = null;
    let challengeEndDate: string | null = null;

    if (challengeId) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('start_date, end_date')
        .eq('id', challengeId)
        .single();

      if (challenge) {
        challengeStartDate = challenge.start_date;
        challengeEndDate = challenge.end_date;
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

    // 모든 사용자의 데이터를 병렬로 처리
    const promises = users.map(async (user) => {

      // 주간 기록 가져오기 (피드백 포함)
      let query = supabase
        .from('workout_weekly_records')
        .select('*')
        .eq('user_id', user.id);

      if (challengeStartDate && challengeEndDate) {
        // W1을 포함한 전체 기간 조회 - 챌린지 시작일이 포함된 주의 월요일부터
        const challengeStart = new Date(challengeStartDate);
        const startDay = challengeStart.getDay();
        
        // 챌린지 시작일이 포함된 주의 월요일 계산
        let w1StartDate = new Date(challengeStart);
        if (startDay !== 1) {
          const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
          w1StartDate.setDate(w1StartDate.getDate() - daysSinceMonday);
        }
        
        query = query
          .gte('start_date', w1StartDate.toISOString().split('T')[0])
          .lte('end_date', challengeEndDate);
      }

      const { data: weeklyRecords } = await query.order('start_date', {
        ascending: true,
      });

      // 중복 레코드 제거
      const uniqueWeeklyRecords = [];
      const seenWeeks = new Map<string, boolean>();
      
      if (weeklyRecords) {
        for (const record of weeklyRecords) {
          const recordStart = new Date(record.start_date + 'T00:00:00Z');
          const recordDay = recordStart.getDay();
          let weekMonday = new Date(recordStart);
          if (recordDay !== 1) {
            const daysSinceMonday = recordDay === 0 ? 6 : recordDay - 1;
            weekMonday.setDate(weekMonday.getDate() - daysSinceMonday);
          }
          const weekKey = `${user.id}-${weekMonday.toISOString().split('T')[0]}`;
          
          if (!seenWeeks.has(weekKey)) {
            seenWeeks.set(weekKey, true);
            uniqueWeeklyRecords.push(record);
          }
        }
      }

      // 각 주간 기록에 피드백 정보 추가
      const weeklyRecordsWithFeedback = [];
      for (const record of uniqueWeeklyRecords) {
        const { data: feedback } = await supabase
          .from('workout_feedbacks')
          .select('id, ai_feedback, coach_feedback, coach_memo, coach_id, created_at')
          .eq('workout_weekly_records_id', record.id)
          .eq('challenge_id', challengeId)
          .maybeSingle();

        let coach = null;
        if (feedback && feedback.coach_id) {
          const { data: coachData } = await supabase
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

          if (coachData) {
            coach = {
              id: coachData.id,
              name: coachData.admin_users?.[0]?.username || 'Unknown Coach',
              profile_image_url: coachData.profile_image_url
            };
          }
        }

        weeklyRecordsWithFeedback.push({
          ...record,
          feedback: feedback || null,
          coach: coach || null,
        });
      }

      const totalCardioPoints = uniqueWeeklyRecords.reduce(
        (sum, record) => sum + (record.cardio_points_total || 0),
        0
      );

      const totalStrengthSessions = uniqueWeeklyRecords.reduce(
        (sum, record) => sum + (record.strength_sessions_count || 0),
        0
      ) || 0;

      return {
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          displayName: user.username,
        },
        weeklyRecords: weeklyRecordsWithFeedback,
        stats: {
          totalWeeks: uniqueWeeklyRecords.length,
          totalCardioPoints,
          totalStrengthSessions,
        },
      };
    });

    const results = await Promise.all(promises);
    const validResults = results.filter((result) => result !== null);

    return NextResponse.json(validResults, {
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
