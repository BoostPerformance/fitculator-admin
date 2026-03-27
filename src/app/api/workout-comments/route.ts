import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import supabaseAdmin from '@/lib/supabase-admin';
import { resolveCoachIdentity } from '@/lib/coach-identity';

export async function GET(req: NextRequest) {
 try {
  const { searchParams } = new URL(req.url);
  const workoutIds = searchParams.get('workoutIds');
  const challengeId = searchParams.get('challengeId');

  if (!workoutIds || !challengeId) {
   return NextResponse.json(
    { error: 'workoutIds와 challengeId 필요' },
    { status: 400 }
   );
  }

  const ids = workoutIds.split(',').filter(Boolean);

  const { data: comments, error } = await supabaseAdmin
   .from('challenge_workout_comments')
   .select(`
    *,
    author:users!challenge_workout_comments_author_id_users_fkey(id, name, profile_image_url),
    replies:challenge_comment_replies(
     *,
     author:users!challenge_comment_replies_author_id_users_fkey(id, name, profile_image_url)
    )
   `)
   .in('workout_id', ids)
   .eq('challenge_id', challengeId)
   .order('created_at', { ascending: true });

  if (error) {
   return NextResponse.json(
    { error: '코멘트 조회 실패', details: error.message },
    { status: 500 }
   );
  }

  // workout_id별로 그룹핑
  const grouped: Record<string, typeof comments> = {};
  for (const comment of comments || []) {
   const wid = comment.workout_id;
   if (!grouped[wid]) grouped[wid] = [];
   grouped[wid].push(comment);
  }

  return NextResponse.json({ data: grouped });
 } catch (error) {
  return NextResponse.json(
   { error: '서버 오류', details: error instanceof Error ? error.message : String(error) },
   { status: 500 }
  );
 }
}

export async function POST(req: NextRequest) {
 try {
  // 세션 확인 + body 파싱 병렬
  const [session, body] = await Promise.all([
   getServerSession(),
   req.json(),
  ]);

  if (!session?.user?.email) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workout_id, challenge_id, content, visibility } = body;
  if (!workout_id || !challenge_id || !content?.trim()) {
   return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
  }

  // 코치 identity + workout user_id 병렬 조회
  const [coach, workoutResult] = await Promise.all([
   resolveCoachIdentity(session.user.email),
   supabaseAdmin
    .from('workouts')
    .select('user_id')
    .eq('id', workout_id)
    .single(),
  ]);

  if (!coach) {
   return NextResponse.json(
    { error: '코치 권한이 없거나 앱 계정이 연결되지 않았습니다' },
    { status: 403 }
   );
  }

  if (!workoutResult.data) {
   return NextResponse.json({ error: '운동 기록을 찾을 수 없습니다' }, { status: 404 });
  }

  const { data: comment, error: insertError } = await supabaseAdmin
   .from('challenge_workout_comments')
   .insert({
    challenge_id,
    workout_id,
    author_id: coach.userId,
    target_user_id: workoutResult.data.user_id,
    content: content.trim(),
    visibility: visibility || 'public',
   })
   .select('*, author:users!challenge_workout_comments_author_id_users_fkey(id, name, profile_image_url)')
   .single();

  if (insertError) {
   return NextResponse.json(
    { error: '코멘트 저장 실패', details: insertError.message },
    { status: 500 }
   );
  }

  // 새 코멘트에 빈 replies 추가 (클라이언트 호환)
  return NextResponse.json({ data: { ...comment, replies: [] } });
 } catch (error) {
  return NextResponse.json(
   { error: '서버 오류', details: error instanceof Error ? error.message : String(error) },
   { status: 500 }
  );
 }
}

export async function DELETE(req: NextRequest) {
 try {
  const session = await getServerSession();
  if (!session?.user?.email) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const coach = await resolveCoachIdentity(session.user.email);
  if (!coach) {
   return NextResponse.json({ error: '코치 권한 없음' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('commentId');

  if (!commentId) {
   return NextResponse.json({ error: 'commentId 필요' }, { status: 400 });
  }

  // 본인 코멘트만 삭제 가능
  const { data: comment } = await supabaseAdmin
   .from('challenge_workout_comments')
   .select('author_id')
   .eq('id', commentId)
   .single();

  if (!comment || comment.author_id !== coach.userId) {
   return NextResponse.json({ error: '삭제 권한 없음' }, { status: 403 });
  }

  const { error: deleteError } = await supabaseAdmin
   .from('challenge_workout_comments')
   .delete()
   .eq('id', commentId);

  if (deleteError) {
   return NextResponse.json(
    { error: '삭제 실패', details: deleteError.message },
    { status: 500 }
   );
  }

  return NextResponse.json({ success: true });
 } catch (error) {
  return NextResponse.json(
   { error: '서버 오류', details: error instanceof Error ? error.message : String(error) },
   { status: 500 }
  );
 }
}

export async function PATCH(req: NextRequest) {
 try {
  const session = await getServerSession();
  if (!session?.user?.email) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const coach = await resolveCoachIdentity(session.user.email);
  if (!coach) {
   return NextResponse.json({ error: '코치 권한 없음' }, { status: 403 });
  }

  const body = await req.json();
  const { comment_id, content } = body;

  if (!comment_id || !content?.trim()) {
   return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
  }

  // 본인 코멘트만 수정 가능
  const { data: comment } = await supabaseAdmin
   .from('challenge_workout_comments')
   .select('author_id')
   .eq('id', comment_id)
   .single();

  if (!comment || comment.author_id !== coach.userId) {
   return NextResponse.json({ error: '수정 권한 없음' }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
   .from('challenge_workout_comments')
   .update({ content: content.trim() })
   .eq('id', comment_id)
   .select(`
    *,
    author:users!challenge_workout_comments_author_id_users_fkey(id, name, profile_image_url),
    replies:challenge_comment_replies(
     *,
     author:users!challenge_comment_replies_author_id_users_fkey(id, name, profile_image_url)
    )
   `)
   .single();

  if (updateError) {
   return NextResponse.json(
    { error: '수정 실패', details: updateError.message },
    { status: 500 }
   );
  }

  return NextResponse.json({ data: updated });
 } catch (error) {
  return NextResponse.json(
   { error: '서버 오류', details: error instanceof Error ? error.message : String(error) },
   { status: 500 }
  );
 }
}
