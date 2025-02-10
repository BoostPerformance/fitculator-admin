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
      .select('id, admin_role, organization_id, username')
      .eq('email', session.user.email)
      .single();

    if (adminError) {
      throw adminError;
    }

    // 코치가 아닌 경우 기본 정보만 반환
    if (adminUser.admin_role !== 'coach') {
      return NextResponse.json({
        username: adminUser.username,
        admin_role: adminUser.admin_role,
      });
    }

    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select(
        `
       *,
       admin_users (
         username,
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
      .eq('admin_user_id', adminUser.id)
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
      username: coach.admin_users.username,
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
