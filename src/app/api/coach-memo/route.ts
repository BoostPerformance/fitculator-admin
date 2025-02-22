import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.participant_id || !body.challenge_id || !body.coach_memo) {
      return NextResponse.json(
        { error: "participant_id, challenge_id, and coach_memo are required" },
        { status: 400 }
      );
    }

    // 해당 참가자 찾기
    const { data: participant, error: participantError } = await supabase
      .from("challenge_participants")
      .select(
        `
        *,
        users (*)
      `
      )
      .eq("id", body.participant_id)
      .eq("challenge_id", body.challenge_id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // 메모 업데이트
    const { data: result, error: updateError } = await supabase
      .from("challenge_participants")
      .update({
        coach_memo: body.coach_memo,
        memo_updated_at: new Date().toISOString(),
      })
      .eq("id", participant.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Coach Memo Error]:", error);
    return NextResponse.json(
      { error: "Failed to save coach memo" },
      { status: 500 }
    );
  }
}
