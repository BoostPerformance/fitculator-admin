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
// console.error('조직 목록 가져오기 오류:', organizationsError);
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
// console.error('❌ === Organizations API Error ===', {
    //   name: error instanceof Error ? error.name : 'Unknown error',
    //   message: error instanceof Error ? error.message : String(error),
    //   stack: error instanceof Error ? error.stack : undefined,
    //   type: 'GlobalError',
    // });
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

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: '인증되지 않은 사용자입니다.',
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
          error: '관리자 사용자를 찾을 수 없습니다.',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();

    // 필수 필드 검증
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        {
          error: '조직 이름은 필수입니다.',
          type: 'ValidationError',
        },
        { status: 400 }
      );
    }

    // 조직 생성 (created_by 필드 제거)
    const { data: newOrganization, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: body.name.trim(),
        description: body.description || null,
        logo_url: body.logo_url || null,
      })
      .select()
      .single();

    if (createError) {
// console.error('조직 생성 오류:', createError);
      return NextResponse.json(
        {
          error: '조직 생성에 실패했습니다.',
          details: createError.message,
          type: 'CreateError',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(newOrganization);
  } catch (error) {
// console.error('❌ === Organizations Create API Error ===', {
    //   name: error instanceof Error ? error.name : 'Unknown error',
    //   message: error instanceof Error ? error.message : String(error),
    //   stack: error instanceof Error ? error.stack : undefined,
    //   type: 'GlobalError',
    // });
    return NextResponse.json(
      {
        error: '서버 내부 오류',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        type: 'GlobalError',
      },
      { status: 500 }
    );
  }
}
