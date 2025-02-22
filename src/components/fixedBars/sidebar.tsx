"use client";
import Image from "next/image";
//import { FaBars } from 'react-icons/fa';
import LogoutButton from "../buttons/logoutButton";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

interface SidebarProps {
  data: Challenges[];
  onSelectChallenge: (challengeId: string) => void;
  onSelectChallengeTitle?: (challengeId: string) => void;
  coach?: string;
  selectedChallengeId?: string;
}

export default function Sidebar({
  data,
  onSelectChallenge,
  onSelectChallengeTitle,
  selectedChallengeId,
  coach,
}: SidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [userDropdown, setUserDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const selectedChallenge = data.find(
      (item) => item.challenges.id === selectedChallengeId
    );
    if (selectedChallenge) {
      setSelectedTitle(selectedChallenge.challenges.title);
      setIsOpenDropdown(true); // 챌린지가 선택되었을 때 드롭다운 열기
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 1025;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // 모바일이 아닐 때는 열려있게
    };

    // 초기 실행
    handleResize();

    // 리사이즈 이벤트 리스너
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedChallengeId, data]);

  const handleDropdown = () => {
    return setIsOpenDropdown(!isOpenDropdown);
  };

  const handleSidebarOpen = () => {
    setIsSidebarOpen(!isSidebarOpen);

    if (!isSidebarOpen) {
      setUserDropdown(false);
    }
  };

  const handleUserDropdown = () => {
    setUserDropdown(!userDropdown);

    if (!userDropdown) {
      setIsSidebarOpen(false);
    }
  };

  const handleChallengeClick = (challenge: Challenges) => {
    setSelectedTitle(challenge.challenges.title);
    onSelectChallenge(challenge.challenges.id);
    // console.log('challenge.challenges.id', challenge.challenges.id);
    router.push(`/user/${challenge.challenges.id}`);
  };

  return (
    <div className="sm:relative top-0 z-40">
      <div className="sticky flex justify-end sm:justify-between md:justify-between py-[1.25rem] px-[1.5rem] lg:gap-[1rem] lg:w-[15rem]">
        <button
          onClick={handleSidebarOpen}
          className={`${isMobile ? "" : "hidden"}`}
        >
          <Image
            src="/svg/hamburger.svg"
            width={30}
            height={30}
            alt="logo"
            className={` w-[1.5rem] dark:invert`}
          />
        </button>
      </div>

      {(isSidebarOpen || !isMobile) && (
        <div
          className={` bg-white drop-shadow-sm dark:bg-blue-4 sm:w-full sm:flex sm:items-center sm:justify-center lg:h-full z-50 md:w-full md:items-center md:flex md:border lg:w-[15rem] md:justify-start`}
        >
          <div className=" flex flex-col gap-[2rem] items-start py-[3rem] lg:w-[15rem] md:w-[18rem] p-[2.3rem] sm:items-center md:py-[1rem]  md:pb-[2rem]">
            <nav className="w-full">
              <div className="relative">
                <button
                  onClick={handleDropdown}
                  className="w-[11rem] flex items-center justify-between lg:text-1.25-900 border-b-[0.1rem] border-gray-13 py-[0.8rem] sm:w-full sm:gap-[1rem] sm:justify-center sm:text-1.125-500 cursor-pointer"
                >
                  챌린지
                  {isOpenDropdown ? (
                    <Image
                      src="/svg/arrow-down.svg"
                      width={20}
                      height={30}
                      alt="arrow-down "
                      className="w-[1rem] lg:w-[0.8rem]"
                      onClick={handleDropdown}
                    />
                  ) : (
                    <Image
                      src="/svg/arrow-up.svg"
                      width={20}
                      height={30}
                      alt="arrow-up "
                      className="w-[1rem]  lg:w-[0.8rem]"
                      onClick={handleDropdown}
                    />
                  )}
                </button>
                {isOpenDropdown && (
                  <div className="relative lg:relative md:fixed md:left-0 md:right-0 md:bg-white md:w-full md:z-50 md:mt-0 sm:h-screen sm:w-full sm:gap-[1rem] sm:justify-center sm:text-1.125-500">
                    <div className=" md:flex md:flex-col md:items-start md:pl-6">
                      {data.map((item: any, index: number) => (
                        <div
                          key={`challenge-${index}`}
                          className="w-[11rem] md:w-[12rem] p-[1rem] text-gray-2 dark:text-white"
                        >
                          <div className="flex flex-col gap-2">
                            <button
                              className="lg:text-1-700 text-left hover:bg-gray-3"
                              onClick={() => handleChallengeClick(item)}
                            >
                              {item.challenges.title}
                            </button>
                          </div>
                          <ul className="flex flex-col gap-[0.3rem] py-[0.7rem]">
                            <li className="flex items-center gap-[0.5rem] px-[1rem] hover:bg-gray-3 text-1.25-700 sm:text-0.875-700">
                              <Image
                                src="/svg/subtitle-icon.svg"
                                width={20}
                                height={30}
                                alt="subtitle-icon"
                                className="w-[0.75rem]"
                              />
                              <Link
                                href={`/user/${item.challenges.id}/diet`}
                                onClick={() => {
                                  setSelectedTitle(item.challenges.title);
                                  onSelectChallenge(item.challenges.id);
                                  setIsOpenDropdown(true);
                                }}
                                className="lg:text-1-700 md:text-1.125-500 sm:text-1-500"
                              >
                                식단
                              </Link>
                            </li>
                            {/* <li className="flex items-center gap-[0.5rem] px-[1rem] hover:bg-gray-3 text-1.25-700 sm:text-0.875-700">
                              <Image
                                src="/svg/subtitle-icon.svg"
                                width={20}
                                height={30}
                                alt="subtitle-icon"
                                className="w-[0.75rem]"
                              />
                              <Link
                                href={`/user/${item.challenges.id}/exercise`}
                              >
                                운동
                              </Link>
                            </li> */}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
