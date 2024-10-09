'use client';
import React, { useState } from 'react';
import { FaBell, FaFlag } from 'react-icons/fa';
// import { signOut } from 'next-auth/react';
import Image from 'next/image';
// import { redirect } from 'next/navigation';
import LogoutButton from './buttons/logoutButton';

interface AccountInfoProps {
  username: string;
  avatarUrl: string;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ username, avatarUrl }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex items-center space-x-[1rem]">
      <button className="text-gray-500">
        <FaBell size={20} className="sm:w-[1rem]" />
      </button>

      <button className="text-gray-500">
        <FaFlag size={20} className="sm:w-[1rem]" />
      </button>

      <div className="relative">
        <button
          className="flex items-center space-x-[0.5rem]"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <Image
            src={avatarUrl}
            alt="User Avatar"
            className="w-[2rem] h-[2rem] rounded-full sm:size-[1rem]"
            width={20}
            height={20}
          />
          <span className="text-gray-700 sm:text-0.625-500">{username}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-[0.5rem] w-[12rem] bg-white rounded-lg shadow-lg py-[0.5rem]">
            <a
              href="#"
              className="block px-[1rem] py-[0.5rem] text-gray-700 hover:bg-gray-100"
            >
              Profile
            </a>
            <a
              href="#"
              className="block px-[1rem] py-[0.5rem] text-gray-700 hover:bg-gray-100"
            >
              Settings
            </a>

            <LogoutButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountInfo;
