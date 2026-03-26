import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { resolveCoachIdentity } from '@/lib/coach-identity';
import type { Session } from 'next-auth';

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

const COOLDOWN_DAYS = 7;

export async function GET(
 request: Request,
 { params }: { params: Promise<{ challengeId: string }> }
) {
 try {
  const { challengeId } = await params;

  const session = (await getServerSession(authOptions)) as Session;
  if (!session?.user?.email) {
   return NextResponse.json(
    { error: 'Not authenticated', type: 'AuthError' },
    { status: 401 }
   );
  }

  const { data: adminUser, error: adminError } = await supabase
   .from('admin_users')
   .select('*')
   .eq('email', session.user.email)
   .single();

  if (adminError || !adminUser) {
   return NextResponse.json(
    { error: 'Admin user not found', type: 'NotFoundError' },
    { status: 404 }
   );
  }

  const { data: invite, error: inviteError } = await supabase
   .from('challenge_invites')
   .select('*')
   .eq('challenge_id', challengeId)
   .order('created_at', { ascending: false })
   .limit(1)
   .maybeSingle();

  if (inviteError) {
   return NextResponse.json(
    { error: 'Failed to fetch invite', details: inviteError.message, type: 'QueryError' },
    { status: 500 }
   );
  }

  return NextResponse.json(invite);
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

export async function PUT(
 request: Request,
 { params }: { params: Promise<{ challengeId: string }> }
) {
 try {
  const { challengeId } = await params;

  const session = (await getServerSession(authOptions)) as Session;
  if (!session?.user?.email) {
   return NextResponse.json(
    { error: 'Not authenticated', type: 'AuthError' },
    { status: 401 }
   );
  }

  const { data: adminUser, error: adminError } = await supabase
   .from('admin_users')
   .select('*')
   .eq('email', session.user.email)
   .single();

  if (adminError || !adminUser) {
   return NextResponse.json(
    { error: 'Admin user not found', type: 'NotFoundError' },
    { status: 404 }
   );
  }

  const body = await request.json();
  const { invite_token } = body;

  if (!invite_token || typeof invite_token !== 'string') {
   return NextResponse.json(
    { error: '초대 코드를 입력해주세요.', type: 'ValidationError' },
    { status: 400 }
   );
  }

  if (invite_token.length > 10) {
   return NextResponse.json(
    { error: '초대 코드는 최대 10자까지 입력할 수 있습니다.', type: 'ValidationError' },
    { status: 400 }
   );
  }

  // 기존 초대 조회
  const { data: existing } = await supabase
   .from('challenge_invites')
   .select('*')
   .eq('challenge_id', challengeId)
   .order('created_at', { ascending: false })
   .limit(1)
   .maybeSingle();

  // 쿨다운 체크 (기존 토큰이 있고, 토큰이 변경되는 경우만)
  if (existing && existing.invite_token !== invite_token && existing.invite_token_changed_at) {
   const lastChanged = new Date(existing.invite_token_changed_at);
   const cooldownEnd = new Date(lastChanged.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
   const now = new Date();

   if (now < cooldownEnd) {
    const remainingMs = cooldownEnd.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return NextResponse.json(
     {
      error: `초대 코드는 변경 후 ${COOLDOWN_DAYS}일간 수정할 수 없습니다. ${remainingDays}일 후에 다시 시도해주세요.`,
      type: 'CooldownError',
      cooldown_end: cooldownEnd.toISOString(),
     },
     { status: 429 }
    );
   }
  }

  // 중복 체크 (다른 챌린지에서 같은 토큰 사용 중인지)
  const { data: duplicateCheck } = await supabase
   .from('challenge_invites')
   .select('id')
   .eq('invite_token', invite_token)
   .eq('is_active', true)
   .neq('challenge_id', challengeId)
   .limit(1);

  if (duplicateCheck && duplicateCheck.length > 0) {
   return NextResponse.json(
    { error: '이미 사용 중인 초대 코드입니다. 다른 코드를 입력해주세요.', type: 'DuplicateError' },
    { status: 409 }
   );
  }

  // 업데이트 or 생성
  if (existing) {
   const { data: updated, error: updateError } = await supabase
    .from('challenge_invites')
    .update({
     invite_token,
     invite_token_changed_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single();

   if (updateError) {
    return NextResponse.json(
     { error: 'Failed to update invite code', details: updateError.message, type: 'UpdateError' },
     { status: 500 }
    );
   }

   return NextResponse.json(updated);
  } else {
   // coaches.id를 FK로 사용
   const coachIdentity = await resolveCoachIdentity(session.user.email);
   if (!coachIdentity) {
    return NextResponse.json(
     { error: 'Coach not found', type: 'NotFoundError' },
     { status: 404 }
    );
   }

   const { data: created, error: createError } = await supabase
    .from('challenge_invites')
    .insert({
     challenge_id: challengeId,
     invite_token,
     is_active: true,
     created_by: coachIdentity.coachId,
    })
    .select()
    .single();

   if (createError) {
    return NextResponse.json(
     { error: 'Failed to create invite code', details: createError.message, type: 'CreateError' },
     { status: 500 }
    );
   }

   return NextResponse.json(created);
  }
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
