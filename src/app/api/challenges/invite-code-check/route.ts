import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
 try {
  const session = (await getServerSession(authOptions)) as Session;
  if (!session?.user?.email) {
   return NextResponse.json(
    { error: 'Not authenticated', type: 'AuthError' },
    { status: 401 }
   );
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const challengeId = searchParams.get('challenge_id');

  if (!token) {
   return NextResponse.json(
    { error: 'token is required', type: 'ValidationError' },
    { status: 400 }
   );
  }

  const query = supabase
   .from('challenge_invites')
   .select('id')
   .eq('invite_token', token)
   .eq('is_active', true)
   .limit(1);

  if (challengeId) {
   query.neq('challenge_id', challengeId);
  }

  const { data } = await query;
  const available = !data || data.length === 0;

  return NextResponse.json({ available });
 } catch (error) {
  return NextResponse.json(
   {
    error: 'Internal server error',
    details: error instanceof Error ? error.message : 'Unknown error',
    type: 'GlobalError',
   },
   { status: 500 }
  );
 }
}
