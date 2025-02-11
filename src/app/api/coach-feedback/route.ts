import { NextRequest, NextResponse } from 'next/server';
//import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Supabase에서 코치 정보 조회 (기존 GET 메서드의 로직 재사용)
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('admin_user_id', adminUser?.id)
      .single();

    //console.log('coach정보', coach);
    const body = await req.json();

    if (!body.daily_record_id) {
      return NextResponse.json(
        { error: 'daily_record_id is required' },
        { status: 400 }
      );
    }

    const result = await prisma.feedbacks.upsert({
      where: {
        daily_record_id: body.daily_record_id,
      },
      update: {
        coach_feedback: body.coach_feedback || '',
        updated_at: new Date(),
      },
      create: {
        daily_record_id: body.daily_record_id,
        coach_id: coach?.id,
        coach_feedback: body.coach_feedback || '',
        ai_feedback: '', // 스키마에 맞게 빈 문자열 추가
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Feedback Error]:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
