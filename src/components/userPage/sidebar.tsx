'use client';
import { useState } from 'react';
import { FaBars } from 'react-icons/fa';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`flex ${
        isOpen ? 'w-[13rem]' : 'w-0'
      } dark:bg-gray-800 border-[0.1rem] text-1.5-500 drop-shadow-md min-h-screen transition-all duration-300 pt-[6rem] fixed`}
    >
      <div className="flex flex-col justify-between h-full text-blue-4 dark:text-white">
        <div>
          <button
            className="p-4 focus:outline-none flex items-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaBars />
          </button>
          <nav
            className={`${
              isOpen ? 'block' : 'hidden'
            } transition-all duration-300`}
          >
            <ul>
              <li className="px-4 py-2 hover:bg-gray-600">
                <a href="#">Dashboard</a>
              </li>
              <li className="px-4 py-2 hover:bg-gray-600">
                <a href="#">Payout</a>
              </li>
              <li className="px-4 py-2 hover:bg-gray-600">
                <a href="#">Inbox</a>
              </li>
              <li className="px-4 py-2 hover:bg-gray-600">
                <a href="#">Settings</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
