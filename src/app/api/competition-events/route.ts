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
        { error: 'Not authenticated', type: 'AuthError' },
        { status: 401 }
      );
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found', type: 'NotFoundError' },
        { status: 404 }
      );
    }

    const { data: events, error: eventsError } = await supabase
      .from('competition_events')
      .select('*')
      .order('sort_order')
      .order('name_ko');

    if (eventsError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch competition events',
          details: eventsError.message,
          type: 'QueryError',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(events || []);
  } catch (error) {
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
        { error: '인증되지 않은 사용자입니다.', type: 'AuthError' },
        { status: 401 }
      );
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: '관리자 사용자를 찾을 수 없습니다.', type: 'NotFoundError' },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (!body.name_ko || !body.name_en || !body.competition_type) {
      return NextResponse.json(
        { error: '대회 종류, 한글명, 영문명은 필수입니다.', type: 'ValidationError' },
        { status: 400 }
      );
    }

    const { data: newEvent, error: createError } = await supabase
      .from('competition_events')
      .insert({
        competition_type: body.competition_type,
        name_ko: body.name_ko.trim(),
        name_en: body.name_en.trim(),
        location: body.location || null,
        city_ko: body.city_ko || null,
        city_en: body.city_en || null,
        country_ko: body.country_ko || null,
        country_en: body.country_en || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        sort_order: body.sort_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        {
          error: '대회 생성에 실패했습니다.',
          details: createError.message,
          type: 'CreateError',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(newEvent);
  } catch (error) {
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
