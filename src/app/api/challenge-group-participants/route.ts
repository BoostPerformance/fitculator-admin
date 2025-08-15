import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: 그룹별 참가자 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id');
    const challengeId = searchParams.get('challenge_id');

    let query = supabase
      .from('challenge_group_participants')
      .select(`
        *,
        challenge_participants!inner (
          id,
          service_user_id,
          coach_memo,
          memo_updated_at,
          status,
          users!fk_challenge_participants_service_user (
            id,
            username,
            name,
            email
          )
        ),
        challenge_groups (
          id,
          name,
          color_code,
          sort_order
        )
      `)
      .eq('is_active', true);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    if (challengeId) {
      query = query.eq('challenge_participants.challenge_id', challengeId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('그룹 참가자 조회 에러:', error);
      return NextResponse.json(
        { error: '그룹 참가자 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('그룹 참가자 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 참가자를 그룹에 할당
export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { participant_id, group_id, assignment_reason } = body;

    if (!participant_id || !group_id) {
      return NextResponse.json(
        { error: '참가자 ID와 그룹 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // 관리자 권한 확인
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 기존 활성 그룹 할당 비활성화
    await supabase
      .from('challenge_group_participants')
      .update({ is_active: false })
      .eq('participant_id', participant_id)
      .eq('is_active', true);

    // 새 그룹 할당
    const { data: newAssignment, error } = await supabase
      .from('challenge_group_participants')
      .insert([
        {
          participant_id,
          group_id,
          assignment_type: 'manual',
          assigned_by: adminUser.id,
          assignment_reason,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('그룹 할당 에러:', error);
      return NextResponse.json(
        { error: '그룹 할당에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(newAssignment);
  } catch (error) {
    console.error('그룹 할당 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 그룹 할당 수정 (그룹 변경)
export async function PUT(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { participant_id, new_group_id, assignment_reason } = body;

    if (!participant_id || !new_group_id) {
      return NextResponse.json(
        { error: '참가자 ID와 새 그룹 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // 관리자 권한 확인
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 기존 활성 그룹 할당 비활성화
    await supabase
      .from('challenge_group_participants')
      .update({ is_active: false })
      .eq('participant_id', participant_id)
      .eq('is_active', true);

    // 새 그룹 할당
    const { data: newAssignment, error } = await supabase
      .from('challenge_group_participants')
      .insert([
        {
          participant_id,
          group_id: new_group_id,
          assignment_type: 'manual',
          assigned_by: adminUser.id,
          assignment_reason,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('그룹 변경 에러:', error);
      return NextResponse.json(
        { error: '그룹 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(newAssignment);
  } catch (error) {
    console.error('그룹 변경 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 그룹 할당 해제
export async function DELETE(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    if (!participantId) {
      return NextResponse.json(
        { error: '참가자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 관리자 권한 확인
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 활성 그룹 할당 비활성화
    const { error } = await supabase
      .from('challenge_group_participants')
      .update({ is_active: false })
      .eq('participant_id', participantId)
      .eq('is_active', true);

    if (error) {
      console.error('그룹 할당 해제 에러:', error);
      return NextResponse.json(
        { error: '그룹 할당 해제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('그룹 할당 해제 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}