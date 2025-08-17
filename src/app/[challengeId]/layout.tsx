'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/fixedBars/sidebar';
import LogoutButton from '@/components/buttons/logoutButton';
import { useAdminData } from '@/components/hooks/useAdminData';
import { useChallenge } from '@/components/hooks/useChallenges';

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    challenge_type: 'diet' | 'exercise' | 'diet_and_exercise';
  };
}

export default function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [userDropdown, setUserDropdown] = useState(false);
  
  // React Query hooks 사용으로 API 호출 최적화
  const { adminData } = useAdminData();
  const { challenges } = useChallenge();

  // 챌린지 데이터를 기존 인터페이스에 맞게 변환
  const formattedChallenges: Challenges[] = challenges?.map((challenge) => ({
    challenges: {
      id: challenge.challenges.id,
      title: challenge.challenges.title,
      start_date: challenge.challenges.start_date,
      end_date: challenge.challenges.end_date,
      challenge_type: (challenge.challenges as any).challenge_type || 'diet_and_exercise',
      enable_benchmark: (challenge.challenges as any).enable_benchmark,
      enable_mission: (challenge.challenges as any).enable_mission,
    },
  })) || [];
  
  const handleChallengeSelect = (challengeId: string) => {
    // 선택된 챌린지 찾기
    const selectedChallenge = formattedChallenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
    }
  };

  return (
    <div className="relative">
      <div className="absolute right-8 top-4 z-50 hidden lg:flex md:hidden items-center gap-2">
        <div className="text-gray-500 text-sm whitespace-nowrap">
          안녕하세요, {adminData?.username} !
        </div>
        <button
          onClick={() => setUserDropdown(!userDropdown)}
          className="flex items-center"
        >
          <Image
            src="/svg/arrow-down.svg"
            width={20}
            height={20}
            alt="arrow-down"
            className="w-[0.8rem]"
          />
        </button>
        {userDropdown && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-md px-4 py-2 z-50 min-w-[100px]">
            <LogoutButton />
          </div>
        )}
      </div>
      <div className="flex md:flex-col sm:flex-col min-h-screen">
        <Sidebar
          data={formattedChallenges}
          onSelectChallenge={handleChallengeSelect}
          coach={adminData?.username}
          selectedChallengeId={selectedChallengeId}
          username={adminData?.username}
        />
        <main className="flex-1 px-[1rem] py-[1.25rem] sm:px-0 sm:py-0 bg-white-1 dark:bg-blue-4">
          {children}
        </main>
      </div>
    </div>
  );
}