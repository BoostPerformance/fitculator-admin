import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { Coach, ChallengeCoachData, CoachData } from "@/types/coachTypes";
import { ChallengeParticipant } from "@/types/challengeTypes";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, admin_role, organization_id, username")
      .eq("email", session.user.email)
      .single();
    // console.log("adminUser", adminUser);
    if (adminError) {
      throw adminError;
    }

    // 코치가 아닌 경우 기본 정보만 반환
    if (adminUser.admin_role !== "coach") {
      return NextResponse.json({
        username: adminUser.username,
        admin_role: adminUser.admin_role,
      });
    }
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select(
        `
    id,
    admin_user_id,
    organization_id,
    profile_image_url,
    admin_users!admin_user_id ( 
      username,
      email,
      organizations!organization_id ( 
        id,
        name
      )
    ),
    challenge_coaches (
      challenges!challenge_id (  
        id,
        title,
        challenge_participants (
          id,
          status
        )
      )
    )
  `
      )
      .eq("admin_user_id", adminUser.id)
      .single();

    if (coachError) {
      throw coachError;
    }

    // 상세 데이터 구조 로깅
    // console.log("=== Coach Data Structure ===");
    // console.log("Full coach data:", JSON.stringify(coach, null, 2));
    // console.log(
    //   "challenge_coaches structure:",
    //   JSON.stringify(coach.challenge_coaches, null, 2)
    // );
    if (coach.challenge_coaches?.length > 0) {
      // console.log(
      //   "First challenge_coach structure:",
      //   JSON.stringify(coach.challenge_coaches[0], null, 2)
      // );
      // console.log(
      //   "First challenge structure:",
      //   JSON.stringify(coach.challenge_coaches[0].challenges, null, 2)
      // );
    }

    // 데이터 변환 시도 전 타입 체크
    console.log("=== Type Checks ===");
    console.log(
      "Is challenge_coaches array?",
      Array.isArray(coach.challenge_coaches)
    );
    console.log("challenge_coaches length:", coach?.challenge_coaches?.length);

    // 받아온 데이터 구조 변환 (Coach 타입에 맞춤)
    const formattedData: CoachData = {
      id: coach.id,
      admin_user_id: coach.admin_user_id,
      organization_id: coach.organization_id,
      organization_name: coach.admin_users?.[0]?.organizations?.[0]?.name || "",
      username: coach.admin_users?.[0]?.username || "",
      profile_image_url: coach.profile_image_url,
      challenges: (coach.challenge_coaches || []).flatMap(
        (cc: { challenges: any }) => {
          // challenges가 배열인 경우
          if (Array.isArray(cc.challenges)) {
            return cc.challenges.map((challenge) => ({
              id: challenge.id,
              title: challenge.title,
              participants: (challenge.challenge_participants || []).map(
                (p: ChallengeParticipant) => ({
                  id: p.id,
                  status: p.status,
                })
              ),
            }));
          }
          // challenges가 단일 객체인 경우
          if (cc.challenges && typeof cc.challenges === "object") {
            return [
              {
                id: cc.challenges.id,
                title: cc.challenges.title,
                participants: (cc.challenges.challenge_participants || []).map(
                  (p: ChallengeParticipant) => ({
                    id: p.id,
                    status: p.status,
                  })
                ),
              },
            ];
          }
          // challenges가 없는 경우
          return [];
        }
      ),
    };

    return NextResponse.json(formattedData);
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
