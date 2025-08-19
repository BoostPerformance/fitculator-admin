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
      .select('*')
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
    const { challenge_id, title, description, mission_type, start_date, end_date, requires_verification, sort_order } = body;

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
    const { id, ...updateData } = body;

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