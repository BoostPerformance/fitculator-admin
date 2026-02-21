'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import type { ChallengeData } from '@/components/sidebar';
import LogoutButton from '@/components/buttons/logoutButton';
import EditUsernameModal from '@/components/modals/editUsernameModal';
import { useAdminData } from '@/components/hooks/useAdminData';
import { ChallengeProvider, useChallengeContext } from '@/contexts/ChallengeContext';

function ChallengeLayoutContent({
 children,
}: {
 children: React.ReactNode;
}) {
 const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
 const [userDropdown, setUserDropdown] = useState(false);
 const [editUsernameModal, setEditUsernameModal] = useState(false);

 const { adminData, fetchAdminData, displayUsername, isLoading, hasData } = useAdminData();
 const { challenges } = useChallengeContext();

 const handleUsernameUpdate = async (newUsername: string) => {
 const response = await fetch('/api/admin-users', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ username: newUsername }),
 });
 if (!response.ok) throw new Error('Failed to update username');
 await fetchAdminData();
 };

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
 <div className="relative">
 {/* Desktop user dropdown */}
 <div className="absolute right-8 top-4 z-50 hidden lg:flex md:hidden items-center gap-2">
 <div className={`text-content-secondary text-body whitespace-nowrap ${isLoading ? 'animate-pulse' : ''}`}>
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
 className="text-content-secondary transition-transform duration-300 ease-in-out"
 style={{ transform: userDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
 >
 <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 </button>
 {userDropdown && (
 <div className="absolute right-0 top-full mt-2 bg-surface border border-line rounded-md shadow-elevation-2 overflow-hidden z-50 min-w-[120px] animate-in fade-in-0 zoom-in-95">
 <button
 onClick={() => {
 setEditUsernameModal(true);
 setUserDropdown(false);
 }}
 disabled={isLoading || !hasData}
 className="relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-body outline-none transition-colors hover:bg-surface-raised text-content-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
 <main id="main-content" className="flex-1 min-w-0 overflow-x-auto px-4 py-5 sm:px-0 sm:py-0 bg-surface-app" tabIndex={-1}>
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
