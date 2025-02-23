"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TrafficSourceChart from "@/components/graph/trafficSourceChart";
import LogoutButton from "@/components/buttons/logoutButton";
import DailyDietRecord from "@/components/graph/dailyDietRecord";
import WorkoutLeaderboard from "@/components/graph/workoutLeaderboard";
import DietTable from "@/components/dietDashboard/dietTable";
import TotalFeedbackCounts from "@/components/totalCounts/totalFeedbackCount";
import Title from "@/components/layout/title";
import Sidebar from "@/components/fixedBars/sidebar";
import { useParams } from "next/navigation";
import { ChallengeDashboardSkeleton } from "@/components/layout/skeleton";
import {
  calculateTodayDietUploads,
  calculateTotalDietUploads,
} from "@/components/statistics/challengeParticipantsDietStatics";

interface AdminUser {
  email: string;
  username: string;
}

interface Challenge {
  id: string;
  title: string;
  participants: Array<any>;
}

interface CoachData {
  id: string;
  admin_user_id: string;
  organization_id: string;
  organization_name: string;
  profile_image_url: string | null;
  introduction: string;
  specialization: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admin_users: AdminUser;
  challenge_coaches: Array<{ challenge: Challenge }>;
}

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

type ParamsType = {
  challengeId: string;
};

const calculateChallengeProgress = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  // 전체 챌린지 기간 계산
  const totalDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 오늘까지의 진행 일수 계산
  let progressDays;
  if (today < start) {
    progressDays = 0;
  } else if (today > end) {
    progressDays = totalDays;
  } else {
    progressDays = Math.ceil(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    progressDays: progressDays.toString(),
    totalDays: totalDays.toString(),
  };
};

