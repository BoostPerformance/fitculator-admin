"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function User() {
  const router = useRouter();

  useEffect(() => {
    const fetchFirstChallenge = async () => {
      try {
        const response = await fetch("/api/challenges");
        if (!response.ok) {
          throw new Error("Failed to fetch challenges");
        }
        const challengesData = await response.json();

        if (challengesData && challengesData.length > 0) {
          // 가장 최근 챌린지로 리다이렉션
          const sortedChallenges = challengesData.sort(
            (a: any, b: any) =>
              new Date(b.challenges.start_date).getTime() -
              new Date(a.challenges.start_date).getTime()
          );

          router.push(`/user/${sortedChallenges[0].challenges.id}`);
        }
      } catch (error) {
        console.error("Error fetching first challenge:", error);
      }
    };

    fetchFirstChallenge();
  }, [router]);

  return null; // 리다이렉션 중에는 아무것도 렌더링하지 않음
}
