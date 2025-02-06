// app/api/your-endpoint/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// interface ParticipantResponse {
//   id: string;
//   challenge_id: string;
//   users: {
//     display_name: string;
//     name: string;
//   };
//   daily_records: {
//     record_date: string;
//   }[];
//   feedbacks: {
//     coach_memo: string | null;
//   }[];
// }

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const [
      { data: userData, error: userError },
      { data: dailyMeals, error: mealError },
      { data: coachMemo, error: coachMemoError },
    ] = await Promise.all([
      supabase.from('users').select('display_name, name'),
      supabase.from('daily_records').select('record_date'),
      supabase.from('feedbacks').select('coach_memo'),
    ]);

    if (userError || mealError || coachMemoError) {
      throw userError || mealError || coachMemoError;
    }

    //console.log(userData);

    return NextResponse.json({
      users: userData,
      daily_records: dailyMeals,
      feedbacks: coachMemo,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
