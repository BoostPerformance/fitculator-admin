'use client';
import Image from 'next/image';
//import { FaBars } from 'react-icons/fa';
import LogoutButton from '../buttons/logoutButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Challenge {
  id: string;
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

interface SidebarProps {
  data: Challenge[];
  onSelectChallenge: (challengeId: string) => void;
}

export default function Sidebar({ data, onSelectChallenge }: any) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  const handleDropdown = () => {
    return setIsOpenDropdown(!isOpenDropdown);
  };

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedTitle(challenge.challenges.title);
    onSelectChallenge(challenge.challenges.id);
  };

  return (
    <div className="bg-white drop-shadow-sm dark:bg-blue-4">
      <div className="flex flex-col gap-[2rem] items-start py-[3rem] lg:w-[22rem] md:w-[18rem] p-[2.3rem]">
        <div className="flex items-center justify-around gap-[1rem]">
          <a href="./user">
            <Image
              src="/svg/fitculator.svg"
              width={100}
              height={30}
              alt="logo"
              className={` w-[9rem] dark:invert`}
            />
          </a>
          <LogoutButton />
        </div>

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
                {data.map((item: any, index: any) => (
                  <div
                    key={`challenge-${index}`}
                    className={`w-[15rem] p-[1rem] text-gray-2 dark:text-white ${
                      selectedTitle === item.challenges.title
                        ? 'bg-gray-100'
                        : ''
                    }`}
                  >
                    <button
                      className=" lg:text-1.25-700"
                      onClick={() => handleChallengeClick(item)}
                    >
                      {item.challenges.title}
                    </button>
                    <ul className="flex flex-col gap-[0.3rem] py-[0.7rem]">
                      <li className="flex items-center gap-[0.5rem] px-[1rem] hover:bg-gray-3 text-1.25-700 sm:text-0.875-700">
                        <Image
                          src="/svg/subtitle-icon.svg"
                          width={20}
                          height={30}
                          alt="subtitle-icon "
                          className="w-[0.75rem]"
                        />
                        <Link href={`/user/${item.challenges.title}/diet`}>
                          식단
                        </Link>
                      </li>
                      <li className="flex items-center gap-[0.5rem]  px-[1rem] hover:bg-gray-3 text-1.25-700 sm:text-0.875-700">
                        <Image
                          src="/svg/subtitle-icon.svg"
                          width={20}
                          height={30}
                          alt="subtitle-icon "
                          className="w-[0.75rem]"
                        />
                        <Link href={`/user/${item.challenges.title}/exercise`}>
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
