import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 30;
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const withRecords = searchParams.get('with_records') === 'true';

    console.log('[challenge-participants API] Pagination params:', {
      page,
      limit,
      start,
      end,
      withRecords,
    });

    // 기본 정보만 먼저 가져오기
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select(
        `
        id,
        coach_memo,
        memo_updated_at,
        service_user_id,
        users!fk_challenge_participants_service_user (
          id,
          username,
          name
        ),
        challenges: challenge_id (
          id,
          title,
          challenge_type,
          start_date,
          end_date
        )
      `
      )
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
    const { count } = await supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true });

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
