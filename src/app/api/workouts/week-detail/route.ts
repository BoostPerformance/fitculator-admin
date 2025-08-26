import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 해당 기간의 모든 운동 데이터 가져오기
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        id,
        user_id,
        category_id,
        timestamp,
        start_time,
        end_time,
        points,
        duration_minutes,
        duration_seconds,
        title,
        intensity,
        note,
        avg_heart_rate,
        max_heart_rate,
        workout_categories (
          name_ko,
          name_en,
          workout_types (
            name
          )
        )
      `)
      .eq('user_id', userId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: true });

    if (error) {
      // console.error('Error fetching workouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workouts' },
        { status: 500 }
      );
    }

    // 데이터 포맷팅
    const formattedWorkouts = workouts?.map(workout => ({
      id: workout.id,
      startTime: workout.start_time,
      endTime: workout.end_time,
      timestamp: workout.timestamp,
      title: workout.title || '운동',
      category: workout.workout_categories?.name_ko || '기타',
      type: workout.workout_categories?.workout_types?.name || 'UNKNOWN',
      points: workout.points || 0,
      duration: workout.duration_minutes || 0,
      duration_seconds: workout.duration_seconds || 0,
      intensity: workout.intensity,
      note: workout.note,
      avg_heart_rate: workout.avg_heart_rate,
      max_heart_rate: workout.max_heart_rate,
    })) || [];

    return NextResponse.json(
      {
        workouts: formattedWorkouts,
        total: formattedWorkouts.length
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'X-Accel-Expires': '0',
          'Vary': '*'
        }
      }
    );
  } catch (error) {
    // console.error('Error in week-detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}