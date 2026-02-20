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

export async function PUT(request: Request) {
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
    const { eventId, eventNameEn, eventNameKo, competitionType } = body;

    if (!eventId || !competitionType) {
      return NextResponse.json(
        { error: 'eventId와 competitionType은 필수입니다.', type: 'ValidationError' },
        { status: 400 }
      );
    }

    if (!eventNameEn && !eventNameKo) {
      return NextResponse.json(
        { error: 'eventNameEn 또는 eventNameKo 중 하나는 필수입니다.', type: 'ValidationError' },
        { status: 400 }
      );
    }

    // 먼저 매칭되는 레코드들 조회
    let matchQuery = supabase
      .from('competitions')
      .select('id')
      .is('event_id', null)
      .eq('competition_type', competitionType);

    if (eventNameEn) {
      matchQuery = matchQuery.eq('event_name_en', eventNameEn);
    } else {
      matchQuery = matchQuery.eq('event_name_ko', eventNameKo!);
    }

    const { data: matchedRecords, error: matchError } = await matchQuery;

    if (matchError) {
      return NextResponse.json(
        {
          error: '매칭 레코드 조회에 실패했습니다.',
          details: matchError.message,
          type: 'QueryError',
        },
        { status: 500 }
      );
    }

    if (!matchedRecords || matchedRecords.length === 0) {
      return NextResponse.json({
        success: true,
        updated_count: 0,
      });
    }

    // 매칭된 레코드들의 event_id 업데이트
    const ids = matchedRecords.map((r) => r.id);
    const { error: updateError } = await supabase
      .from('competitions')
      .update({
        event_id: eventId,
        event_name_en: null,
        event_name_ko: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (updateError) {
      return NextResponse.json(
        {
          error: '기록 연결에 실패했습니다.',
          details: updateError.message,
          type: 'UpdateError',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated_count: ids.length,
    });
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
