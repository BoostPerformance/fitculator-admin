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
    const url = new URL(request.url);
    const timestamp = url.searchParams.get('t') || Date.now();
    const date = url.searchParams.get('date');

    // console.log('Requested date:', date);

    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select(
        `
         *,
         meal_photos (*),
         daily_records!inner(
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
        `
      )
      .eq('daily_records.record_date', date);

    if (mealsError) throw mealsError;

    // const filterMeal = meals.filter((item) => {
    //   if (item.daily_records.record_date) {
    //     return item.daily_records.record_date === '2025-02-19';
    //   } else {
    //     console.error('no records');
    //   }
    // });
    // console.log('filterMeal', filterMeal);
    // console.log('meals', meals);

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

// const mealbyDate = meals.filter((item) => {
//   return item.daily_records.record_date === '2025-02-19';
// });
// console.log('mealbyDate', mealbyDate);

// 총 레코드 수 확인
// const countCheck = await supabase
//   .from('meals')
//   .select('*', { count: 'exact' });

// console.log('Total records:', countCheck.count);

// // 페이지네이션으로 확인
// const check1 = await supabase
//   .from('meals')
//   .select(
//     `
//   *,
//   daily_records!daily_record_id (
//     *,
//     challenge_participants!participant_id (*)
//   )
// `
//   )
//   .range(0, 999);

// const check2 = await supabase
//   .from('meals')
//   .select(
//     `
//   *,
//   daily_records!daily_record_id (
//     *,
//     challenge_participants!participant_id (*)
//   )
// `
//   )
//   .range(1000, 1999);

// console.log('First 1000:', check1.data?.length);
// console.log('Next 1000:', check2.data?.length);
