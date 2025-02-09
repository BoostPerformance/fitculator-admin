import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    //console.log('Current session email:', session?.user?.email);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, admin_role')
      .eq('email', session.user.email)
      .single();

    if (adminError) {
      throw adminError;
    }

    // 개발자나 시스템 관리자인 경우 URL 파라미터에서 id를 가져올 수 있음
    const targetAdminId =
      ['developer', 'system_admin'].includes(adminUser.admin_role) &&
      adminUser.id;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select(
        `
       *,
       admin_users (
         display_name,
         email,
         organization:organization_id(
         id,
         name)
       ),
       challenge_coaches (
         challenge:challenges (
           *,
           participants:challenge_participants (
             *,
             user:users (*)
           )
         )
       )
     `
      )
      .eq('admin_user_id', targetAdminId)
      .single();

    if (coachError) {
      throw coachError;
    }

    // 받아온 데이터 구조 변환
    const formattedData = {
      id: coach.id,
      admin_user_id: coach.admin_user_id,
      organization_id: coach.organization_id,
      organization_name: coach.admin_users.organization.name,
      display_name: coach.admin_users.display_name,
      profile_image_url: coach.profile_image_url,
      challenges: coach.challenge_coaches.map((cc: any) => ({
        id: cc.challenge.id,
        title: cc.challenge.title,
        participants: cc.challenge.participants.map((p: any) => ({
          id: p.id,
          status: p.status,
        })),
      })),
    };
    // console.log(coach);
    //console.log(formattedData);

    return NextResponse.json(formattedData);
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
