import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // console.log('body', body);
    //console.log('body.daily_record_id', body.daily_record_id);

    if (!body.daily_record_id) {
      return NextResponse.json(
        { error: 'daily_record_id is required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // console.log('Received daily_record_id:', {
        //   value: body.daily_record_id,
        //   type: typeof body.daily_record_id,
        // });

        const existingFeedback = await tx.feedbacks.findFirst({
          where: {
            daily_record_id: body.daily_record_id,
          },
        });

        // console.log('Existing feedback:', existingFeedback);

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
          // console.log('Creating feedback with data:', {
          //   daily_record_id: body.daily_record_id,
          //   coach_feedback: body.coach_feedback || '',
          //   ai_feedback: '',
          // });

          return await tx.feedbacks.create({
            data: {
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
