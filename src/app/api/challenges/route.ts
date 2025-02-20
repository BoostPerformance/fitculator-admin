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

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    //console.log(session, session);

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError) {
      throw adminError;
    }

    //console.log('adminUser', adminUser);

    if (adminUser.admin_role === 'coach') {
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('id')
        .eq('admin_user_id', adminUser.id)
        .single();

      if (adminError) {
        console.log(
          'Admin User Error:',
          adminError,
          'Email:',
          session.user.email
        );
        return NextResponse.json(
          { error: 'Admin user not found' },
          { status: 404 }
        );
      }
      //console.log('coach', coach);

      const { data: challengeData, error } = await supabase
        .from('challenge_coaches')
        .select(
          `
    challenge_id,
    challenges!inner (
      id,
      title,
      start_date,
      end_date,
      challenge_participants (
        id,
        service_user_id,
        users (
          id,
          name,
          username
        ),
        daily_records (
          id,
          record_date,
          updated_at,
          created_at,
          meals (
            id,
            meal_type,
            description,
            updated_at,
            meal_time
          ),
          feedbacks (
            id,
            coach_feedback,
            ai_feedback,
            coach_id,
            daily_record_id,
            coach_memo,
            updated_at,
            created_at
          )
        )
      )
    )
  `
        )
        .eq('coach_id', coach?.id);

      //  console.log('coach object:', coach); // coach 객체 전체 내용 확인
      //console.log('coach id type:', typeof coach); // id의 타입 확인
      if (error) {
        throw error;
      }

      //  console.log(coach);

      if (coachError) {
        console.log('Coach Error:', coachError, 'Admin ID:', adminUser.id);
        return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
      }
      // console.log(challengeData);

      return NextResponse.json(challengeData);
    }
  } catch (error) {
    console.error('Error fetching Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
