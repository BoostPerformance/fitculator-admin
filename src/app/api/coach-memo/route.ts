import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
//import { createClient } from '@supabase/supabase-js';

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
// );

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.participant_id || !body.challenge_id || !body.coach_memo) {
      return NextResponse.json(
        { error: 'participant_id, challenge_id, and coach_memo are required' },
        { status: 400 }
      );
    }
    // console.log('Received body:', body);

    // 해당 참가자의 해당 날짜 daily_record 찾기
    const participant = await prisma.challenge_participants.findFirst({
      where: {
        OR: [{ id: body.participant_id }],
        challenge_id: body.challenge_id,
      },
      include: {
        users: true,
      },
    });
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const result = await prisma.challenge_participants.update({
      where: {
        id: participant.id,
      },
      data: {
        coach_memo: body.coach_memo,
        memo_record_date: new Date(),
      },
    });

    console.log('Found participant:', participant);
    console.log('result', result);

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // 트랜잭션으로 피드백 처리
    console.log(NextResponse.json(result));
    return NextResponse.json(participant);
  } catch (error) {
    console.error('[Coach Memo Error]:', error);
    return NextResponse.json(
      { error: 'Failed to save coach memo backend' },
      { status: 500 }
    );
  }
}
