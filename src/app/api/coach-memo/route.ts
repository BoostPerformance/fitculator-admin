import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.participant_id || !body.challenge_id || !body.coach_memo) {
      return NextResponse.json(
        { error: 'participant_id, challenge_id, and coach_memo are required' },
        { status: 400 }
      );
    }
    //console.log('Received body:', body);

    // 해당 참가자의 해당 날짜 daily_record 찾기
    const participant = await prisma.challenge_participants.findFirst({
      where: {
        OR: [
          { id: body.participant_id },
          { service_user_id: body.participant_id },
          { users: { id: body.participant_id } },
        ],
        challenge_id: body.challenge_id,
      },
      include: {
        users: true,
      },
    });

    //console.log('Found participant:', participant);

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // 오늘 날짜의 daily_record 찾기
    const dailyRecord = await prisma.daily_records.findFirst({
      where: {
        participant_id: participant.id,
        record_date: new Date(),
      },
    });

    if (!dailyRecord) {
      return NextResponse.json(
        { error: 'No daily record found for today' },
        { status: 404 }
      );
    }
    console.log('dailyRecord', dailyRecord);

    // 트랜잭션으로 피드백 처리
    const feedback = await prisma.$transaction(async (tx) => {
      // 해당 daily_record에 대한 기존 피드백 찾기
      const existingFeedback = await tx.feedbacks.findUnique({
        where: {
          daily_record_id: dailyRecord.id,
        },
      });

      if (existingFeedback) {
        // 기존 피드백 업데이트
        return tx.feedbacks.update({
          where: {
            daily_record_id: dailyRecord.id,
          },
          data: {
            coach_memo: body.coach_memo,
            updated_at: new Date(),
          },
        });
      } else {
        // 새 피드백 생성
        return tx.feedbacks.create({
          data: {
            id: nanoid(),
            daily_record_id: dailyRecord.id,
            coach_id: body.coach_id, // 코치 ID 추가 (선택적)
            coach_memo: body.coach_memo,
            ai_feedback: '', // 기본값 설정
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    });
    console.log('feedback', feedback);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('[Coach Memo Error]:', error);
    return NextResponse.json(
      { error: 'Failed to save coach memo' },
      { status: 500 }
    );
  }
}
