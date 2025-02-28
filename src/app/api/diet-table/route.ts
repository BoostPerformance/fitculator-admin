import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const userId = searchParams.get('userId');
    const challengeId = searchParams.get('challengeId');

    // console.log("[diet-table API] Received request:", {
    //   url: request.url,
    //   params: {
    //     date,
    //     userId,
    //     challengeId,
    //   },
    // });

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // 데일리 레코드와 관련 데이터 가져오기
    // 페이지네이션 파라미터 추가
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const start = (page - 1) * limit;

    // 필요한 컬럼만 선택적으로 가져오기
    let query = supabase
      .from('daily_records')
      .select(
        `
        id,
        record_date,
        challenge_participants!inner (
          id,
          users!inner (
            username,
            name
          )
        ),
        feedbacks:feedbacks!left (
          id,
          coach_feedback,
          coach_memo,
          updated_at,
          created_at,
          daily_record_id
        ),
        meals (
          id,
          description,
          meal_type,
          meal_time,
          meal_photos (
            id,
            photo_url
          )
        )
      `,
        { count: 'exact' }
      )
      .range(start, start + limit - 1)
      .eq('challenge_participants.challenge_id', challengeId);

    // 특정 사용자의 기록만 필터링하는 경우
    if (userId) {
      query = query.eq('challenge_participants.users.id', userId);
    }

    if (date) {
      // console.log('[diet-table API] Applying date filter:', {
      //   date,
      //   type: typeof date,
      //   currentServerTime: new Date().toISOString(),
      //   currentServerTimeKST: new Date().toLocaleString('ko-KR', {
      //     timeZone: 'Asia/Seoul',
      //   }),
      // });
      query = query.eq('record_date', date);
    }

    // console.log('[diet-table API] Executing query with filters:', {
    //   challengeId,
    //   userId: userId || 'all',
    //   date,
    // });

    const {
      data: records,
      error: recordsError,
      count,
    } = await query.order('record_date', { ascending: false });

    if (recordsError) {
      console.error('[diet-table API] Supabase query error:', recordsError);
      throw recordsError;
    }

    // console.log('[diet-table API] Query results:', {
    //   count,
    //   recordsCount: records?.length,
    //   firstRecord: records?.[0]
    //     ? {
    //         id: records[0].id,
    //         record_date: records[0].record_date,
    //         feedbacks: records[0].feedbacks,
    //         feedbackDetails: Array.isArray(records[0].feedbacks)
    //           ? {
    //               id: records[0].feedbacks[0]?.id,
    //               coach_feedback: records[0].feedbacks[0]?.coach_feedback,
    //               coach_memo: records[0].feedbacks[0]?.coach_memo,
    //             }
    //           : null,
    //       }
    //     : null,
    //   appliedFilters: {
    //     date,
    //     userId,
    //   },
    // });

    // 데이터 변환: 피드백을 단일 객체로 변경하고 meals를 타입별로 그룹화
    const transformedRecords = records?.map((record) => {
      // console.log('[diet-table API] Processing record feedbacks:', {
      //   originalFeedbacks: record.feedbacks,
      //   isArray: Array.isArray(record.feedbacks),
      //   firstFeedback: Array.isArray(record.feedbacks)
      //     ? record.feedbacks[0]
      //     : null,
      // });

      // feedbacks가 배열이거나 단일 객체인 경우 모두 처리
      let feedbackData = null;
      if (Array.isArray(record.feedbacks) && record.feedbacks.length > 0) {
        feedbackData = record.feedbacks[0];
      } else if (record.feedbacks && typeof record.feedbacks === 'object') {
        feedbackData = record.feedbacks;
      }

      // console.log("[diet-table API] Processed feedback data:", {
      //   recordId: record.id,
      //   originalFeedback: record.feedbacks,
      //   processedFeedback: feedbackData,
      // });

      return {
        ...record,
        feedbacks: feedbackData,
        meals: record.meals?.reduce<{
          breakfast: Array<{
            id: string;
            description: string;
            meal_time: string;
            meal_photos: Array<{ id: string; url: string }>;
          }>;
          lunch: Array<{
            id: string;
            description: string;
            meal_time: string;
            meal_photos: Array<{ id: string; url: string }>;
          }>;
          dinner: Array<{
            id: string;
            description: string;
            meal_time: string;
            meal_photos: Array<{ id: string; url: string }>;
          }>;
          snack: Array<{
            id: string;
            description: string;
            meal_time: string;
            meal_photos: Array<{ id: string; url: string }>;
          }>;
          supplement: Array<{
            id: string;
            description: string;
            meal_time: string;
            meal_photos: Array<{ id: string; url: string }>;
          }>;
        }>(
          (acc, meal) => {
            const mealPhotos =
              meal.meal_photos?.map((photo) => ({
                id: photo.id,
                url: photo.photo_url,
              })) || [];

            const mealType = meal.meal_type as
              | 'breakfast'
              | 'lunch'
              | 'dinner'
              | 'snack'
              | 'supplement';

            if (!acc[mealType]) {
              acc[mealType] = [];
            }
            acc[mealType].push({
              id: meal.id,
              description: meal.description?.trim() || '',
              meal_time: meal.meal_time,
              meal_photos: mealPhotos,
            });
            return acc;
          },
          {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: [],
            supplement: [],
          }
        ) || {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
          supplement: [],
        },
      };
    });

    console.log('[diet-table API] Transformed records:', {
      firstRecord: transformedRecords?.[0],
      firstRecordMeals: transformedRecords?.[0]?.meals,
      totalRecords: transformedRecords?.length,
    });

    return NextResponse.json({
      data: transformedRecords,
      count: count || 0,
    });
  } catch (error) {
    console.error('[diet-table API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
