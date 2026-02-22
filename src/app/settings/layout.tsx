'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import type { ChallengeData } from '@/components/sidebar';
import { DesktopHeader } from '@/components/header/DesktopHeader';
import { useAdminData } from '@/components/hooks/useAdminData';
import { usePersistedSidebarOpen } from '@/components/hooks/useSidebarState';
import { useChallenge } from '@/components/hooks/useChallenges';

export default function SettingsLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
 const [isSidebarOpen, setIsSidebarOpen] = usePersistedSidebarOpen();

 const { adminData } = useAdminData();
 const { challenges } = useChallenge();

 const formattedChallenges: ChallengeData[] = challenges?.map((challenge) => ({
 challenges: {
 id: challenge.challenges.id,
 title: challenge.challenges.title,
 start_date: challenge.challenges.start_date,
 end_date: challenge.challenges.end_date,
 challenge_type: challenge.challenges.challenge_type,
 enable_benchmark: challenge.challenges.enable_benchmark,
 enable_mission: challenge.challenges.enable_mission,
 use_daily_programs: challenge.challenges.use_daily_programs,
 },
 })) || [];

 const handleChallengeSelect = (challengeId: string) => {
 const selectedChallenge = formattedChallenges.find(
 (challenge) => challenge.challenges.id === challengeId
 );
 if (selectedChallenge) setSelectedChallengeId(challengeId);
 };

 return (
 <div className="flex flex-col min-h-screen">
 <DesktopHeader isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
 <div className="flex md:flex-col sm:flex-col flex-1">
 <Sidebar
 data={formattedChallenges as any}
 onSelectChallenge={handleChallengeSelect}
 coach={adminData?.username}
 selectedChallengeId={selectedChallengeId}
 username={adminData?.username}
 isSidebarOpen={isSidebarOpen}
 onSidebarOpenChange={setIsSidebarOpen}
 />
 <main className="flex-1 px-4 py-5 sm:px-0 sm:py-0 bg-surface-app">
 {children}
 </main>
 </div>
 </div>
 );
}
