import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET() {
  try {
    // 현재 진행 중인 챌린지와 코치들의 피드백 현황 조회
    const { data: meals, error: mealsError } = await supabase.from('meals')
      .select(`
         *,
         meal_photos (*),
         daily_records!daily_record_id (
          *,
          feedbacks (*),
          challenge_participants!participant_id (
            challenges!challenge_id (
              id,
              title,
              start_date,
              end_date
            ),
            users!service_user_id (
              id,
              username,
              name
            )
          )
        )
        `);

    if (mealsError) throw mealsError;

    return NextResponse.json(meals, {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Detailed error in meals API:', {
      error,
      timestamp: new Date().toISOString(),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch meals',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
