'use client';
import React, { useState } from 'react';
import { FaBell, FaFlag } from 'react-icons/fa';
import LogoutButton from './buttons/logoutButton';

interface AccountInfoProps {
 username: string;
 avatarUrl: string | null;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ username, avatarUrl }) => {
 const [dropdownOpen, setDropdownOpen] = useState(false);

 return (
 <div className="flex items-center space-x-[1rem]">
 <button className="text-content-tertiary">
 <FaBell size={20} className="sm:w-[1rem]" />
 </button>

 <button className="text-content-tertiary">
 <FaFlag size={20} className="sm:w-[1rem]" />
 </button>

 <div className="relative">
 <button
 className="flex items-center space-x-[0.5rem]"
 onClick={() => setDropdownOpen(!dropdownOpen)}
 >
 {avatarUrl ? (
 <img
 src={avatarUrl}
 alt="User Avatar"
 className="w-[2rem] h-[2rem] rounded-full object-cover sm:size-[1rem]"
 />
 ) : (
 <div className="w-[2rem] h-[2rem] sm:size-[1rem] rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
 <span className="text-[12px] sm:text-[8px] font-medium text-blue-600 dark:text-blue-300">
  {username?.charAt(0) || '?'}
 </span>
 </div>
 )}
 <span className="text-content-secondary sm:text-label-xs font-medium">{username}</span>
 </button>

 {dropdownOpen && (
 <div className="absolute right-0 mt-[0.5rem] w-[12rem] bg-surface rounded-lg shadow-lg py-[0.5rem]">
 <a
 href="#"
 className="block px-[1rem] py-[0.5rem] text-content-secondary hover:bg-surface-raised"
 >
 Profile
 </a>
 <a
 href="#"
 className="block px-[1rem] py-[0.5rem] text-content-secondary hover:bg-surface-raised"
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
