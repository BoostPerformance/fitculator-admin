import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 환경변수 체크
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
// console.error('Missing environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const challengeId = searchParams.get('challengeId');

// console.log('Missions API - Challenge ID:', challengeId);

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('challenge_missions')
      .select(`
        *,
        challenge_mission_target_groups(group_id)
      `)
      .eq('challenge_id', challengeId)
      .order('sort_order', { ascending: true });

// console.log('Missions API - Query result:', { data, error });

    if (error) {
// console.error('Error fetching missions from DB:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
// console.error('Error in missions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { challenge_id, title, description, mission_type, start_date, end_date, requires_verification, sort_order, target_group_ids } = body;

    if (!challenge_id || !title || !mission_type || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('challenge_missions')
      .insert({
        challenge_id,
        title,
        description,
        mission_type,
        start_date,
        end_date,
        requires_verification: requires_verification || false,
        sort_order: sort_order || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
// console.error('Error creating mission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 타겟 그룹 저장 (배열이 있고 비어있지 않은 경우에만)
    if (target_group_ids && Array.isArray(target_group_ids) && target_group_ids.length > 0) {
      const targetGroupInserts = target_group_ids.map((groupId: string) => ({
        mission_id: data.id,
        group_id: groupId
      }));

      const { error: targetError } = await supabase
        .from('challenge_mission_target_groups')
        .insert(targetGroupInserts);

      if (targetError) {
        console.error('Error saving target groups:', targetError);
        // 타겟 그룹 저장 실패 시 생성된 미션 롤백
        await supabase
          .from('challenge_missions')
          .delete()
          .eq('id', data.id);
        return NextResponse.json({ error: 'Failed to save target groups' }, { status: 500 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
// console.error('Error in missions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, target_group_ids, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('challenge_missions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
// console.error('Error updating mission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 기존 타겟 그룹 삭제 후 새로 저장
    const { error: deleteError } = await supabase
      .from('challenge_mission_target_groups')
      .delete()
      .eq('mission_id', id);

    if (deleteError) {
      console.error('Error deleting target groups:', deleteError);
      return NextResponse.json({ error: 'Failed to update target groups' }, { status: 500 });
    }

    // 타겟 그룹 저장 (배열이 있고 비어있지 않은 경우에만)
    if (target_group_ids && Array.isArray(target_group_ids) && target_group_ids.length > 0) {
      const targetGroupInserts = target_group_ids.map((groupId: string) => ({
        mission_id: id,
        group_id: groupId
      }));

      const { error: targetError } = await supabase
        .from('challenge_mission_target_groups')
        .insert(targetGroupInserts);

      if (targetError) {
        console.error('Error saving target groups:', targetError);
        return NextResponse.json({ error: 'Failed to save target groups' }, { status: 500 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
// console.error('Error in missions PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const missionId = searchParams.get('missionId');

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    // 먼저 타겟 그룹 삭제 (FK 제약 대비)
    const { error: targetDeleteError } = await supabase
      .from('challenge_mission_target_groups')
      .delete()
      .eq('mission_id', missionId);

    if (targetDeleteError) {
      console.error('Error deleting target groups:', targetDeleteError);
      return NextResponse.json({ error: 'Failed to delete target groups' }, { status: 500 });
    }

    const { error } = await supabase
      .from('challenge_missions')
      .delete()
      .eq('id', missionId);

    if (error) {
// console.error('Error deleting mission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
// console.error('Error in missions DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}