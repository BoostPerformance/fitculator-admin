import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();
    // console.log(session);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: adminUser, error: error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    // 받아온 데이터 구조 변환

    // console.log('adminUser 여ㅕ깃어요', adminUser);

    // console.log(formattedData);

    //console.log('Query result:', { adminUser, error });

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
    console.error('Error fetching Data', error);
    return NextResponse.json(
      {
        error: 'failed to fetch data',
      },
      { status: 500 }
    );
  }
}
