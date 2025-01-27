import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);
export async function GET() {
  try {
    // 먼저 코치 기본 정보 조회
    const { data: challengeName, error: error } = await supabase
      .from('challenge_coaches')
      .select(
        `*, challenges!challenge_id (id,title,
        start_date, end_date
        ))`
      )
      .eq('coach_id', 'coach_002');

    if (error) {
      throw error;
    }

    return NextResponse.json(challengeName);
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
