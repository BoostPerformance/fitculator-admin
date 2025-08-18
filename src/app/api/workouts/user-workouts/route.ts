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
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'userId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // 운동 데이터 가져오기
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        id,
        user_id,
        title,
        timestamp,
        start_time: timestamp,
        duration_minutes,
        points,
        note,
        workout_categories (
          id,
          name_ko,
          name_en,
          type_id,
          workout_types (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workouts' },
        { status: 500 }
      );
    }

    // 운동 타입이 STRENGTH인 것만 필터링 (미션이 운동 타입일 때)
    const filteredWorkouts = workouts?.map(workout => ({
      id: workout.id,
      user_id: workout.user_id,
      title: workout.title,
      start_time: workout.start_time,
      note: workout.note || '',
      duration_minutes: workout.duration_minutes,
      points: workout.points,
      type: workout.workout_categories?.workout_types?.name || 'UNKNOWN'
    })) || [];

    return NextResponse.json(filteredWorkouts);
  } catch (error) {
    console.error('Error in user-workouts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}