import React from 'react';
import SearchBar from './searchBar';
import AccountInfo from '../accountInfo';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const DashboardHeader: React.FC = () => {
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md flex justify-between items-center p-4 z-50 ">
      <button onClick={() => router.push('/')}>
        <Image
          src="/image/logo-icon.png
      "
          alt=""
          width={50}
          height={50}
          className="p-[0.5rem]"
        />
      </button>
      <SearchBar />
      <AccountInfo
        username="User"
        avatarUrl="https://randomuser.me/api/portraits/men/32.jpg"
      />
    </header>
  );
};

export default DashboardHeader;
