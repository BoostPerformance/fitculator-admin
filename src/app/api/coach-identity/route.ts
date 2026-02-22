import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { resolveCoachIdentity } from '@/lib/coach-identity';

export async function GET() {
 try {
  const session = await getServerSession();
  if (!session?.user?.email) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const coach = await resolveCoachIdentity(session.user.email);
  if (!coach) {
   return NextResponse.json({ data: null });
  }

  // 코치 이름/프로필 조회 (optimistic update용)
  const { default: supabaseAdmin } = await import('@/lib/supabase-admin');
  const { data: user } = await supabaseAdmin
   .from('users')
   .select('name, profile_image_url')
   .eq('id', coach.userId)
   .single();

  return NextResponse.json({
   data: {
    userId: coach.userId,
    coachId: coach.coachId,
    name: user?.name || session.user.name || '코치',
    profileImageUrl: user?.profile_image_url || null,
   },
  });
 } catch (error) {
  return NextResponse.json(
   { error: '서버 오류', details: error instanceof Error ? error.message : String(error) },
   { status: 500 }
  );
 }
}
