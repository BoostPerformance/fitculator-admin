import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
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

    const organizationId = params.organizationId;

    // admin_users 테이블에서 해당 조직의 멤버 가져오기
    const { data: members, error: membersError } = await supabase
      .from('admin_users')
      .select('id, email, display_name, admin_role, organization_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (membersError) {
      console.error('조직 멤버 목록 가져오기 오류:', membersError);
      return NextResponse.json(
        {
          error: '조직 멤버 목록을 가져오는데 실패했습니다.',
          details: membersError.message,
          type: 'MembersQueryError',
        },
        { status: 500 }
      );
    }

    // 데이터 형식 변환
    const formattedMembers = members.map((member: any) => ({
      id: member.id,
      user_id: member.id,
      organization_id: member.organization_id,
      role: member.admin_role,
      email: member.email,
      name: member.display_name,
    }));

    return NextResponse.json(formattedMembers || []);
  } catch (error) {
    console.error('❌ === Organization Members API Error ===', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GlobalError',
    });
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
