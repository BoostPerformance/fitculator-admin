import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

// 공지사항 목록 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'published';

    let query = supabase
      .from('challenge_announcement')
      .select('*')
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (challengeId) {
      query = query.eq('challenge_id', challengeId);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: announcements, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

// 공지사항 생성
export async function POST(request: Request) {
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
      type = 'general',
      content,
      status = 'draft',
      priority = 0,
      show_on_main = false,
      start_date,
      end_date,
      target_audience = 'all',
      challenge_id,
      target_group_ids
    } = body;

    // 타입 검증
    if (type !== 'general' && type !== 'workout_schedule') {
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

    const insertData = {
      title,
      type,
      content: processedContent,
      status,
      priority,
      show_on_main,
      start_date,
      end_date,
      target_audience,
      challenge_id,
      ...(status === 'published' && { published_at: new Date().toISOString() })
    };

    console.log('Inserting announcement data:', JSON.stringify(insertData, null, 2));
    console.log('Admin user ID:', adminUser?.id);

    const { data: announcement, error } = await supabase
      .from('challenge_announcement')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        {
          error: 'Failed to create announcement',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    // 타겟 그룹 저장 (target_group_ids가 있는 경우에만)
    if (target_group_ids && Array.isArray(target_group_ids) && target_group_ids.length > 0) {
      const targetGroupInserts = target_group_ids.map((groupId: string) => ({
        announcement_id: announcement.id,
        group_id: groupId
      }));

      const { error: targetGroupError } = await supabase
        .from('challenge_announcement_target_groups')
        .insert(targetGroupInserts);

      if (targetGroupError) {
        console.error('Error inserting target groups:', targetGroupError);
        // 공지사항은 이미 생성되었으므로 경고만 로깅
      }
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}