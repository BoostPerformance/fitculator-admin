// /app/api/diet-upload-count/route.ts (Next.js 13 이상)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get('challengeId');
  const date = searchParams.get('date');

  if (!challengeId || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const { count, error } = await supabase
    .from('daily_records')
    .select('challenge_participants!inner(id)', { count: 'exact', head: true })
    .eq('challenge_participants.challenge_id', challengeId)
    .eq('record_date', date);

  if (error) {
    console.error('Supabase count error:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  return NextResponse.json({ uploadCount: count ?? 0 });
}
