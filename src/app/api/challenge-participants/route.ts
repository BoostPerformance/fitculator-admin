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

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 30;
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
        const { count } = await supabase
          .from("daily_records")
          .select("*", { count: "exact", head: true })
          .eq("participant_id", participant.id);

        return {
          ...participant,
          daily_records_count: count || 0,
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
