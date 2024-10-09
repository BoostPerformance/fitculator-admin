'use client';

import { FaBars } from 'react-icons/fa';

interface SidebarProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function Sidebar({ onClick, isOpen }: SidebarProps) {
  return (
    <div
      className={`flex bg-white z-50 ${
        isOpen
          ? 'lg:w-[8rem] md:w-[8rem] sm:w-[6rem] drop-shadow-md border-[0.1rem]'
          : 'w-0 '
      } sm:w-[0rem] md:w-[13rem] dark:bg-gray-800  min-h-screen transition-all duration-300 pt-[6rem] fixed z-50`}
    >
      <div className="flex flex-col justify-between h-full text-blue-4 dark:text-white">
        <div>
          <button
            className="p-[1rem] focus:outline-none flex items-center"
            onClick={onClick}
          >
            <FaBars className="w-[1rem]" />
          </button>
          <nav
            className={`${
              isOpen ? 'block' : 'hidden'
            } transition-all duration-300`}
          >
            <ul>
              <li className="px-[1rem] py-[0.5rem] hover:bg-gray-600 text-1-500 sm:text-0.75-500">
                <a href="#">Dashboard</a>
              </li>
              <li className="px-[1rem] py-[0.5rem] hover:bg-gray-600 text-1-500 sm:text-0.75-500">
                <a href="#">Payout</a>
              </li>
              <li className="px-[1rem] py-[0.5rem] hover:bg-gray-600 text-1-500 sm:text-0.75-500">
                <a href="#">Inbox</a>
              </li>
              <li className="px-[1rem] py-[0.5rem] hover:bg-gray-600 text-1-500 sm:text-0.75-500">
                <a href="#">Settings</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
