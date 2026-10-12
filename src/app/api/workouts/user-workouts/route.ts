import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import supabase from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
 try {
 // Service-role read: only a signed-in coach/admin may ask for someone's workouts.
 const session = await getServerSession(authOptions);
 if (!session?.user?.email) {
 return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
 }
 const url = new URL(request.url);
 const userId = url.searchParams.get('userId');
 const startDate = url.searchParams.get('startDate');
 const endDate = url.searchParams.get('endDate');

// console.log('user-workouts API called with:', { userId, startDate, endDate });

 if (!userId || !startDate || !endDate) {
 return NextResponse.json(
 { error: 'userId, startDate, and endDate are required' },
 { status: 400 }
 );
 }

 // 운동 데이터 가져오기 - description 제외
 const { data: workouts, error } = await supabase
 .from('workouts')
 .select(`
 id,
 user_id,
 title,
 timestamp,
 duration_minutes,
 points,
 note,
 distance,
 calories,
 avg_heart_rate,
 max_heart_rate,
 rpe,
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
// console.error('Error fetching workouts:', error);
 return NextResponse.json(
 { error: 'Failed to fetch workouts', details: error.message },
 { status: 500 }
 );
 }

// console.log('Fetched workouts count:', workouts?.length || 0);

 // 운동 데이터 변환 - 추가 필드들 포함
 const filteredWorkouts = workouts?.map(workout => {
 try {
 return {
 id: workout.id,
 user_id: workout.user_id,
 title: workout.title || '',
 start_time: workout.timestamp,
 note: workout.note || '',
 duration_minutes: workout.duration_minutes || null,
 points: workout.points || null,
 distance: workout.distance || null,
 calories: workout.calories || null,
 avg_heart_rate: workout.avg_heart_rate || null,
 max_heart_rate: workout.max_heart_rate || null,
 rpe: workout.rpe || null,
 type: workout.workout_categories?.workout_types?.name || 'UNKNOWN',
 workout_category: {
 name_ko: workout.workout_categories?.name_ko || '',
 name_en: workout.workout_categories?.name_en || ''
 }
 };
 } catch (error) {
// console.error('Error processing workout:', workout, error);
 return null;
 }
 }).filter(Boolean) || [];

// console.log('Returning filtered workouts count:', filteredWorkouts.length);
 return NextResponse.json(filteredWorkouts);
 } catch (error) {
// console.error('Error in user-workouts API:', error);
 return NextResponse.json(
 { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
 { status: 500 }
 );
 }
}