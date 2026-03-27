import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import supabaseAdmin from '@/lib/supabase-admin';
import { resolveCoachIdentity } from '@/lib/coach-identity';

export async function GET(req: NextRequest) {
 try {
  const { searchParams } = new URL(req.url);
  const workoutIds = searchParams.get('workoutIds');

  if (!workoutIds) {
   return NextResponse.json(
    { error: 'workoutIds 필요' },
    { status: 400 }
   );
  }

  const session = await getServerSession();
  if (!session?.user?.email) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const coach = await resolveCoachIdentity(session.user.email);
  const currentUserId = coach?.userId;

  const ids = workoutIds.split(',').filter(Boolean);

  // 리액션 타입 + 운동별 리액션 카운트 + 현재 유저 리액션 여부 조회
  const [typesResult, reactionsResult, userReactionsResult] = await Promise.all([
   supabaseAdmin
    .from('reaction_types')
    .select('*')
    .order('display_order', { ascending: true }),
   supabaseAdmin
    .from('workout_reaction_counts')
    .select('*')
    .in('workout_id', ids),
   currentUserId
    ? supabaseAdmin
       .from('workout_reactions')
       .select('workout_id, reaction_type_id')
       .in('workout_id', ids)
       .eq('user_id', currentUserId)
    : Promise.resolve({ data: [], error: null }),
  ]);

  if (typesResult.error) {
   return NextResponse.json(
    { error: '리액션 타입 조회 실패', details: typesResult.error.message },
    { status: 500 }
   );
  }

  // 유저 리액션을 빠른 조회용 Set으로 변환
  const userReactionSet = new Set(
   (userReactionsResult.data || []).map(
    (r: any) => `${r.workout_id}_${r.reaction_type_id}`
   )
  );

  // workout_id별로 그룹핑
  const grouped: Record<string, any[]> = {};
  for (const reaction of reactionsResult.data || []) {
   const wid = reaction.workout_id;
   if (!grouped[wid]) grouped[wid] = [];
   grouped[wid].push({
    reactionTypeId: reaction.reaction_type_id,
    reactionName: reaction.reaction_name,
    emoji: reaction.emoji,
    count: reaction.reaction_count,
    hasReacted: userReactionSet.has(`${wid}_${reaction.reaction_type_id}`),
   });
  }

  return NextResponse.json({
   reactionTypes: typesResult.data,
   reactions: grouped,
  });
 } catch (error) {
  return NextResponse.json(
   { error: '서버 오류', details: error instanceof Error ? error.message : String(error) },
   { status: 500 }
  );
 }
}

export async function POST(req: NextRequest) {
 try {
  const [session, body] = await Promise.all([
   getServerSession(),
   req.json(),
  ]);

  if (!session?.user?.email) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const coach = await resolveCoachIdentity(session.user.email);
  if (!coach) {
   return NextResponse.json(
    { error: '코치 권한이 없거나 앱 계정이 연결되지 않았습니다' },
    { status: 403 }
   );
  }

  const { workout_id, reaction_type_id } = body;
  if (!workout_id || !reaction_type_id) {
   return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
  }

  // 이미 리액션이 있는지 확인
  const { data: existing } = await supabaseAdmin
   .from('workout_reactions')
   .select('id')
   .eq('workout_id', workout_id)
   .eq('user_id', coach.userId)
   .eq('reaction_type_id', reaction_type_id)
   .maybeSingle();

  if (existing) {
   // 이미 있으면 삭제 (토글)
   await supabaseAdmin
    .from('workout_reactions')
    .delete()
    .eq('id', existing.id);
   return NextResponse.json({ action: 'removed' });
  } else {
   // 없으면 추가
   const { error: insertError } = await supabaseAdmin
    .from('workout_reactions')
    .insert({
     workout_id,
     user_id: coach.userId,
     reaction_type_id,
    });

   if (insertError) {
    return NextResponse.json(
     { error: '리액션 추가 실패', details: insertError.message },
     { status: 500 }
    );
   }
   return NextResponse.json({ action: 'added' });
  }
 } catch (error) {
  return NextResponse.json(
   { error: '서버 오류', details: error instanceof Error ? error.message : String(error) },
   { status: 500 }
  );
 }
}
