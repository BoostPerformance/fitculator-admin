import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.daily_record_id) {
      return NextResponse.json(
        { error: 'daily_record_id is required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // findUnique 대신 findFirst 사용
        const existingFeedback = await tx.feedbacks.findFirst({
          where: {
            daily_record_id: body.daily_record_id,
          },
        });

        if (existingFeedback) {
          return await tx.feedbacks.update({
            where: {
              daily_record_id: body.daily_record_id,
            },
            data: {
              coach_feedback: body.coach_feedback || '',
              updated_at: new Date(),
            },
          });
        } else {
          return await tx.feedbacks.create({
            data: {
              id: nanoid(),
              daily_record_id: body.daily_record_id,
              coach_feedback: body.coach_feedback || '',
              ai_feedback: '',
              updated_at: new Date(),
            },
          });
        }
      },
      {
        timeout: 10000,
        maxWait: 5000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Feedback Error]:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback Backend' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
