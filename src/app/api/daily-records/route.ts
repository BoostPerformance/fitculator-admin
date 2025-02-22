import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const currentDailyRecordId = searchParams.get("currentDailyRecordId");

    if (!date || !currentDailyRecordId) {
      return NextResponse.json(
        { error: "Date and current daily record ID are required" },
        { status: 400 }
      );
    }

    // 1. Get participant_id from current daily record
    const { data: currentRecord, error: currentRecordError } = await supabase
      .from("daily_records")
      .select("participant_id")
      .eq("id", currentDailyRecordId)
      .single();

    if (currentRecordError || !currentRecord) {
      return NextResponse.json(
        { error: "Current daily record not found" },
        { status: 404 }
      );
    }

    // 2. Get daily record for the selected date with same participant_id
    const { data: dailyRecord, error: dailyRecordError } = await supabase
      .from("daily_records")
      .select("*")
      .eq("participant_id", currentRecord.participant_id)
      .eq("record_date", date)
      .single();

    if (!dailyRecord) {
      // Create new daily record if not exists
      const { data: newDailyRecord, error: createError } = await supabase
        .from("daily_records")
        .insert([
          {
            participant_id: currentRecord.participant_id,
            record_date: date,
          },
        ])
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create daily record" },
          { status: 500 }
        );
      }

      return NextResponse.json(newDailyRecord);
    }

    return NextResponse.json(dailyRecord);
  } catch (error) {
    console.error("Error in daily-records GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { participantId, recordDate } = await request.json();

    if (!participantId || !recordDate) {
      return NextResponse.json(
        { error: "Participant ID and record date are required" },
        { status: 400 }
      );
    }

    // 1. Create new daily record
    const { data: dailyRecord, error: dailyRecordError } = await supabase
      .from("daily_records")
      .insert([
        {
          participant_id: participantId,
          record_date: recordDate,
        },
      ])
      .select()
      .single();

    if (dailyRecordError) {
      console.error("Failed to create daily record:", dailyRecordError);
      return NextResponse.json(
        { error: "Failed to create daily record" },
        { status: 500 }
      );
    }

    return NextResponse.json(dailyRecord);
  } catch (error) {
    console.error("Error in daily-records API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
