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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: announcement, error } = await supabase
      .from('challenge_announcement')
      .select('*')
      .eq('id', params.id)
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
  { params }: { params: { id: string } }
) {
  try {
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
      start_date,
      end_date,
      target_audience
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
    if (type === 'general' && typeof content === 'string') {
      // 일반 공지의 경우 텍스트를 JSONB 형태로 변환 (줄바꿈 유지)
      processedContent = {
        text: content
      };
    }
    // workout_schedule의 경우 이미 구조화된 객체이므로 그대로 사용

    const updateData: any = {
      title,
      type,
      content: processedContent,
      status,
      priority,
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
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
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
  { params }: { params: { id: string } }
) {
  try {
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
      .eq('id', params.id);

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