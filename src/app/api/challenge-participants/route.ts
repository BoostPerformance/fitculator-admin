import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // const { data: challangeParticipants, error: error } = await supabase.from(
    //   'challenge_participants'
    // ).select(`*,
    //   users: service_user_id (
    //   id,
    //   username,
    //   name,
    //   )`);

    // URL 파라미터 파싱
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 30;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    console.log("[challenge-participants API] Pagination params:", {
      page,
      limit,
      start,
      end,
    });

    // 기본 정보만 먼저 가져오기
    const { data: participants, error: participantsError } = await supabase
      .from("challenge_participants")
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
      .order("created_at", { ascending: false });

    if (participantsError) {
      throw participantsError;
    }

    // 각 참가자의 최근 daily record만 가져오기
    const participantsWithRecords = await Promise.all(
      participants.map(async (participant) => {
        const { data: latestRecord } = await supabase
          .from("daily_records")
          .select(
            `
            id,
            record_date,
            meals (
              id,
              meal_type,
              description,
              updated_at
            ),
            feedbacks: daily_record_id (
              id,
              coach_feedback,
              ai_feedback,
              coach_id,
              daily_record_id,
              coach_memo,
              updated_at
            )
          `
          )
          .eq("participant_id", participant.id)
          .order("record_date", { ascending: false })
          .limit(1)
          .single();

        return {
          ...participant,
          daily_records: latestRecord ? [latestRecord] : [],
        };
      })
    );

    // 전체 개수 가져오기
    const { count } = await supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true });

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
    console.error("Error fetching Data", error);
    return NextResponse.json(
      {
        error: "failed to fetch data",
      },
      { status: 500 }
    );
  }
}
