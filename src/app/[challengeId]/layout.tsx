'use client';
import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import type { ChallengeData } from '@/components/sidebar';
import { DesktopHeader } from '@/components/header/DesktopHeader';
import { useAdminData } from '@/components/hooks/useAdminData';
import { usePersistedSidebarOpen } from '@/components/hooks/useSidebarState';
import { ChallengeProvider, useChallengeContext } from '@/contexts/ChallengeContext';

function ChallengeLayoutContent({
 children,
}: {
 children: React.ReactNode;
}) {
 const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
 const [isSidebarOpen, setIsSidebarOpen] = usePersistedSidebarOpen();

 const params = useParams();
 const { displayUsername } = useAdminData();
 const { challenges } = useChallengeContext();

 const formattedChallenges: ChallengeData[] = challenges?.map((challenge) => ({
 challenges: {
 id: challenge.challenges.id,
 title: challenge.challenges.title,
 start_date: challenge.challenges.start_date,
 end_date: challenge.challenges.end_date,
 challenge_type: (challenge.challenges as any).challenge_type || 'diet_and_exercise',
 enable_benchmark: (challenge.challenges as any).enable_benchmark,
 enable_mission: (challenge.challenges as any).enable_mission,
 use_daily_programs: (challenge.challenges as any).use_daily_programs,
 },
 })) || [];

 const currentChallenge = useMemo(() => {
 const challengeId = params?.challengeId as string;
 return formattedChallenges.find((c) => c.challenges.id === challengeId);
 }, [params?.challengeId, formattedChallenges]);

 const challengeTitle = currentChallenge?.challenges.title;

 const challengeFlags = useMemo(() => {
 if (!currentChallenge) return undefined;
 return {
 challenge_type: currentChallenge.challenges.challenge_type,
 enable_benchmark: currentChallenge.challenges.enable_benchmark,
 enable_mission: currentChallenge.challenges.enable_mission,
 use_daily_programs: currentChallenge.challenges.use_daily_programs,
 };
 }, [currentChallenge]);

 const handleChallengeSelect = (challengeId: string) => {
 const selectedChallenge = formattedChallenges.find(
 (challenge) => challenge.challenges.id === challengeId
 );
 if (selectedChallenge) setSelectedChallengeId(challengeId);
 };

 return (
 <div className="flex flex-col min-h-screen">
 <DesktopHeader
 showEditUsername
 challengeTitle={challengeTitle}
 challengeFlags={challengeFlags}
 isSidebarOpen={isSidebarOpen}
 onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
 />
 <div className="flex md:flex-col sm:flex-col flex-1">
 <Sidebar
 data={formattedChallenges}
 onSelectChallenge={handleChallengeSelect}
 coach={displayUsername}
 selectedChallengeId={selectedChallengeId}
 username={displayUsername}
 isSidebarOpen={isSidebarOpen}
 onSidebarOpenChange={setIsSidebarOpen}
 />
 <main id="main-content" className="flex-1 min-w-0 overflow-x-auto px-4 py-5 sm:px-0 sm:py-0 bg-surface-app" tabIndex={-1}>
 {children}
 </main>
 </div>
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