export default function User() {
  const params = useParams() as ParamsType;
  const [workoutCount, setWorkoutCount] = useState(0);
  const [workOutCountToday, setWorkOutCountToday] = useState<number>(0);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [challenges, setChallenges] = useState<Challenges[]>([]);
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태를 true로 설정
  const [isMobile, setIsMobile] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [adminData, setAdminData] = useState({
    admin_role: "",
    username: "",
  });
  const [coachData, setCoachData] = useState<CoachData>({
    id: "",
    admin_user_id: "",
    organization_id: "",
    organization_name: "",
    profile_image_url: "",
    introduction: "",
    specialization: [],
    is_active: false,
    created_at: "",
    updated_at: "",
    admin_users: {
      email: "",
      username: "",
    },
    challenge_coaches: [],
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // 초기 설정
    handleResize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener("resize", handleResize);

    const fetchData = async () => {
      try {
        setLoading(true); // 데이터 로딩 시작
        // 오늘 운동한 멤버 수 조회
        const workoutCountResponse = await fetch(
          `/api/workouts?type=today-count&challengeId=${params.challengeId}`
        );
        if (!workoutCountResponse.ok) {
          throw new Error("Failed to fetch workout count");
        }
        const workoutCountData = await workoutCountResponse.json();
        setWorkOutCountToday(workoutCountData.count);

        // 챌린지 데이터 가져오기
        const challengesResponse = await fetch("/api/challenges");
        if (!challengesResponse.ok) {
          throw new Error("Failed to fetch challenges");
        }
        const challengesData = await challengesResponse.json();

        const sortedChallenges = challengesData.sort(
          (a: Challenges, b: Challenges) => {
            return (
              new Date(b.challenges.start_date).getTime() -
              new Date(a.challenges.start_date).getTime()
            );
          }
        );

        setChallenges(sortedChallenges);
        // 첫 번째 챌린지를 기본값으로 설정
        if (sortedChallenges.length > 0) {
          setSelectedChallengeId(sortedChallenges[0].challenges.id);
        }

        // 코치 데이터 가져오기
        const coachResponse = await fetch("/api/coach-info");
        if (!coachResponse.ok) {
          throw new Error("Failed to fetch coach data");
        }
        const coachData = await coachResponse.json();
        setCoachData(coachData);

        // 어드민 데이터 가져오기
        const adminResponse = await fetch("/api/admin-users");
        if (!adminResponse.ok) {
          throw new Error("Failed to fetch admin data");
        }
        const adminData = await adminResponse.json();
        setAdminData(adminData);

        // 데일리레코드(테이블 정보) 가져오기
        await fetchDailyRecords(1);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); // 데이터 로딩 완료
      }
    };

    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, [params.challengeId]);

  const fetchDailyRecords = async (pageNum: number) => {
    try {
      setLoading(true);
      const url = new URL(
        "/api/challenge-participants",
        window.location.origin
      );
      url.searchParams.append("page", pageNum.toString());
      url.searchParams.append("limit", "30");

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch daily-records data");
      }
      const data = await response.json();

      if (pageNum === 1) {
        setDailyRecords(data.data);
      } else {
        setDailyRecords((prev) => [...prev, ...data.data]);
      }

      return data.data.length > 0;
    } catch (error) {
      console.error("Error fetching daily records:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async (nextPage: number) => {
    const hasMore = await fetchDailyRecords(nextPage);
    if (hasMore) {
      setPage(nextPage);
    }
  };

  useEffect(() => {
    const urlChallengeId = params.challengeId;

    if (
      urlChallengeId &&
      challenges.some((c) => c.challenges.id === urlChallengeId)
    ) {
      setSelectedChallengeId(urlChallengeId);
    }
  }, [challenges, params.challengeId]);

  // 챌린지 ID가 변경될 때마다 운동 업로드 멤버 수 업데이트
  useEffect(() => {
    const fetchWorkoutCount = async () => {
      try {
        const response = await fetch(
          `/api/workouts?type=today-count&challengeId=${selectedChallengeId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch workout count");
        }
        const data = await response.json();
        setWorkOutCountToday(data.count);
      } catch (error) {
        console.error("Error fetching workout count:", error);
      }
    };

    if (selectedChallengeId) {
      fetchWorkoutCount();
    }
  }, [selectedChallengeId]);

  const handleChallengeSelect = (challengeId: string) => {
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
    }
  };

  const filteredDailyRecordsbyId = Array.isArray(dailyRecords)
    ? dailyRecords.filter(
        (record) => record.challenges.id === selectedChallengeId
      )
    : [];

  const getSelectedChallengeDates = () => {
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === selectedChallengeId
    );
    return selectedChallenge
      ? {
          startDate: selectedChallenge.challenges.start_date,
          endDate: selectedChallenge.challenges.end_date,
        }
      : null;
  };

  const challengeDates = getSelectedChallengeDates();
  const progress = challengeDates
    ? calculateChallengeProgress(
        challengeDates.startDate,
        challengeDates.endDate
      )
    : { progressDays: "0", totalDays: "0" };

  // 로딩 중일 때 스켈레톤 UI 표시
  if (loading) {
    return <ChallengeDashboardSkeleton />;
  }

  return (
    <div className="bg-white-1 dark:bg-blue-4 flex flex-col h-screen overflow-hidden sm:px-[1rem] md:px-[0.4rem]">
      <div className="flex justify-end pr-[2rem]">
        <div className="flex items-center gap-2">
          {/* <div className="text-gray-700">안녕하세요, {adminData.username}</div>
          <div className="relative">
            <button onClick={() => setUserDropdown(!userDropdown)}>
              <Image
                src="/svg/arrow-down.svg"
                width={20}
                height={20}
                alt="arrow-down"
                className="w-[0.8rem]"
              />
            </button>
            {userDropdown && (
              <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-md px-4 py-2 z-50 min-w-[100px]">
                <LogoutButton />
              </div>
            )}
          </div> */}
        </div>
      </div>
      <div className="flex gap-[1rem] flex-1 sm:flex-col md:flex-col">
        <Sidebar
          data={challenges}
          onSelectChallenge={handleChallengeSelect}
          coach={adminData.username}
          selectedChallengeId={selectedChallengeId}
        />
        <main className="flex-1 overflow-auto">
          <div className="pt-[2rem]">
            <div className="flex items-center justify-between px-1 pr-8">
              <Title
                title={
                  challenges.find(
                    (challenge) =>
                      challenge.challenges.id === selectedChallengeId
                  )?.challenges.title || ""
                }
              />
              <div className="flex items-center gap-2">
                <div className="text-gray-500">
                  안녕하세요, {adminData.username} !
                </div>
                <div className="relative">
                  <button onClick={() => setUserDropdown(!userDropdown)}>
                    <Image
                      src="/svg/arrow-down.svg"
                      width={20}
                      height={20}
                      alt="arrow-down"
                      className="w-[0.8rem]"
                    />
                  </button>
                  {userDropdown && (
                    <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-md px-4 py-2 z-50 min-w-[100px]">
                      <LogoutButton />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 px-1 pr-8 sm:grid-cols-1">
              <TotalFeedbackCounts
                counts={progress.progressDays}
                total={`${progress.totalDays}일`}
                title="진행현황"
                borderColor="border-green"
                textColor="text-green"
              />
              <TotalFeedbackCounts
                counts={`${workOutCountToday}`}
                total={`${
                  dailyRecords.filter(
                    (record) => record.challenges.id === selectedChallengeId
                  ).length
                }명`}
                title={
                  <span>
                    오늘 운동 <br className="md:inline sm:hidden lg:hidden" />
                    업로드 멤버
                  </span>
                }
                borderColor="border-blue-5"
                textColor="text-blue-5"
              />
              <TotalFeedbackCounts
                counts={
                  calculateTodayDietUploads(
                    dailyRecords,
                    challenges,
                    selectedChallengeId
                  ).counts
                }
                total={
                  calculateTodayDietUploads(
                    dailyRecords,
                    challenges,
                    selectedChallengeId
                  ).total
                }
                title={
                  <span>
                    오늘 식단 <br className="md:inline sm:hidden lg:hidden" />
                    업로드 멤버
                  </span>
                }
                borderColor="border-yellow"
                textColor="text-yellow"
              />
            </div>

            <div className="dark:bg-blue-4 grid grid-cols-6 gap-[1rem] my-6 sm:flex sm:flex-col px-1 pr-8">
              <TrafficSourceChart challengeId={selectedChallengeId} />
              <DailyDietRecord activities={filteredDailyRecordsbyId} />
              <WorkoutLeaderboard challengeId={selectedChallengeId} />
            </div>
            <div className="dark:bg-blue-4 bg-gray-100 lg:pt-[3rem] sm:pt-[2rem] bg-white-1 px-1 pr-8">
              <DietTable
                dailyRecordsData={filteredDailyRecordsbyId}
                challengeId={selectedChallengeId}
                onLoadMore={handleLoadMore}
                loading={loading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
