'use client';
import React from 'react';
import SearchBar from './searchBar';
import AccountInfo from '../accountInfo';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminData } from '../hooks/useAdminData';
import { useQuery } from '@tanstack/react-query';

const DashboardHeader = ({ isOpen }: { isOpen: boolean }) => {
 const router = useRouter();
 const { displayUsername } = useAdminData();

 const { data: coachIdentity } = useQuery({
 queryKey: ['coach-identity'],
 queryFn: async () => {
 const res = await fetch('/api/coach-identity');
 if (!res.ok) return null;
 const json = await res.json();
 return json.data as { userId: string; coachId: string; name: string; profileImageUrl: string | null } | null;
 },
 staleTime: Infinity,
 });

 return (
 <header
 className={`fixed top-0 left-0 bg-surface shadow-md flex justify-between items-end p-[1rem] z-50 transition-all duration-300 ${
 isOpen ? 'ml-[8rem] lg:w-[93%] md:w-[88%] sm:w-[88%]' : 'ml-0'
 } w-full`}
 >
 <button onClick={() => router.push('/')}>
 <Image
 src="/svg/fitculator.svg"
 alt="fitculator logo"
 width={120}
 height={120}
 className="p-[0.5rem] sm:w-[5rem]"
 />
 </button>
 <SearchBar />
 <AccountInfo username={displayUsername} avatarUrl={coachIdentity?.profileImageUrl || null} />
 </header>
 );
};

export default DashboardHeader;
