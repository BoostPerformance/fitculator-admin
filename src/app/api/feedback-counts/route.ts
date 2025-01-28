import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!
);

export async function GET() {
  try {
    // const today = new Date();

    // 현재 진행 중인 챌린지와 코치들의 피드백 현황 조회
    const { data: feedbackStats, error: feedbackError } = await supabase.from(
      'feedbacks'
    ).select(`
          *,
          daily_records!daily_record_id (
          participant_id,
          challenge_participants!participant_id (
            challenge_id,
            challenges!challenge_id (
              start_date,
              end_date
            )
          )
        )
        `);

    // console.log(feedbackStats);
    if (feedbackError) throw feedbackError;

    // 각 챌린지와 코치별로 데이터 가공
    // const formattedStats = feedbackStats
    //   ?.map((challenge) => {
    //     const startDate = new Date(challenge.start_date);

    //     // 챌린지 시작일부터 오늘까지의 일수 계산
    //     const daysSinceStart =
    //       Math.floor(
    //         (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    //       ) + 1;

    //     // 코치별 통계 계산
    //     const coachStats = challenge.challenge_coaches.map((cc) => {
    //       const coachId = cc.coach_id;

    //       // 해당 코치가 작성한 피드백 수 계산
    //       let feedbackCount = 0;
    //       challenge.challenge_participants.forEach((participant) => {
    //         participant.daily_records?.forEach((record) => {
    //           const recordDate = new Date(record.record_date);
    //           if (recordDate <= today) {
    //             record.feedbacks?.forEach((feedback) => {
    //               if (feedback.coach_feedback && feedback.created_at) {
    //                 feedbackCount++;
    //               }
    //             });
    //           }
    //         });
    //       });

    //       return {
    //         coachId,

    //         challengeTitle: challenge.title,
    //         feedbackRatio: {
    //           completed: feedbackCount,
    //           total: daysSinceStart,
    //           formatted: `${feedbackCount}/${daysSinceStart}`,
    //         },
    //       };
    //     });

    //     return coachStats;
    //   })
    //   .flat();

    return NextResponse.json(feedbackStats);
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback stats' },
      { status: 500 }
    );
  }
}
