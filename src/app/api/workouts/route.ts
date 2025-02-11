import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    //console.log(session, session);

    const { data: workoutData, error: woroutError } = await supabase
      .from('workouts')
      .select('*');

    if (woroutError) {
      throw woroutError;
    }

    // console.log('workoutData', workoutData);

    return NextResponse.json(workoutData);
  } catch (error) {
    console.error('Error fetching Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
