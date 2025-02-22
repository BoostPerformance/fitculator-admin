'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/fixedBars/sidebar';

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [challenges, setChallenges] = useState<Challenges[]>([]);
  const [adminData, setAdminData] = useState({ admin_role: '', username: '' });
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
    const handleChallengeSelect = (challengeId: string) => {
    // 선택된 챌린지 찾기
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
    }
  };

  return (
    <div className="flex md:flex-col sm:flex-col h-screen">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        coach={adminData.username}
        selectedChallengeId={selectedChallengeId}
      />
      <main className="flex-1 px-[1rem] pt-[1.25rem] bg-white-1 dark:bg-blue-4">{ children }</main>
    </div>
  )
}