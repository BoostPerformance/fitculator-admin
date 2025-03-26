// app/api/test-feedbacks/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // console.log('===== 피드백 테스트 API 시작 =====');
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    // console.log('요청 받은 participantId:', participantId);

    if (!participantId) {
      console.log('참가자 ID가 없음, 400 반환');
      return NextResponse.json(
        { error: '참가자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 참가자의 챌린지 정보 가져오기 (시작일, 종료일 확인용)
    console.log('1. 참가자의 챌린지 정보 조회 중...');
    const { data: participantData, error: participantError } = await supabase
      .from('challenge_participants')
      .select(
        `
        id,
        challenge_id,
        challenges:challenge_id (
          id, 
          start_date, 
          end_date
        )
      `
      )
      .eq('id', participantId)
      .single();

    if (participantError) {
      console.error('참가자 정보 조회 실패:', participantError);
      return NextResponse.json(
        {
          error: '참가자 정보를 찾을 수 없습니다.',
          details: participantError.message,
        },
        { status: 404 }
      );
    }

    // console.log('참가자 정보 조회 성공:', {
    //   id: participantData.id,
    //   challenge_id: participantData.challenge_id,
    //   start_date: participantData.challenges?.start_date,
    //   end_date: participantData.challenges?.end_date,
    // });

    // 2. 참가자의 daily_records 가져오기
    // console.log('2. 참가자의 일일 기록 조회 중...');
    const { data: dailyRecords, error: recordsError } = await supabase
      .from('daily_records')
      .select('id, record_date')
      .eq('participant_id', participantId);

    if (recordsError) {
      console.error('일일 기록 조회 실패:', recordsError);
      return NextResponse.json(
        {
          error: '일일 기록을 가져오는 데 실패했습니다.',
          details: recordsError.message,
        },
        { status: 500 }
      );
    }

    // console.log(`일일 기록 조회 성공: ${dailyRecords?.length || 0}개 발견`);
    if (dailyRecords?.length > 0) {
      // console.log('첫 번째 기록 샘플:', dailyRecords[0]);
    } else {
      console.log('일일 기록이 없습니다.');
    }

    // 3. 각 daily_record에 대한 피드백 수 계산
    // console.log('3. 피드백 데이터 조회 중...');
    const dailyRecordIds = dailyRecords.map((record) => record.id);

    // console.log(`조회할 daily_record_id 개수: ${dailyRecordIds.length}`);
    if (dailyRecordIds.length === 0) {
      console.log('일일 기록이 없어 피드백도 없습니다.');
      return NextResponse.json({
        participantId: participantId,
        challengePeriod: {
          startDate: participantData.challenges?.start_date,
          endDate: participantData.challenges?.end_date,
        },
        totalDailyRecords: 0,
        totalFeedbacks: 0,
        dailyRecordsWithFeedback: 0,
        feedbackPercentage: 0,
      });
    }

    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('id, daily_record_id, ai_feedback, coach_feedback')
      .in('daily_record_id', dailyRecordIds);

    if (feedbacksError) {
      console.error('피드백 조회 실패:', feedbacksError);
      return NextResponse.json(
        {
          error: '피드백을 가져오는 데 실패했습니다.',
          details: feedbacksError.message,
        },
        { status: 500 }
      );
    }

    //console.log(`피드백 조회 성공: ${feedbacks?.length || 0}개 발견`);
    if (feedbacks?.length > 0) {
      // console.log('첫 번째 피드백 샘플:', {
      //   id: feedbacks[0].id,
      //   coach_feedback: feedbacks[0].coach_feedback,
      //   daily_record_id: feedbacks[0].daily_record_id,
      //   has_ai_feedback: !!feedbacks[0].ai_feedback,
      //   has_coach_feedback: !!feedbacks[0].coach_feedback,
      // });
    }

    // 피드백 분석 및 카운트
    console.log('4. 피드백 분석 및 카운트 중...');
    const recordsWithFeedback = new Set();
    const feedbackDetails = [];

    feedbacks.forEach((feedback) => {
      const hasAiFeedback = !!feedback.ai_feedback;
      const hasCoachFeedback = !!feedback.coach_feedback;

      // ai_feedback 또는 coach_feedback이 있는 경우에만 카운트
      if (hasAiFeedback || hasCoachFeedback) {
        recordsWithFeedback.add(feedback.daily_record_id);

        // 디버깅용 상세 정보
        feedbackDetails.push({
          feedback_id: feedback.id,
          daily_record_id: feedback.daily_record_id,
          has_ai_feedback: hasAiFeedback,
          has_coach_feedback: hasCoachFeedback,
        });
      }
    });

    const feedbackCount = recordsWithFeedback.size;
    console.log(`피드백이 있는 일일 기록 수: ${feedbackCount}개`);
    console.log('피드백 상세 정보 (최대 5개):', feedbackDetails.slice(0, 5));

    // 결과 객체 생성
    const result = {
      participantId: participantId,
      challengePeriod: {
        startDate: participantData.challenges?.start_date,
        endDate: participantData.challenges?.end_date,
      },
      totalDailyRecords: dailyRecords.length,
      totalFeedbacks: feedbacks.length,
      dailyRecordsWithFeedback: feedbackCount,
      feedbackPercentage:
        dailyRecords.length > 0
          ? Math.round((feedbackCount / dailyRecords.length) * 100)
          : 0,
    };

    console.log('최종 결과:', result);
    console.log('===== 피드백 테스트 API 종료 =====');

    // 결과 반환
    return NextResponse.json(result);
  } catch (error) {
    console.error('===== 피드백 테스트 API 에러 =====');
    console.error('오류 내용:', error);
    console.error(
      '오류 타입:',
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      '오류 메시지:',
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      '오류 스택:',
      error instanceof Error ? error.stack : '스택 정보 없음'
    );
    console.error('===== 피드백 테스트 API 에러 종료 =====');

    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
