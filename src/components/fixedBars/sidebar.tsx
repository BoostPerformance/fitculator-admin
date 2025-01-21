'use client';
import Image from 'next/image';
//import { FaBars } from 'react-icons/fa';

import { useState } from 'react';
import Link from 'next/link';

interface SidebarProps {
  onClick: () => void;
}

const challengesName = ['F45 을지로 C50챌린지', '핏다챌', '챌린지1', '챌린지2'];

export default function Sidebar({}: SidebarProps) {
  // const [isOpen, setIsOpen] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  // const handleOpen = () => {
  //   setIsOpen(!isOpen);
  // };

  const handleDropdown = () => {
    return setIsOpenDropdown(!isOpenDropdown);
  };

  return (
    <div className="bg-white drop-shadow-sm dark:bg-blue-4">
      <div className="flex flex-col gap-[2rem] items-start py-[3rem] lg:w-[22rem] md:w-[18rem] p-[2.3rem]">
        <a href="./user">
          <Image
            src="/svg/fitculator.svg"
            width={100}
            height={30}
            alt="logo"
            className={` w-[9rem] dark:invert`}
          />
        </a>

        <nav className="w-full">
          <div>
            <button
              onClick={handleDropdown}
              className="w-[17rem] flex items-center justify-between lg:text-1.5-900 border-b-[0.1rem]  border-gray-13 py-[0.8rem]"
            >
              챌린지
              {isOpenDropdown ? (
                <Image
                  src="/svg/arrow-down.svg"
                  width={20}
                  height={30}
                  alt="arrow-down "
                  className="w-[1rem] "
                />
              ) : (
                <Image
                  src="/svg/arrow-up.svg"
                  width={20}
                  height={30}
                  alt="arrow-up "
                  className="w-[1rem] "
                />
              )}
            </button>
            {isOpenDropdown && (
              <div>
                {challengesName.map((Challengename, index) => (
                  <div
                    key={`challenge-${index}`}
                    className="w-[15rem] p-[1rem] text-gray-2 dark:text-white"
                  >
                    <div className=" lg:text-1.25-700">{Challengename}</div>
                    <ul className="flex flex-col gap-[0.3rem] py-[0.7rem]">
                      <li className="flex items-center gap-[0.5rem] px-[1rem] hover:bg-gray-3 text-1.25-700 sm:text-0.875-700">
                        <Image
                          src="/svg/subtitle-icon.svg"
                          width={20}
                          height={30}
                          alt="subtitle-icon "
                          className="w-[0.75rem]"
                        />
                        <Link href={`/user/${Challengename}/diet`}>식단</Link>
                      </li>
                      <li className="flex items-center gap-[0.5rem]  px-[1rem] hover:bg-gray-3 text-1.25-700 sm:text-0.875-700">
                        <Image
                          src="/svg/subtitle-icon.svg"
                          width={20}
                          height={30}
                          alt="subtitle-icon "
                          className="w-[0.75rem]"
                        />
                        <Link href={`/user/${Challengename}/exercise`}>
                          운동
                        </Link>
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
