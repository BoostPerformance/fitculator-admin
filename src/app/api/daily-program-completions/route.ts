import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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
    const challengeId = searchParams.get('challengeId');
    const status = searchParams.get('status');

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('daily_program_completions')
      .select(`
        *,
        users:user_id(id, name, username, profile_image_url),
        daily_program_cards:card_id(
          id, title, card_type, program_id,
          challenge_daily_programs:program_id(id, date, title, challenge_id)
        )
      `)
      .not('daily_program_cards', 'is', null);

    // Filter by challenge_id through the joined program
    // We need to filter completions whose cards belong to programs of this challenge
    // Since Supabase doesn't support nested filters easily, we'll fetch and filter
    if (status) {
      query = query.eq('verification_status', status);
    }

    query = query.order('completed_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by challengeId on the client side (nested relation filter)
    const filtered = (data || []).filter((completion: any) => {
      const program = completion.daily_program_cards?.challenge_daily_programs;
      return program?.challenge_id === challengeId;
    });

    return NextResponse.json(filtered);
  } catch (error) {
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
    const { id, verification_status, verified_by } = body;

    if (!id || !verification_status) {
      return NextResponse.json({ error: 'Missing required fields (id, verification_status)' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(verification_status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "approved" or "rejected"' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('daily_program_completions')
      .update({
        verification_status,
        verified_by: verified_by || null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
