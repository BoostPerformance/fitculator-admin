import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET() {
  try {
    // 먼저 코치 기본 정보 조회
    const { data: adminUser, error: error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', 'admin_heeju')
      .single();

    // 받아온 데이터 구조 변환

    // console.log(adminUser);

    // console.log(formattedData);
    const coachInfo = {
      admin_role: adminUser?.admin_role,
      display_name: adminUser?.display_name,
    };
    if (error) {
      throw error;
    }

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
