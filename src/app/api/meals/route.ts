import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // Next.js 캐싱 비활성화
export const fetchCache = 'force-no-store'; // fetch 캐싱 비활성화
export const revalidate = 0; // 재검증 비활성화

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // console.log('GET request received:', new Date().toISOString());

    const url = new URL(request.url);
    const timestamp = url.searchParams.get('t') || Date.now();

    // console.log('Request timestamp:', timestamp);
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

    return new NextResponse(JSON.stringify(meals), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '-1',
        'X-Request-Time': timestamp.toString(),
        'Surrogate-Control': 'no-store',
        Vary: '*',
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
