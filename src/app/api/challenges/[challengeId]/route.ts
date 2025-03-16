import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
          type: 'AuthError',
        },
        { status: 401 }
      );
    }

    // 관리자 사용자 확인
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        {
          error: 'Admin user not found',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // 챌린지 ID 확인
    const { challengeId } = params;
    if (!challengeId) {
      return NextResponse.json(
        {
          error: 'Challenge ID is required',
          type: 'ValidationError',
        },
        { status: 400 }
      );
    }

    // 챌린지 조회
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch challenge',
          details: challengeError.message,
          type: 'ChallengeQueryError',
        },
        { status: 500 }
      );
    }

    if (!challenge) {
      return NextResponse.json(
        {
          error: 'Challenge not found',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('❌ === Challenge API Error ===', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GlobalError',
    });
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

export async function PUT(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
          type: 'AuthError',
        },
        { status: 401 }
      );
    }

    // 관리자 사용자 확인
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        {
          error: 'Admin user not found',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // 챌린지 ID 확인
    const { challengeId } = params;
    if (!challengeId) {
      return NextResponse.json(
        {
          error: 'Challenge ID is required',
          type: 'ValidationError',
        },
        { status: 400 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const {
      description,
      start_date,
      end_date,
      banner_image_url,
      cover_image_url,
    } = body;

    // 필수 필드 검증
    if (!start_date || !end_date) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          type: 'ValidationError',
        },
        { status: 400 }
      );
    }

    // 챌린지 존재 여부 확인
    const { data: existingChallenge, error: existingChallengeError } =
      await supabase
        .from('challenges')
        .select('id')
        .eq('id', challengeId)
        .single();

    if (existingChallengeError || !existingChallenge) {
      return NextResponse.json(
        {
          error: 'Challenge not found',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // 챌린지 업데이트
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('challenges')
      .update({
        description,
        start_date,
        end_date,
        banner_image_url,
        cover_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (updateError) {
      console.error('챌린지 수정 오류:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update challenge',
          details: updateError.message,
          type: 'ChallengeUpdateError',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error('❌ === Challenge Update API Error ===', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GlobalError',
    });
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
