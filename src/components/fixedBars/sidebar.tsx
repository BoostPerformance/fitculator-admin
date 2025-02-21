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
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
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
    <div className="lg:w-[18.75rem] lg:h-screen lg:px-[2.375rem] bg-white dark:bg-blue-4 drop-shadow-sm z-100">
      {/* <div className="sticky flex justify-end sm:justify-between md:justify-between py-[1.25rem] px-[1.5rem] lg:gap-[1rem] lg:w-[15rem]"> */}
      <div className="flex justify-start gap-[0.5rem] pt-[1.25rem]">
        <Image src="/svg/logo_light.svg" width={30} height={30} alt="logo" />
        <Image
          src="/svg/logo_text_light.svg"
          width={150}
          height={30}
          alt="logo_text"
        />
      </div>
      <div className="flex justify-start sm:justify-between md:justify-between py-[1.25rem] lg:gap-[1rem]">
        <button
          onClick={handleSidebarOpen}
          className={`${isMobile ? "" : "hidden"}`}
        >
          <Image
            src="/svg/hamburger.svg"
            width={30}
            height={30}
            alt="logo"
            className={`w-[1.5rem] dark:invert`}
          />
        </button>
        <div className="relative flex justify-between items-center sm:gap-[0.5rem] md:gap-[1rem] w-full pr-[1.875rem]">
          {/* <div>안녕하세요, {coach}님 </div> */}
          <div className="flex justify-start items-center whitespace-nowrap">
            안녕하세요,&nbsp;
            <strong className="inline-block overflow-hidden whitespace-nowrap text-ellipsis">
              {coach}
            </strong>
            님
          </div>
          <button
            onClick={handleUserDropdown}
            className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-shrink-0 flex-grow-0 justify-center items-center w-[1.875rem] h-[1.875rem]"
          >
            <Image
              src={userDropdown ? `/svg/arrow-up.svg` : `/svg/arrow-down.svg`}
              width={30}
              height={30}
              alt="logo"
              className={`dark:invert w-[1rem] lg:w-[0.8rem]`}
            />
          </button>
          {userDropdown && (
            <div className="z-50 top-full absolute left-0 flex justify-end px-[1rem] py-[0.5rem] sm:right-1 items-start flex-col text-gray-10 text-1-700 gap-[0.5rem] bg-white drop-shadow-md lg:absolute lg:left-[0.5rem] rounded-[0.5rem] lg:w-[14rem] sm:w-[14rem] sm:items-end lg:items-end md:right-[1rem] md:w-[10rem] md:items-end ">
              {/* <div className="hover:bg-gray-3 ">전체회원 정보보기</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="122"
                height="2"
                viewBox="0 0 122 2"
                fill="none"
              >
                <path d="M0 1H122" stroke="#E1E1E1" />
              </svg> */}
              <LogoutButton />
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                width="122"
                height="2"
                viewBox="0 0 122 2"
                fill="none"
              >
                <path d="M0 1H122" stroke="#E1E1E1" />
              </svg> */}
            </div>
          )}
        </div>
      </div>
      {(isSidebarOpen || !isMobile) && (
        <div
          className={`sm:w-full sm:flex sm:items-center sm:justify-center z-50 md:w-full md:items-center md:flex md:border md:justify-start lg:w-full`}
        >
          <nav className=" flex flex-col gap-[2rem] items-start md:w-[18rem] sm:items-center md:py-[1rem] md:pb-[2rem]">
            <ul className="w-full">
              <li className="w-full border-b-[0.1rem] border-gray-13">
                <button
                  onClick={handleDropdown}
                  className="w-full flex items-center justify-between lg:text-1.25-900  py-[0.8rem] sm:w-full sm:gap-[1rem] sm:justify-center sm:text-1.125-500 cursor-pointer"
                >
                  챌린지
                  <Image
                    src={
                      isOpenDropdown
                        ? `/svg/arrow-down.svg`
                        : `/svg/arrow-up.svg`
                    }
                    width={30}
                    height={30}
                    alt="arrow-down "
                    className="w-[1rem] lg:w-[0.8rem]"
                    onClick={handleDropdown}
                  />
                </button>
                {isOpenDropdown && (
                  <ul>
                    <li>ㄴ식단</li>
                    <li>ㄴ운동</li>
                  </ul>
                )}
              </li>
              <li>핏다챌</li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
