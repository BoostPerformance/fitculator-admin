"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Sidebar from "@/components/fixedBars/sidebar";
import { useDietData } from "@/components/hooks/useDietData";
import { DietStatistics } from "@/components/statistics/dietStatistics";
import { DietContent } from "@/components/dietDashboard/dietContent";
import { useResponsive } from "@/components/hooks/useResponsive";
import { useChallenge } from "@/components/hooks/useChallenges";
import { processMeals } from "@/components/utils/processMeals";

export default function DietItem() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");
  const today = new Date().toISOString().split("T")[0];
  console.log("[Diet Page] Date info:", {
    today,
    urlDate,
    currentTime: new Date().toISOString(),
  });
  const [selectedDate, setSelectedDate] = useState<string>(urlDate || today);
  const {
    dietRecords,
    loading: dietLoading,
    error: dietError,
  } = useDietData(params.challengeId as string, selectedDate);
  const { isMobile } = useResponsive();
  const {
    challenges,
    selectedChallengeId: currentChallengeId,
    fetchChallenges,
    loading: challengesLoading,
  } = useChallenge();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [challengeError, setChallengeError] = useState<string | null>(null);

  const handleSelectChallenge = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
  };

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        await fetchChallenges();
        setChallengeError(null);
      } catch (err) {
        setChallengeError("챌린지 정보를 불러오는데 실패했습니다.");
        console.error("Failed to fetch challenges:", err);
      }
    };
    loadChallenges();
  }, [fetchChallenges]);

  useEffect(() => {
    if (urlDate) {
      setSelectedDate(urlDate);
      const row = document.querySelector(`[data-date="${urlDate}"]`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.add("bg-yellow-50");
        setTimeout(() => row.classList.remove("bg-yellow-50"), 3000);
      }
    }
  }, [urlDate]);

  if (challengeError) {
    return <div className="p-4 text-red-500">{challengeError}</div>;
  }

  if (challengesLoading) {
    return <div className="p-4">챌린지 정보를 불러오는 중...</div>;
  }

  if (!challenges) {
    return <div className="p-4">챌린지 정보가 없습니다.</div>;
  }

  return (
    <div className="flex">
      <Sidebar
        data={challenges || []}
        onSelectChallenge={handleSelectChallenge}
        selectedChallengeId={params.challengeId as string}
      />
      <div className="flex-1 p-4">
        {dietLoading ? (
          <div className="p-4">데이터를 불러오는 중...</div>
        ) : dietError ? (
          <div className="p-4 text-red-500">{dietError}</div>
        ) : !dietRecords || dietRecords.length === 0 ? (
          <div className="p-4">식단 기록이 없습니다.</div>
        ) : (
          <>
            <DietStatistics processedMeals={dietRecords} />
            <DietContent
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              challengeDates={{
                startDate: dietRecords[0]?.daily_records.record_date || "",
                endDate:
                  dietRecords[dietRecords.length - 1]?.daily_records
                    .record_date || "",
              }}
              filteredByDate={dietRecords}
              mobileSize={isMobile}
              loading={dietLoading}
              challengeId={params.challengeId as string}
            />
          </>
        )}
      </div>
    </div>
  );
}
