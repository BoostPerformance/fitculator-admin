import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: challengeData, error } = await supabase
      .from('challenge_coaches')
      .select(
        `
        *,
        challenges!challenge_id (
          id,
          title,
          start_date,
          end_date,
          challenge_participants (
            id,
            service_user_id,
            users!service_user_id (
              id,
              name,
              display_name
            ),
            daily_records (
              id,
              record_date,
              updated_at,
              meals (
                id,
                meal_type,
                description,
                updated_at
              ),
              feedbacks (
                id,
                coach_feedback,
                ai_feedback,
                coach_id,
                daily_record_id,
                coach_memo,
                updated_at
              )
            )
          )
        )
      `
      )
      .eq('coach_id', 'coach_002');

    if (error) {
      throw error;
    }

    console.log(challengeData);

    return NextResponse.json(challengeData);
  } catch (error) {
    console.error('Error fetching Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
