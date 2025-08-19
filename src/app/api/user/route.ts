import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // users 테이블에서 id가 일치하는 유저 조회
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone_number')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
// console.error('Supabase 오류:', error);
      return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      phoneNumber: data.phone_number,
    });
  } catch (err) {
// console.error('서버 오류:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
