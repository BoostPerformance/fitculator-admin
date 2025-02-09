import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession();
    //console.log('Session', session?.user);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError) {
      throw adminError;
    }

    let coachId = 'coach_heeju'; // 기본값으로 희주 코치 ID 설정

    if (adminUser.admin_role === 'coach') {
      console.log('adminUser.id', adminUser.id);
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('id')
        .eq('admin_user_id', adminUser.id)
        .single();

      if (coachError) {
        throw coachError;
      }

      coachId = coach.id;
    }
    // role이 'developer'나 'system_admin'이 아닌 경우 접근 거부
    else if (!['developer', 'system_admin'].includes(adminUser.admin_role)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const { data: challengeData, error } = await supabase
      .from('challenge_coaches')
      .select(
        `
        *,
        challenges!challenge_id (
          id,
          title,
          start_date,
          end_date,
          challenge_participants (
            id,
            service_user_id,
            users!service_user_id (
              id,
              name,
              display_name
            ),
            daily_records (
              id,
              record_date,
              updated_at,
              meals (
                id,
                meal_type,
                description,
                updated_at
              ),
              feedbacks (
                id,
                coach_feedback,
                ai_feedback,
                coach_id,
                daily_record_id,
                coach_memo,
                updated_at
              )
            )
          )
        )
      `
      )
      .eq('coach_id', coachId);
    console.log(coachId);
    if (error) {
      throw error;
    }

    //console.log(challengeData);

    return NextResponse.json(challengeData);
  } catch (error) {
    console.error('Error fetching Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
