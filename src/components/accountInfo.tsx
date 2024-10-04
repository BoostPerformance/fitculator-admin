'use client';
import React, { useState } from 'react';
import { FaBell, FaFlag } from 'react-icons/fa';

interface AccountInfoProps {
  username: string;
  avatarUrl: string;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ username, avatarUrl }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex items-center space-x-4">
      <button className="text-gray-500">
        <FaBell size={20} />
      </button>

      <button className="text-gray-500">
        <FaFlag size={20} />
      </button>

      <div className="relative">
        <button
          className="flex items-center space-x-2"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img
            src={avatarUrl}
            alt="User Avatar"
            className="w-8 h-8 rounded-full"
          />
          <span className="text-gray-700">{username}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
            <a
              href="#"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Profile
            </a>
            <a
              href="#"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Settings
            </a>
            <a
              href="#"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountInfo;
