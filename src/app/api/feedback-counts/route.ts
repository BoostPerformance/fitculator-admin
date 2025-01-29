import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET() {
  try {
    // 현재 진행 중인 챌린지와 코치들의 피드백 현황 조회
    const { data: feedbackStats, error: feedbackError } = await supabase.from(
      'feedbacks'
    ).select(`
          *,
          daily_records!daily_record_id (
          participant_id,
          challenge_participants!participant_id (
            challenge_id,
            challenges!challenge_id (
              start_date,
              end_date
            )
          )
        )
        `);

    if (feedbackError) throw feedbackError;

    return NextResponse.json(feedbackStats);
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback stats' },
      { status: 500 }
    );
  }
}
