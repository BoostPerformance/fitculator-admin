import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const missionId = searchParams.get('missionId');
    const userId = searchParams.get('userId');
    const challengeId = searchParams.get('challengeId');

    let query = supabase.from('challenge_mission_completions').select('*');

    if (missionId) {
      query = query.eq('mission_id', missionId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (challengeId) {
      const { data: missions } = await supabase
        .from('challenge_missions')
        .select('id')
        .eq('challenge_id', challengeId);
      
      if (missions) {
        const missionIds = missions.map(m => m.id);
        query = query.in('mission_id', missionIds);
      }
    }

    const { data, error } = await query;

    if (error) {
// console.error('Error fetching mission completions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
// console.error('Error in mission-completions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mission_id, user_id, workout_id, proof_note } = body;

    if (!mission_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: mission } = await supabase
      .from('challenge_missions')
      .select('requires_verification')
      .eq('id', mission_id)
      .single();

    const verification_status = mission?.requires_verification ? 'pending' : 'auto_approved';

    const { data, error } = await supabase
      .from('challenge_mission_completions')
      .insert({
        mission_id,
        user_id,
        workout_id,
        verification_status,
        proof_note,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
// console.error('Error creating mission completion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
// console.error('Error in mission-completions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Completion ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('challenge_mission_completions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
// console.error('Error updating mission completion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
// console.error('Error in mission-completions PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const completionId = searchParams.get('completionId');

    if (!completionId) {
      return NextResponse.json({ error: 'Completion ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('challenge_mission_completions')
      .delete()
      .eq('id', completionId);

    if (error) {
// console.error('Error deleting mission completion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
// console.error('Error in mission-completions DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}