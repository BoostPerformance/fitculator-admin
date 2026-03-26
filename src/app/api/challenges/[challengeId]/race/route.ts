import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ challengeId: string }> }
) {
 try {
  const { challengeId } = await params;

  const session = (await getServerSession(authOptions)) as Session;
  if (!session?.user?.email) {
   return NextResponse.json(
    { error: 'Not authenticated', type: 'AuthError' },
    { status: 401 }
   );
  }

  const { data: adminUser, error: adminError } = await supabase
   .from('admin_users')
   .select('*')
   .eq('email', session.user.email)
   .single();

  if (adminError || !adminUser) {
   return NextResponse.json(
    { error: 'Admin user not found', type: 'NotFoundError' },
    { status: 404 }
   );
  }

  // Get challenge participants
  const { data: participants, error: participantsError } = await supabase
   .from('challenge_participants')
   .select('service_user_id')
   .eq('challenge_id', challengeId)
   .neq('status', 'dropped');

  if (participantsError) {
   return NextResponse.json(
    { error: 'Failed to fetch participants', details: participantsError.message },
    { status: 500 }
   );
  }

  if (!participants || participants.length === 0) {
   return NextResponse.json({ records: [], summary: { total: 0, hyrox: 0, marathon: 0, simulation: 0 } });
  }

  const memberIds = participants.map((p) => p.service_user_id);

  // Fetch competitions for these members
  const { data: competitions, error: competitionsError } = await supabase
   .from('competitions')
   .select(`
    id,
    user_id,
    competition_type,
    event_id,
    event_name_en,
    event_name_ko,
    event_date,
    event_location,
    overall_time_seconds,
    workout_id,
    session_code,
    notes,
    created_at,
    users!competitions_user_id_fkey (
     id,
     name,
     birth,
     profile_image_url
    ),
    competition_events (
     id,
     name_ko,
     name_en,
     competition_type,
     city_ko,
     country_ko
    )
   `)
   .in('user_id', memberIds)
   .order('event_date', { ascending: false });

  if (competitionsError) {
   return NextResponse.json(
    { error: 'Failed to fetch competitions', details: competitionsError.message },
    { status: 500 }
   );
  }

  // Fetch hyrox details for hyrox competitions
  const hyroxCompetitionIds = competitions
   ?.filter((c) => c.competition_type === 'hyrox')
   .map((c) => c.id) || [];

  let hyroxDetails: Record<string, any> = {};
  if (hyroxCompetitionIds.length > 0) {
   const { data: hyroxData } = await supabase
    .from('competition_hyrox')
    .select(`
     id,
     competition_id,
     is_simulation,
     division_id,
     run_1_seconds, run_2_seconds, run_3_seconds, run_4_seconds,
     run_5_seconds, run_6_seconds, run_7_seconds, run_8_seconds,
     station_1_seconds, station_2_seconds, station_3_seconds, station_4_seconds,
     station_5_seconds, station_6_seconds, station_7_seconds, station_8_seconds,
     roxzone_total_seconds,
     hyrox_divisions (
      id,
      label_ko,
      label_en,
      category,
      level,
      gender
     )
    `)
    .in('competition_id', hyroxCompetitionIds);

   if (hyroxData) {
    hyroxDetails = Object.fromEntries(
     hyroxData.map((h) => [h.competition_id, h])
    );
   }
  }

  // Fetch marathon details
  const marathonCompetitionIds = competitions
   ?.filter((c) => c.competition_type === 'marathon')
   .map((c) => c.id) || [];

  let marathonDetails: Record<string, any> = {};
  if (marathonCompetitionIds.length > 0) {
   const { data: marathonData } = await supabase
    .from('competition_marathon')
    .select(`
     id,
     competition_id,
     race_type,
     distance_km,
     weather,
     temperature_celsius,
     split_5k_seconds, split_10k_seconds, split_15k_seconds, split_20k_seconds,
     split_25k_seconds, split_30k_seconds, split_35k_seconds, split_40k_seconds,
     split_half_seconds
    `)
    .in('competition_id', marathonCompetitionIds);

   if (marathonData) {
    marathonDetails = Object.fromEntries(
     marathonData.map((m) => [m.competition_id, m])
    );
   }
  }

  // Fetch linked workout data
  const workoutIds = (competitions || [])
   .map((c) => c.workout_id)
   .filter((id): id is string => !!id);

  let workoutDetails: Record<string, any> = {};
  if (workoutIds.length > 0) {
   const { data: workoutData } = await supabase
    .from('workouts')
    .select(`
     id,
     title,
     start_time,
     end_time,
     duration_seconds,
     distance,
     calories,
     points,
     intensity,
     avg_heart_rate,
     max_heart_rate,
     note,
     workout_categories (
      id,
      name_ko,
      name_en
     )
    `)
    .in('id', workoutIds);

   if (workoutData) {
    workoutDetails = Object.fromEntries(
     workoutData.map((w) => [w.id, w])
    );
   }
  }

  // Merge details into competitions
  const records = (competitions || []).map((c) => ({
   ...c,
   hyrox: hyroxDetails[c.id] || null,
   marathon: marathonDetails[c.id] || null,
   workout: c.workout_id ? workoutDetails[c.workout_id] || null : null,
  }));

  // Summary
  const summary = {
   total: records.length,
   hyrox: records.filter((r) => r.competition_type === 'hyrox' && !r.hyrox?.is_simulation).length,
   marathon: records.filter((r) => r.competition_type === 'marathon').length,
   simulation: records.filter((r) => r.hyrox?.is_simulation).length,
  };

  return NextResponse.json({ records, summary });
 } catch (error) {
  return NextResponse.json(
   { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
   { status: 500 }
  );
 }
}

// Merge sessions: move records from one session_code to another
export async function PUT(
 request: Request,
 { params }: { params: Promise<{ challengeId: string }> }
) {
 try {
  const { challengeId } = await params;

  const session = (await getServerSession(authOptions)) as Session;
  if (!session?.user?.email) {
   return NextResponse.json({ error: 'Not authenticated', type: 'AuthError' }, { status: 401 });
  }

  const { data: adminUser, error: adminError } = await supabase
   .from('admin_users')
   .select('*')
   .eq('email', session.user.email)
   .single();

  if (adminError || !adminUser) {
   return NextResponse.json({ error: 'Admin user not found', type: 'NotFoundError' }, { status: 404 });
  }

  const body = await request.json();
  const { record_ids, target_session_code } = body;

  if (!record_ids?.length || !target_session_code) {
   return NextResponse.json({ error: 'record_ids and target_session_code are required', type: 'ValidationError' }, { status: 400 });
  }

  // Verify records belong to challenge participants
  const { data: participants } = await supabase
   .from('challenge_participants')
   .select('service_user_id')
   .eq('challenge_id', challengeId)
   .neq('status', 'dropped');

  if (!participants?.length) {
   return NextResponse.json({ error: 'No participants found', type: 'NotFoundError' }, { status: 404 });
  }

  const memberIds = participants.map((p) => p.service_user_id);

  const { data: updated, error: updateError } = await supabase
   .from('competitions')
   .update({ session_code: target_session_code })
   .in('id', record_ids)
   .in('user_id', memberIds)
   .select('id');

  if (updateError) {
   return NextResponse.json({ error: 'Failed to merge sessions', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ updated: updated?.length || 0 });
 } catch (error) {
  return NextResponse.json(
   { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
   { status: 500 }
  );
 }
}
