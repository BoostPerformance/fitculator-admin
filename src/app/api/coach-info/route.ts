import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET() {
  try {
    // 먼저 코치 기본 정보 조회
    const { data: coach, error: error } = await supabase
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
      .eq('admin_user_id', 'admin_002')
      .single();

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
    console.log(formattedData);

    if (error) {
      throw error;
    }

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
