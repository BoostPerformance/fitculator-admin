import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated', type: 'AuthError' },
        { status: 401 }
      );
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found', type: 'NotFoundError' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('competitions')
      .select('id, user_id, overall_time_seconds, event_date, created_at, users(name)')
      .eq('event_id', eventId)
      .order('overall_time_seconds', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to fetch records',
          details: error.message,
          type: 'QueryError',
        },
        { status: 500 }
      );
    }

    const records = (data || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: (row.users as unknown as { name: string | null } | null)?.name || null,
      overall_time_seconds: row.overall_time_seconds,
      event_date: row.event_date,
      created_at: row.created_at,
    }));

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'GlobalError',
      },
      { status: 500 }
    );
  }
}
