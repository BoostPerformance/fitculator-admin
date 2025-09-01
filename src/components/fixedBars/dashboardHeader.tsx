'use client';
import React from 'react';
import SearchBar from './searchBar';
import AccountInfo from '../accountInfo';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminData } from '../hooks/useAdminData';

const DashboardHeader = ({ isOpen }: { isOpen: boolean }) => {
  const router = useRouter();
  const { displayUsername } = useAdminData();

  return (
    <header
      className={`fixed top-0 left-0 bg-white shadow-md flex justify-between items-end p-[1rem] z-50 transition-all duration-300 ${
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
      <AccountInfo username={displayUsername} avatarUrl="/image/logo-icon.png" />
    </header>
  );
};

export default DashboardHeader;
