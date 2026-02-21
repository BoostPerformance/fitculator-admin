'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import type { ChallengeData } from '@/components/sidebar';
import LogoutButton from '@/components/buttons/logoutButton';
import { useAdminData } from '@/components/hooks/useAdminData';
import { useChallenge } from '@/components/hooks/useChallenges';

export default function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
 const [userDropdown, setUserDropdown] = useState(false);

 const { adminData } = useAdminData();
 const { challenges } = useChallenge();

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

 const handleChallengeSelect = (challengeId: string) => {
 const selectedChallenge = formattedChallenges.find(
 (challenge) => challenge.challenges.id === challengeId
 );
 if (selectedChallenge) setSelectedChallengeId(challengeId);
 };

 return (
 <div className="relative min-h-screen">
 <div className="absolute right-8 top-4 z-50 hidden lg:flex md:hidden items-center gap-2">
 <div className="text-content-secondary text-body whitespace-nowrap">
 안녕하세요, {adminData?.username} !
 </div>
 <button
 onClick={() => setUserDropdown(!userDropdown)}
 className="flex items-center p-2 rounded-lg hover:bg-surface-raised transition-colors"
 >
 <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-content-secondary">
 <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 </button>
 {userDropdown && (
 <div className="absolute right-0 top-full mt-2 bg-surface rounded-lg shadow-elevation-2 border border-line px-4 py-2 z-50 min-w-[100px]">
 <LogoutButton />
 </div>
 )}
 </div>
 <div className="flex lg:flex-row md:flex-col sm:flex-col min-h-screen">
 <Sidebar
 data={formattedChallenges as any}
 onSelectChallenge={handleChallengeSelect}
 coach={adminData?.username}
 selectedChallengeId={selectedChallengeId}
 username={adminData?.username}
 />
 <main className="flex-1 bg-surface-app lg:px-4 lg:py-5 md:px-4 md:py-4 sm:px-0 sm:py-0">
 {children}
 </main>
 </div>
 </div>
 );
}
