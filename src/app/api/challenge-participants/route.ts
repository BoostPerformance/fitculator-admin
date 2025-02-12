import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET() {
  try {
    // const { data: challangeParticipants, error: error } = await supabase.from(
    //   'challenge_participants'
    // ).select(`*,
    //   users: service_user_id (
    //   id,
    //   username,
    //   name,
    //   )`);

    const { data: dailyRecords } = await supabase.from('challenge_participants')
      .select(`
    id,
    coach_memo,
    memo_record_date,
    users!service_user_id (
      id,
      username,
      name
    ),
    challenges!challenge_id (
      id,
      title,
      challenge_type,
      start_date,
      end_date
    ),
    daily_records!participant_id (
      id,
      record_date,
      feedbacks!daily_record_id (
                id,
                coach_feedback,
                ai_feedback,
                coach_id,
                daily_record_id,
                coach_memo,
                updated_at
              )
    )
  `);
    //console.log('dailyRecords', dailyRecords);

    //if (error) throw error;

    return NextResponse.json(dailyRecords);
  } catch (error) {
    console.error('Error fetching Data', error);
    return NextResponse.json(
      {
        error: 'failed to fetch data',
      },
      { status: 500 }
    );
  }
}
