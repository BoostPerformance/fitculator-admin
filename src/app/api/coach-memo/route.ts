import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.participant_id || !body.challenge_id || !body.coach_memo) {
      return NextResponse.json(
        { error: "participant_id, challenge_id, and coach_memo are required" },
        { status: 400 }
      );
    }

    // 해당 참가자 찾기
    const { data: participant, error: participantError } = await supabase
      .from("challenge_participants")
      .select(
        `
        *,
        users (*)
      `
      )
      .eq("id", body.participant_id)
      .eq("challenge_id", body.challenge_id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // 메모 업데이트
    const { data: result, error: updateError } = await supabase
      .from("challenge_participants")
      .update({
        coach_memo: body.coach_memo,
        memo_updated_at: new Date().toISOString(),
      })
      .eq("id", participant.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(result);
  } catch (error) {
// console.error("[Coach Memo Error]:", error);
    return NextResponse.json(
      { error: "Failed to save coach memo" },
      { status: 500 }
    );
  }
}

// PUT: 코치메모 수정 (새로운 간단한 버전)
export async function PUT(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { participantId, memo } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: '참가자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 코치메모 업데이트
    const { data: updated, error } = await supabase
      .from('challenge_participants')
      .update({
        coach_memo: memo || null,
        memo_updated_at: new Date().toISOString()
      })
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
// console.error('코치메모 업데이트 에러:', error);
      return NextResponse.json(
        { error: '코치메모 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
// console.error('코치메모 API 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
