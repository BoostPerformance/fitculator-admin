import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    //console.log('coach-feedback body', body);

    if (!body.daily_record_id) {
      return NextResponse.json(
        { error: 'daily_record_id is required' },
        { status: 400 }
      );
    }

    // 기존 피드백 확인
    const existingFeedback = await prisma.feedbacks.findUnique({
      where: {
        daily_record_id: body.daily_record_id,
      },
    });

    let result;

    if (existingFeedback) {
      // 기존 피드백 수정
      result = await prisma.feedbacks.update({
        where: {
          daily_record_id: body.daily_record_id,
        },
        data: {
          coach_feedback: body.coach_feedback,
          updated_at: new Date(),
        },
      });
    } else {
      // 새 피드백 생성
      result = await prisma.feedbacks.create({
        data: {
          id: nanoid(),
          daily_record_id: body.daily_record_id,
          coach_feedback: body.coach_feedback,
          ai_feedback: '',
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Feedback Error]:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
