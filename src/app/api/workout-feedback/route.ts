import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 코치 권한 확인
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!adminUser || adminError) {
      return NextResponse.json(
        { error: '권한 없음 (관리자 아님)' },
        { status: 403 }
      );
    }

    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('admin_user_id', adminUser.id)
      .single();

    if (!coach || coachError) {
      return NextResponse.json(
        { error: '권한 없음 (코치 아님)' },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.workout_weekly_records_id || !body.coach_feedback) {
      return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
    }

    // 기존 피드백 확인
    const { data: existingFeedback } = await supabase
      .from('workout_feedbacks')
      .select('id')
      .eq('workout_weekly_records_id', body.workout_weekly_records_id)
      .single();

    let result;

    if (existingFeedback) {
      const { data, error } = await supabase
        .from('workout_feedbacks')
        .update({
          coach_feedback: body.coach_feedback,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingFeedback.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('workout_feedbacks')
        .insert({
          workout_weekly_records_id: body.workout_weekly_records_id,
          coach_id: coach.id,
          coach_feedback: body.coach_feedback,
          ai_feedback: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[WorkoutFeedback Error]:', error);
    return NextResponse.json(
      {
        error: '피드백 저장 실패',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workoutWeeklyId = searchParams.get('workout_weekly_records_id');

    if (!workoutWeeklyId) {
      return NextResponse.json(
        { error: 'workout_weekly_records_id 쿼리 필요' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('workout_feedbacks')
      .select()
      .eq('workout_weekly_records_id', workoutWeeklyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: '피드백 조회 실패', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    return NextResponse.json(
      {
        error: '서버 오류',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
