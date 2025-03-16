import { NextResponse } from 'next/server';
import { createClient, PostgrestError } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import {
  ChallengeCoach,
  ChallengeParticipant,
  SupabaseChallenge,
  SupabaseUser,
} from '@/types/challengeTypes';
import type { Session } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Record<string, string | string[]> }
) {
  // console.log("🔄 === Challenges API Request Start ===");
  try {
    // console.log("🔍 Getting server session...");
    const session = (await getServerSession(authOptions)) as Session;
    // console.log("📥 Session:", session?.user?.email || "No session");

    if (!session?.user?.email) {
      //   console.log("❌ Not authenticated");
      return NextResponse.json(
        {
          error: 'Not authenticated',
          type: 'AuthError',
        },
        { status: 401 }
      );
    }

    //  console.log("🔍 Fetching admin user...");
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (adminError) {
      console.error('❌ Admin User Error:', {
        error: adminError,
        code: adminError.code,
        details: adminError.details,
        type: 'AdminUserError',
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch admin user',
          details: adminError.message,
          type: 'AdminUserError',
        },
        { status: 500 }
      );
    }

    if (!adminUser) {
      //  console.log("❌ Admin user not found");
      return NextResponse.json(
        {
          error: 'Admin user not found',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // console.log("👤 Admin role:", adminUser.admin_role);

    // Handle non-coach admin users
    if (
      adminUser.admin_role !== 'coach' &&
      adminUser.admin_role !== 'internal_operator'
    ) {
      //   console.log("🔍 Fetching all challenges for admin...");
      const { data: challengeData, error } = await supabase.from('challenges')
        .select(`
          id,
          title,
          start_date,
          end_date,
          challenge_participants!inner (
            id,
            service_user_id
          )
        `);

      if (error) {
        console.error('❌ Error fetching challenges:', {
          error,
          code: error.code,
          details: error.details,
          type: 'ChallengeQueryError',
        });
        return NextResponse.json(
          {
            error: 'Failed to fetch challenges',
            details: error.message,
            type: 'ChallengeQueryError',
          },
          { status: 500 }
        );
      }

      if (!challengeData || challengeData.length === 0) {
        //    console.log("ℹ️ No challenges found");
        return NextResponse.json([]);
      }

      // Get all participant IDs
      const participantIds = challengeData.flatMap((challenge) =>
        challenge.challenge_participants.map((p) => p.service_user_id)
      );

      // Fetch user data for all participants
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, username')
        .in('id', participantIds);

      // Create user map for efficient lookup
      const userMap = new Map(userData?.map((user) => [user.id, user]) || []);

      // Enrich challenge data with user information
      const enrichedData = challengeData.map((challenge) => ({
        id: challenge.id,
        title: challenge.title,
        start_date: challenge.start_date,
        end_date: challenge.end_date,
        challenge_participants: challenge.challenge_participants.map((p) => ({
          id: p.id,
          service_user_id: p.service_user_id,
          user: userMap.get(p.service_user_id) || {
            id: p.service_user_id,
            name: 'Unknown',
            username: 'unknown',
          },
        })),
      }));

      // console.log("✅ Successfully fetched admin challenges");
      return NextResponse.json(enrichedData);
    }

    // Handle coach users
    //   console.log("🔍 Fetching coach data...");
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('admin_user_id', adminUser.id)
      .single();

    if (coachError) {
      console.error('❌ Coach Error:', {
        error: coachError,
        code: coachError.code,
        details: coachError.details,
        admin_id: adminUser.id,
        type: 'CoachQueryError',
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch coach data',
          details: coachError.message,
          type: 'CoachQueryError',
        },
        { status: 500 }
      );
    }

    if (!coach) {
      console.error('❌ No coach found for admin ID:', adminUser.id);
      return NextResponse.json(
        {
          error: 'Coach not found',
          type: 'NotFoundError',
        },
        { status: 404 }
      );
    }

    // Use the new database function
    // console.log("🔍 Fetching coach challenges using DB function...");
    const { data: challengeData, error: challengeError } = await supabase.rpc(
      'get_coach_challenges_grouped',
      {
        coach_uuid: coach.id,
      }
    );

    // Fetch coach's challenges and related data
    // console.log("🔍 Fetching coach challenges...");
    // const { data: challengeData, error: challengeError } = await supabase
    //   .from("challenge_coaches")
    //   .select(
    //     `
    //     id,
    //     challenges!inner (
    //       id,
    //       title,
    //       start_date,
    //       end_date,
    //       challenge_participants!inner (
    //         id,
    //         service_user_id
    //       )
    //     )
    //   `
    //   )
    //   .eq("coach_id", coach.id);

    if (challengeError) {
      console.error('❌ Error fetching coach challenges:', {
        error: challengeError,
        code: challengeError.code,
        details: challengeError.details,
        coach_id: coach.id,
        type: 'CoachChallengeQueryError',
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch coach challenges',
          details: challengeError.message,
          type: 'CoachChallengeQueryError',
        },
        { status: 500 }
      );
    }

    if (!challengeData || challengeData.length === 0) {
      //    console.log("ℹ️ No challenges found for coach");
      return NextResponse.json([]);
    }

    if (!challengeData || challengeData.length === 0) {
      //    console.log("ℹ️ No challenges found for coach");
      return NextResponse.json([]);
    }

    // Get all participant IDs
    //     const participantIds = challengeData.flatMap((challenge) =>
    //       challenge.challenges.challenge_participants.map((p) => p.service_user_id)
    //     );

    //     if (participantIds.length === 0) {
    //       console.log("ℹ️ No participants found in challenges");
    //       return NextResponse.json(
    //         challengeData.map((challenge) => ({
    //           id: challenge.challenges.id,
    //           title: challenge.challenges.title,
    //           start_date: challenge.challenges.start_date,
    //           end_date: challenge.challenges.end_date,
    //           challenge_participants: [],
    //         }))
    //       );
    //     }

    //     // Fetch user data for all participants
    //     const { data: userData } = await supabase
    //       .from("users")
    //       .select("id, name, username")
    //       .in("id", participantIds);

    //     // Create user map for efficient lookup
    //     const userMap = new Map(userData?.map((user) => [user.id, user]) || []);

    //     // Enrich challenge data
    //     const enrichedData = challengeData.map((challenge) => ({
    //       id: challenge.challenges.id,
    //       title: challenge.challenges.title,
    //       start_date: challenge.challenges.start_date,
    //       end_date: challenge.challenges.end_date,
    //       challenge_participants: challenge.challenges.challenge_participants.map(
    //         (p) => ({
    //           id: p.id,
    //           service_user_id: p.service_user_id,
    //           user: userMap.get(p.service_user_id) || {
    //             id: p.service_user_id,
    //             name: "Unknown",
    //             username: "unknown",
    //           },
    //         })
    //       ),
    //     }));

    // console.log("✅ Successfully fetched and enriched coach challenges");
    return NextResponse.json(challengeData);
  } catch (error) {
    console.error('❌ === Challenges API Error ===', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GlobalError',
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'GlobalError',
      },
      { status: 500 }
    );
  }
}
