import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
          type: 'AuthError',
        },
        { status: 401 }
      );
    }

    // 관리자 사용자 확인
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        {
          error: 'Admin user not found',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // 조직 목록 가져오기
    const { data: organizations, error: organizationsError } = await supabase
      .from('organizations')
      .select('id, name, description, logo_url')
      .order('name');

    if (organizationsError) {
      console.error('조직 목록 가져오기 오류:', organizationsError);
      return NextResponse.json(
        {
          error: 'Failed to fetch organizations',
          details: organizationsError.message,
          type: 'OrganizationsQueryError',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(organizations || []);
  } catch (error) {
    console.error('❌ === Organizations API Error ===', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GlobalError',
    });
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
