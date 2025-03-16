import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
interface Meals {
  id: string;
  meal_type: string;
  description: string;
  meal_time: Date;
}
interface DailyRecord {
  id: string;
  participant_id: string;
  record_date: Date;
  meals: Meals;
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get('challenge_id');
  try {
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 30;
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const withRecords = searchParams.get('with_records') === 'true';

    // 기본 쿼리 설정
    let query = supabase.from('challenge_participants').select(
      `
        id,
        coach_memo,
        memo_updated_at,
        service_user_id,
        created_at,
        status,
        users!fk_challenge_participants_service_user (
          id,
          username,
          name,
          email
        ),
        challenges: challenge_id (
          id,
          title,
          challenge_type,
          start_date,
          end_date
        )
      `
    );

    // 챌린지 ID로 필터링
    if (challengeId) {
      query = query.eq('challenge_id', challengeId);
    }

    // 페이지네이션 및 정렬 적용
    const { data: participants, error: participantsError } = await query
      .range(start, end)
      .order('created_at', { ascending: false });

    if (participantsError) {
      throw participantsError;
    }

    // 각 참가자의 최근 daily record만 가져오기
    const participantsWithRecords = await Promise.all(
      participants.map(async (participant) => {
        // Get count of daily records
        const { count } = await supabase
          .from('daily_records')
          .select('*', { count: 'exact', head: true })
          .eq('participant_id', participant.id);

        let dailyRecords: DailyRecord | any = [];

        // If we need the actual records (for the weekly view)
        if (withRecords) {
          const { data: records } = await supabase
            .from('daily_records')
            .select(
              `
              id,
              participant_id,
              record_date,
              meals:meals(
                id,
                meal_type,
                description,
                meal_time
              )
            `
            )
            .eq('participant_id', participant.id);

          dailyRecords = records || [];
        }

        return {
          ...participant,
          daily_records_count: count || 0,
          ...(withRecords && { daily_records: dailyRecords }),
        };
      })
    );

    // 전체 개수 가져오기
    let countQuery = supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true });

    if (challengeId) {
      countQuery = countQuery.eq('challenge_id', challengeId);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      data: participantsWithRecords,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching Data', error);
    return NextResponse.json(
      {
        error: 'failed to fetch data api challenge-participants',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: '인증되지 않은 사용자입니다.',
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
          error: '관리자 권한이 없습니다.',
          type: 'NotFoundError',
        },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { participantId, status } = body;

    console.log('PUT 요청 받음:', { participantId, status });

    // 필수 필드 검증
    if (!participantId) {
      return NextResponse.json(
        {
          error: '참가자 ID는 필수 항목입니다.',
          type: 'ValidationError',
        },
        { status: 400 }
      );
    }

    // 참가자 존재 여부 확인
    const { data: participant, error: participantError } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        {
          error: '참가자를 찾을 수 없습니다.',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // 참가자 상태 업데이트
    console.log('Supabase 쿼리 실행:', {
      table: 'challenge_participants',
      action: 'update',
      data: { status: status || 'dropped' },
      condition: { id: participantId },
    });

    const { data: updatedParticipant, error: updateError } = await supabase
      .from('challenge_participants')
      .update({ status: status || 'dropped' })
      .eq('id', participantId)
      .select('id, status')
      .single();

    console.log('Supabase 쿼리 결과:', {
      data: updatedParticipant,
      error: updateError,
    });

    if (updateError) {
      return NextResponse.json(
        {
          error: '참가자 상태 업데이트에 실패했습니다.',
          details: updateError.message,
          type: 'UpdateError',
        },
        { status: 500 }
      );
    }

    // 응답 반환
    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error('❌ === Challenge Participant API Error ===', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GlobalError',
    });
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'GlobalError',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: '인증되지 않은 사용자입니다.',
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
          error: '관리자 권한이 없습니다.',
          type: 'NotFoundError',
        },
        { status: 403 }
      );
    }

    // URL에서 참가자 ID 가져오기
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    // 필수 필드 검증
    if (!participantId) {
      return NextResponse.json(
        {
          error: '참가자 ID는 필수 항목입니다.',
          type: 'ValidationError',
        },
        { status: 400 }
      );
    }

    // 참가자 존재 여부 확인
    const { data: participant, error: participantError } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        {
          error: '참가자를 찾을 수 없습니다.',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // 참가자 삭제
    const { error: deleteError } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('id', participantId);

    if (deleteError) {
      return NextResponse.json(
        {
          error: '참가자 삭제에 실패했습니다.',
          details: deleteError.message,
          type: 'DeleteError',
        },
        { status: 500 }
      );
    }

    // 성공 응답 반환
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ === Challenge Participant API Error ===', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GlobalError',
    });
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
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
        {
          error: '인증되지 않은 사용자입니다.',
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
          error: '관리자 권한이 없습니다.',
          type: 'NotFoundError',
        },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { challenge_id, email, name } = body;

    // 필수 필드 검증
    if (!challenge_id || !email) {
      return NextResponse.json(
        {
          error: '챌린지 ID와 이메일은 필수 항목입니다.',
          type: 'ValidationError',
        },
        { status: 400 }
      );
    }

    // 챌린지 존재 여부 확인
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id')
      .eq('id', challenge_id)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        {
          error: '챌린지를 찾을 수 없습니다.',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // 사용자 확인 또는 생성
    let userId;
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      // 사용자가 존재하지 않는 경우 오류 반환
      return NextResponse.json(
        {
          error:
            '회원 정보가 없습니다. 해당 이메일로 가입 후에 추가할 수 있습니다.',
          type: 'UserNotFoundError',
        },
        { status: 404 }
      );
    }

    userId = existingUser.id;

    // 이미 참가자로 등록되어 있는지 확인
    const { data: existingParticipant, error: participantError } =
      await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challenge_id)
        .eq('service_user_id', userId)
        .single();

    if (!participantError && existingParticipant) {
      return NextResponse.json(
        {
          error: '이미 챌린지에 참가 중인 사용자입니다.',
          type: 'DuplicateError',
        },
        { status: 400 }
      );
    }

    // 참가자 추가
    const { data: newParticipant, error: createParticipantError } =
      await supabase
        .from('challenge_participants')
        .insert([
          {
            challenge_id: challenge_id,
            service_user_id: userId,
            created_by: adminUser.id,
          },
        ])
        .select('id')
        .single();

    if (createParticipantError) {
      return NextResponse.json(
        {
          error: '참가자 추가에 실패했습니다.',
          details: createParticipantError.message,
          type: 'ParticipantCreationError',
        },
        { status: 500 }
      );
    }

    // 사용자 정보 가져오기
    // 기존 사용자의 username 정보 가져오기
    const { data: userData } = await supabase
      .from('users')
      .select('username, name')
      .eq('id', userId)
      .single();

    const userInfo = {
      email,
      name: userData?.name || name || null,
      username: userData?.username || null,
    };

    // 응답 반환
    return NextResponse.json({
      ...newParticipant,
      user_info: userInfo,
    });
  } catch (error) {
    console.error('❌ === Challenge Participant API Error ===', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GlobalError',
    });
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'GlobalError',
      },
      { status: 500 }
    );
  }
}
