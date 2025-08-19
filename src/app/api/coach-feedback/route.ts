import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dailyRecordId = searchParams.get('daily_record_id');

    if (!dailyRecordId) {
      return NextResponse.json(
        { error: 'daily_record_id is required' },
        { status: 400 }
      );
    }

    // 1. daily_record_id로 participant_id 조회
    const { data: dailyRecord, error: dailyRecordError } = await supabase
      .from('daily_records')
      .select('participant_id')
      .eq('id', dailyRecordId)
      .single();

    if (dailyRecordError) throw dailyRecordError;
    if (!dailyRecord) throw new Error('Daily record not found');

    // 2. participant_id로 challenge_id 조회
    const { data: participantData, error: participantError } = await supabase
      .from('challenge_participants')
      .select('challenge_id')
      .eq('id', dailyRecord.participant_id)
      .single();

    if (participantError) throw participantError;
    if (!participantData) throw new Error('Challenge participant not found');

    // 3. 피드백 조회
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('daily_record_id', dailyRecordId)
      .single();

    if (feedbackError && feedbackError.code !== 'PGRST116') throw feedbackError;

    // 4. 응답에 challenge_id 포함
    const responseData = {
      ...feedback,
      challenge_id: participantData.challenge_id,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
// console.error('[Feedback GET Error]:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch feedback',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Supabase에서 코치 정보 조회
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('admin_user_id', adminUser?.id)
      .single();

    //  console.log('coach정보', coach);
    const body = await req.json();

    if (!body.daily_record_id) {
      return NextResponse.json(
        { error: 'daily_record_id is required' },
        { status: 400 }
      );
    }

    // 기존 피드백 확인
    const { data: existingFeedback } = await supabase
      .from('feedbacks')
      .select()
      .eq('daily_record_id', body.daily_record_id)
      .single();

    let result;
    if (existingFeedback) {
      // 피드백 업데이트
      const { data, error } = await supabase
        .from('feedbacks')
        .update({
          coach_feedback: body.coach_feedback || '',
          updated_at: new Date().toISOString(),
        })
        .eq('daily_record_id', body.daily_record_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 새 피드백 생성
      const { data, error } = await supabase
        .from('feedbacks')
        .insert({
          daily_record_id: body.daily_record_id,
          coach_id: coach?.id,
          coach_feedback: body.coach_feedback || '',
          ai_feedback: '',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
// console.error('[Feedback Error]:', error);
    if (error instanceof Error) {
// console.error('Error message:', error.message);
// console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: 'Failed to save feedback',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
