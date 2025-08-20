import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { username } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const { data: updatedUser, error } = await supabase
      .from('admin_users')
      .update({ username: username.trim() })
      .eq('email', session.user.email)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      admin_role: updatedUser.admin_role, 
      username: updatedUser.username 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update username' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: adminUser, error: error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (error) {
      throw error;
    }

    if (!adminUser) {
      return NextResponse.json(
        {
          error: 'Admin user not found',
        },
        { status: 404 }
      );
    }

    const coachInfo = {
      admin_role: adminUser?.admin_role,
      username: adminUser?.username,
    };

    return NextResponse.json(coachInfo);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'failed to fetch data',
      },
      { status: 500 }
    );
  }
}
