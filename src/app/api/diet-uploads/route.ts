import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // 1. 해당 챌린지의 전체 참가자 수 조회
    const { count: totalParticipants } = await supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId);

    // 2. 챌린지 참가자 ID 목록 조회
    const { data: participants, error: participantsError } = await supabase
      .from("challenge_participants")
      .select("id")
      .eq("challenge_id", challengeId);

    if (participantsError) {
      throw participantsError;
    }

    const participantIds = participants.map((p) => p.id);

    // 3. 오늘 식단을 업로드한 참가자 수 조회
    const { data: todayRecords, error: recordsError } = await supabase
      .from("daily_records")
      .select(
        `
        id,
        participant_id,
        meals (
          description
        )
      `
      )
      .eq("record_date", today)
      .in("participant_id", participantIds);

    if (recordsError) {
      throw recordsError;
    }

    // 오늘 식단을 업로드한 참가자 수 계산
    const todayUploads =
      todayRecords?.filter((record) =>
        record.meals?.some(
          (meal) => meal.description && meal.description.trim() !== ""
        )
      ).length || 0;

    return NextResponse.json({
      counts: todayUploads.toString(),
      total: `${totalParticipants}명`,
    });
  } catch (error) {
// console.error("Error fetching diet uploads:", error);
    return NextResponse.json(
      { error: "Failed to fetch diet uploads" },
      { status: 500 }
    );
  }
}
