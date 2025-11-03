'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/fixedBars/sidebar';
import LogoutButton from '@/components/buttons/logoutButton';
import EditUsernameModal from '@/components/modals/editUsernameModal';
import { useAdminData } from '@/components/hooks/useAdminData';
import { ChallengeProvider, useChallengeContext } from '@/contexts/ChallengeContext';

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    challenge_type: 'diet' | 'exercise' | 'diet_and_exercise';
  };
}

function ChallengeLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [userDropdown, setUserDropdown] = useState(false);
  const [editUsernameModal, setEditUsernameModal] = useState(false);
  
  // React Query hooks 사용으로 API 호출 최적화
  const { adminData, fetchAdminData, displayUsername, isLoading, hasData } = useAdminData();
  const { challenges } = useChallengeContext();

  const handleUsernameUpdate = async (newUsername: string) => {
    const response = await fetch('/api/admin-users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: newUsername }),
    });

    if (!response.ok) {
      throw new Error('Failed to update username');
    }

    // 데이터 새로고침
    await fetchAdminData();
  };

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
        <div className={`text-gray-800 dark:text-white text-sm whitespace-nowrap ${isLoading ? 'animate-pulse' : ''}`}>
          안녕하세요, {displayUsername} !
        </div>
        <button
          onClick={() => setUserDropdown(!userDropdown)}
          className="flex items-center"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-gray-800 dark:text-white transition-transform duration-300 ease-in-out"
            style={{ transform: userDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {userDropdown && (
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden z-50 min-w-[120px] animate-in fade-in-0 zoom-in-95">
            <button
              onClick={() => {
                setEditUsernameModal(true);
                setUserDropdown(false);
              }}
              disabled={isLoading || !hasData}
              className="relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            >
              이름 수정
            </button>
            <LogoutButton />
          </div>
        )}
      </div>
      <div className="flex md:flex-col sm:flex-col min-h-screen">
        <Sidebar
          data={formattedChallenges}
          onSelectChallenge={handleChallengeSelect}
          coach={displayUsername}
          selectedChallengeId={selectedChallengeId}
          username={displayUsername}
        />
        <main id="main-content" className="flex-1 px-[1rem] py-[1.25rem] sm:px-0 sm:py-0 bg-white-1 dark:bg-blue-4" tabIndex={-1}>
          {children}
        </main>
      </div>

      <EditUsernameModal
        isOpen={editUsernameModal}
        currentUsername={adminData?.username || ''}
        onClose={() => setEditUsernameModal(false)}
        onSave={handleUsernameUpdate}
      />
    </div>
  );
}

export default function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChallengeProvider>
      <ChallengeLayoutContent>{children}</ChallengeLayoutContent>
    </ChallengeProvider>
  );
}