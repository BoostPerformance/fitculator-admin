import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

// 개별 공지사항 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: announcement, error } = await supabase
      .from('challenge_announcement')
      .select(`
        *,
        challenge_announcement_target_groups(group_id)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    );
  }
}

// 공지사항 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      type,
      content,
      status,
      priority,
      show_on_main,
      start_date,
      end_date,
      target_audience,
      target_group_ids
    } = body;

    // 타입 검증
    if (type && type !== 'general' && type !== 'workout_schedule') {
      return NextResponse.json(
        { error: 'Invalid type. Must be either "general" or "workout_schedule"' },
        { status: 400 }
      );
    }

    // content를 올바른 JSON 형태로 변환
    let processedContent = content;
    if (type === 'general') {
      if (typeof content === 'string') {
        // 일반 공지의 경우 텍스트를 JSONB 형태로 변환 (줄바꿈 유지)
        processedContent = {
          text: content
        };
      } else if (content?.type === 'doc') {
        // Tiptap JSON 형식인 경우 그대로 저장
        processedContent = content;
      }
    }
    // workout_schedule의 경우 이미 구조화된 객체이므로 그대로 사용

    const updateData: any = {
      title,
      type,
      content: processedContent,
      status,
      priority,
      show_on_main,
      start_date,
      end_date,
      target_audience,
    };

    // 발행 상태로 변경되면 published_at 설정
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { data: announcement, error } = await supabase
      .from('challenge_announcement')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 타겟 그룹 업데이트 (기존 삭제 후 새로 추가)
    // 먼저 기존 타겟 그룹 삭제
    await supabase
      .from('challenge_announcement_target_groups')
      .delete()
      .eq('announcement_id', id);

    // 새로운 타겟 그룹 추가 (target_group_ids가 있는 경우에만)
    if (target_group_ids && Array.isArray(target_group_ids) && target_group_ids.length > 0) {
      const targetGroupInserts = target_group_ids.map((groupId: string) => ({
        announcement_id: id,
        group_id: groupId
      }));

      const { error: targetGroupError } = await supabase
        .from('challenge_announcement_target_groups')
        .insert(targetGroupInserts);

      if (targetGroupError) {
        console.error('Error updating target groups:', targetGroupError);
        // 공지사항은 이미 수정되었으므로 경고만 로깅
      }
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

// 공지사항 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('challenge_announcement')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}