import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: 챌린지의 모든 그룹 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challenge_id');

    if (!challengeId) {
      return NextResponse.json(
        { error: '챌린지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data: groups, error } = await supabase
      .from('challenge_groups')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('그룹 조회 에러:', error);
      return NextResponse.json(
        { error: '그룹 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 각 그룹의 참가자 수 조회
    const groupsWithCount = await Promise.all(
      (groups || []).map(async (group) => {
        const { count } = await supabase
          .from('challenge_group_participants')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('is_active', true);

        return {
          ...group,
          participant_count: count || 0
        };
      })
    );

    return NextResponse.json({ data: groupsWithCount });
  } catch (error) {
    console.error('그룹 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 그룹 생성
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
    const { challenge_id, name, description, color_code, sort_order } = body;

    if (!challenge_id || !name) {
      return NextResponse.json(
        { error: '챌린지 ID와 그룹명은 필수입니다.' },
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

    const { data: newGroup, error } = await supabase
      .from('challenge_groups')
      .insert([
        {
          challenge_id,
          name,
          description,
          color_code,
          sort_order: sort_order || 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('그룹 생성 에러:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 존재하는 그룹명이거나 정렬 순서입니다.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: '그룹 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('그룹 생성 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 그룹 수정
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
    const { id, name, description, color_code, sort_order } = body;

    if (!id) {
      return NextResponse.json(
        { error: '그룹 ID가 필요합니다.' },
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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color_code !== undefined) updateData.color_code = color_code;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedGroup, error } = await supabase
      .from('challenge_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('그룹 수정 에러:', error);
      return NextResponse.json(
        { error: '그룹 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('그룹 수정 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 그룹 삭제
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
    const groupId = searchParams.get('id');

    if (!groupId) {
      return NextResponse.json(
        { error: '그룹 ID가 필요합니다.' },
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

    // 그룹에 속한 참가자가 있는지 확인
    const { count } = await supabase
      .from('challenge_group_participants')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (count && count > 0) {
      return NextResponse.json(
        { error: '그룹에 참가자가 있어 삭제할 수 없습니다. 먼저 참가자를 다른 그룹으로 이동시켜주세요.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('challenge_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error('그룹 삭제 에러:', error);
      return NextResponse.json(
        { error: '그룹 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('그룹 삭제 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}