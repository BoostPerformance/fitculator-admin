'use client';
import Image from 'next/image';
//import { FaBars } from 'react-icons/fa';
import LogoutButton from '../buttons/logoutButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DiVim } from 'react-icons/di';
import NoticeModal from '../input/noticeModal';
import { useAdminData } from '../hooks/useAdminData';
import { useSession } from 'next-auth/react';

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    challenge_type: 'diet' | 'exercise' | 'diet_and_exercise';
    enable_benchmark?: boolean;
    enable_mission?: boolean;
  };
}

interface SidebarProps {
  data: Challenges[];
  onSelectChallenge: (challengeId: string) => void;
  onSelectChallengeTitle?: (challengeId: string) => void;
  coach?: string;
  selectedChallengeId?: string;
  username?: string;
}

export default function Sidebar({
  data,
  onSelectChallenge,
  onSelectChallengeTitle,
  selectedChallengeId,
  coach,
  username,
}: SidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOpenChallengeDropdown, setIsOpenChallengeDropdown] = useState<{
    [id: string]: boolean;
  }>({});
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [userDropdown, setUserDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [isOpenDropdown, setIsOpenDropdown] = useState(true);
  const [isOpenEndedDropdown, setIsOpenEndedDropdown] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(
    null
  );
  const [notices, setNotices] = useState([
    { id: '1', title: '첫 번째 공지사항', content: '' },
    { id: '2', title: '두 번째 공지사항', content: '' },
    { id: '3', title: '세 번째 공지사항', content: '' },
  ]);
  const router = useRouter();
  const { data: session } = useSession();
  
  // React Query hook 사용으로 API 호출 최적화
  const { adminData, displayUsername: hookDisplayUsername, isLoading: adminDataLoading } = useAdminData();
  
  // 운영 관리 권한 체크 함수 (특정 이메일로 제어)
  const hasOperationalAccess = () => {
    // 운영 관리 접근 가능한 이메일 리스트
    const operationalEmails = [
      'ryoohyun@fitculator.io',
      'cuteprobe@gmail.com'
    ];
    
    // 세션 이메일로 체크
    const userEmail = session?.user?.email;
    if (userEmail && operationalEmails.includes(userEmail)) {
      return true;
    }
    
    // 또는 admin_role로 체크 (기존 방식 유지)
    return adminData?.admin_role && ['internal_operator', 'system_admin', 'developer'].includes(adminData.admin_role);
  };
  
  // 기존 호환성을 위한 변수 유지
  const isInternalOperator = adminData?.admin_role === 'internal_operator';

  const dummyNotices = [
    { id: '1', title: '첫 번째 공지사항' },
    { id: '2', title: '두 번째 공지사항' },
    { id: '3', title: '세 번째 공지사항' },
  ];

  // 선택된 챌린지 변경 시 타이틀 업데이트
  useEffect(() => {
    const selectedChallenge = data.find(
      (item) => item.challenges.id === selectedChallengeId
    );
    if (selectedChallenge) {
      setSelectedTitle(selectedChallenge.challenges.title);
      setIsOpenDropdown(true); // 챌린지가 선택되었을 때 드롭다운 열기
    }
  }, [selectedChallengeId, data]);

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1025;
      setIsMobile(mobile);
      if (mobile) {
        // 모바일일 때는 사이드바는 닫혀있고, 챌린지 드롭다운은 열려있게
        setIsSidebarOpen(false);
        setIsOpenDropdown(true);
      } else {
        // 데스크톱일 때는 기본적으로 사이드바 열려있게 (하지만 토글 가능하도록)
        if (!isSidebarOpen && isSidebarOpen !== false) {
          setIsSidebarOpen(true);
        }
      }
    };

    // 초기 실행
    handleResize();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleChallengeDropdown = (challengeId: string) => {
    setIsOpenChallengeDropdown((prev) => ({
      ...prev,
      [challengeId]: !prev[challengeId],
    }));
  };

  const handleDropdown = () => {
    return setIsOpenDropdown(!isOpenDropdown);
  };

  //() => handleChallengeClick(challenge)

  const handleAdminDropdown = () => {
    return setIsAdminDropdownOpen(!isAdminDropdownOpen);
  };

  const handleSidebarOpen = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setUserDropdown(false);
    setIsOpenDropdown(true); // 챌린지 메뉴 자동으로 펼치기

    // 선택된 챌린지가 있다면 하위 메뉴도 자동으로 펼치기
    if (selectedChallengeId) {
      onSelectChallenge(selectedChallengeId);
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
    router.push(`/${challenge.challenges.id}`);
  };

  const handleSaveNotice = (updatedNotice: {
    id?: string;
    title: string;
    content: string;
  }) => {
    if (updatedNotice.id) {
      setNotices((prev) =>
        prev.map((n) =>
          n.id === updatedNotice.id ? { ...n, ...updatedNotice } : n
        )
      );
    } else {
      const newId = String(notices.length + 1);
      setNotices((prev) => [...prev, { ...updatedNotice, id: newId }]);
    }
    setModalOpen(false);
    setSelectedNoticeId(null);
  };

  const selectedNoticeData =
    notices.find((n) => n.id === selectedNoticeId) || null;

  // 진행 중인 챌린지와 종료된 챌린지 분리
  const activeChallenges = data.filter((challenge) => {
    const endDate = new Date(challenge.challenges.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate >= today;
  });

  const endedChallenges = data.filter((challenge) => {
    const endDate = new Date(challenge.challenges.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  });

  const handleAddNotice = () => {
    setSelectedNoticeId(null);
    setModalOpen(true);
  };

  return (
    <div className={`${!isMobile && !isSidebarOpen ? 'lg:w-[4rem] min-w-[4rem]' : 'lg:w-[16rem] min-w-[14rem]'} sm:min-w-[12rem] md:min-w-[14rem] min-h-fit md:min-h-fit lg:min-h-screen lg:px-[1rem] bg-white dark:bg-blue-4 drop-shadow-sm z-100 transition-all duration-300`}>
      {/* <div className="sticky flex justify-end sm:justify-between md:justify-between py-[1.25rem] px-[1.5rem] lg:gap-[1rem] lg:w-[15rem]"> */}
      <div className="flex justify-start gap-[0.5rem] pt-[2.25rem] sm:pt-[0rem] md:hidden">
        {/* <Image src="/svg/logo_light.svg" width={30} height={30} alt="logo" /> */}
        <Image
          src="/svg/logo_text_light.svg"
          width={120}
          height={30}
          alt="logo_text"
          className={`${isMobile || (!isMobile && !isSidebarOpen) ? 'hidden' : ''}`}
        />
      </div>
      <div className="flex justify-between items-center py-[1.25rem] sm:px-4 md:px-4 lg:px-0 lg:gap-[1rem]">
        <button
          onClick={handleSidebarOpen}
          className="flex"
        >
          <Image
            src={isSidebarOpen ? '/svg/close.svg' : '/svg/hamburger.svg'}
            width={30}
            height={30}
            alt={isSidebarOpen ? 'close menu' : 'open menu'}
            className={`w-[1.5rem] dark:invert`}
          />
        </button>
        <div className="flex items-center gap-2 sm:flex md:flex lg:hidden">
          <div
            className={`text-gray-500 text-sm whitespace-nowrap sm:dark:text-gray-8 ${adminDataLoading ? 'animate-pulse' : ''}`}
            onClick={handleUserDropdown}
          >
            안녕하세요, {username || hookDisplayUsername} !
          </div>
          <button onClick={handleUserDropdown} className="flex items-center">
            <Image
              src="/svg/arrow-down.svg"
              width={20}
              height={20}
              alt="arrow-down"
              className="w-[0.8rem]"
            />
          </button>
          {userDropdown && (
            <div className="absolute right-4 mt-8 bg-white rounded-lg shadow-md px-4 py-2 z-50 min-w-[100px]">
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
      {isSidebarOpen && (
        <div
          className={`sm:w-full sm:flex sm:items-center sm:justify-center z-50 md:w-full md:items-center md:flex md:border md:justify-start lg:w-full`}
        >
          <nav className="w-full gap-[2rem] items-start sm:items-center md:py-[1rem] md:pb-[2rem] px-2">
            <ul>
              <li className="w-full items-center justify-between text-1.5-700 mb-4">
                <div
                  role="group"
                  aria-label="프로그램 메뉴"
                  className="flex flex-row justify-between align-middle items-center cursor-pointer border-b-[0.1rem] border-gray-13 py-[0.8rem] px-2"
                  onClick={handleDropdown}
                >
                  프로그램
                  <button className="w-4 h-4 ">
                    <Image
                      src={
                        !isOpenDropdown
                          ? `/svg/arrow-up.svg`
                          : `/svg/arrow-down.svg`
                      }
                      width={30}
                      height={30}
                      alt="드롭다운 아이콘"
                      className="min-w-[1rem] min-h-[1rem]"
                    />
                  </button>
                </div>

                {isOpenDropdown && (
                  <ul className="font-medium text-1.25-700 text-gray-1 mt-4 flex flex-col gap-2">
                    {/* 진행 중인 챌린지 섹션 */}
                    <div className="mb-2">
                      <div className="text-0.875-500 text-gray-2 pl-2 mb-2">진행 중</div>
                      {activeChallenges && activeChallenges.length > 0 ? (
                        activeChallenges.map((challenge) => {
                          const isDropdownOpen =
                            isOpenChallengeDropdown[challenge.challenges.id];

                          return (
                            <li key={challenge.challenges.id}>
                              <div className={`font-medium py-2 pl-2 rounded dark:hover:bg-blue-3 flex justify-between items-center ${
                                challenge.challenges.id === selectedChallengeId ? 'bg-blue-50 dark:bg-blue-4' : ''
                              }`}>
                                <div
                                  className={`cursor-pointer hover:bg-gray-100 dark:hover:text-black hover:text-1-500 ${
                                    challenge.challenges.id === selectedChallengeId 
                                      ? 'text-blue-600 dark:text-blue-300 font-semibold' 
                                      : 'text-1-500 dark:text-white'
                                  }`}
                                  onClick={() => handleChallengeClick(challenge)}
                                >
                                  {challenge.challenges.title || '제목 없음'}
                                </div>
                                <button
                                  onClick={() =>
                                    toggleChallengeDropdown(
                                      challenge.challenges.id
                                    )
                                  }
                                  className="ml-2 hover:bg-gray-100 hover:text-1.25-700 p-2 min-w-[1rem] min-h-[1rem]"
                                >
                                  <Image
                                    src={
                                      isDropdownOpen
                                        ? `/svg/arrow-up.svg`
                                        : `/svg/arrow-down.svg`
                                    }
                                    width={30}
                                    height={30}
                                    alt="드롭다운 아이콘"
                                    className="w-[1rem] lg:w-[0.8rem] min-w-[1rem] min-h-[1rem]"
                                  />
                                </button>
                              </div>

                              {/* 식단/운동 드롭다운 */}
                              {isDropdownOpen && (
                                <ul className="mt-2 ml-2 border-l-2 border-gray-100 dark:border-blue-3">
                                  {(challenge.challenges.challenge_type ===
                                    'diet' ||
                                    challenge.challenges.challenge_type ===
                                      'diet_and_exercise') && (
                                    <li>
                                      <div
                                        className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                                        onClick={() => {
                                          const today = new Date()
                                            .toISOString()
                                            .split('T')[0]; // YYYY-MM-DD
                                          router.push(
                                            `/${challenge.challenges.id}/diet?date=${today}`
                                          );
                                        }}
                                      >
                                        식단
                                      </div>
                                    </li>
                                  )}
                                  {(challenge.challenges.challenge_type ===
                                    'exercise' ||
                                    challenge.challenges.challenge_type ===
                                      'diet_and_exercise') && (
                                    <li>
                                      <div
                                        className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded"
                                        onClick={() => {
                                          // 운동 페이지로 이동하면서 강제 새로고침
                                          router.push(
                                            `/${challenge.challenges.id}/workout?refresh=${Date.now()}`
                                          );
                                        }}
                                      >
                                        운동
                                      </div>
                                    </li>
                                  )}
                                  <li>
                                    <div
                                      className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                                      onClick={() => {
                                        router.push(
                                          `/${challenge.challenges.id}/members`
                                        );
                                      }}
                                    >
                                      멤버
                                    </div>
                                  </li>
                                  {challenge.challenges.enable_benchmark && (
                                    <li>
                                      <div
                                        className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded"
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/benchmarks`
                                          );
                                        }}
                                      >
                                        벤치마크
                                      </div>
                                    </li>
                                  )}
                                  {challenge.challenges.enable_mission && (
                                    <li>
                                      <div
                                        className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded"
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/missions`
                                          );
                                        }}
                                      >
                                        미션
                                      </div>
                                    </li>
                                  )}
                                  <li>
                                    <div
                                      className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                                      onClick={() => {
                                        router.push(
                                          `/${challenge.challenges.id}/announcements`
                                        );
                                      }}
                                    >
                                      공지사항
                                    </div>
                                  </li>
                                </ul>
                              )}
                            </li>
                          );
                        })
                      ) : (
                        <div className="py-2 px-3 text-0.875-400 text-gray-11">
                          진행 중인 챌린지가 없습니다
                        </div>
                      )}
                    </div>

                    {/* 종료된 챌린지 섹션 */}
                    {endedChallenges && endedChallenges.length > 0 && (
                      <div className="mt-4 border-t border-gray-13 pt-4">
                        <div 
                          className="flex justify-between items-center pl-2 mb-2 cursor-pointer"
                          onClick={() => setIsOpenEndedDropdown(!isOpenEndedDropdown)}
                        >
                          <span className="text-0.875-500 text-gray-2">종료됨 ({endedChallenges.length})</span>
                          <Image
                            src={isOpenEndedDropdown ? `/svg/arrow-up.svg` : `/svg/arrow-down.svg`}
                            width={16}
                            height={16}
                            alt="종료된 챌린지 토글"
                            className="mr-2"
                          />
                        </div>
                        {isOpenEndedDropdown && (
                          endedChallenges.map((challenge) => {
                            const isDropdownOpen =
                              isOpenChallengeDropdown[challenge.challenges.id];

                            return (
                              <li key={challenge.challenges.id} className="opacity-60">
                                <div className={`font-medium py-2 pl-2 rounded dark:hover:bg-blue-3 flex justify-between items-center ${
                                  challenge.challenges.id === selectedChallengeId ? 'bg-blue-50 dark:bg-blue-4 opacity-100' : ''
                                }`}>
                                  <div
                                    className={`cursor-pointer hover:bg-gray-100 dark:hover:text-black hover:text-1-500 ${
                                      challenge.challenges.id === selectedChallengeId 
                                        ? 'text-blue-600 dark:text-blue-300 font-semibold' 
                                        : 'text-1-500 dark:text-white'
                                    }`}
                                    onClick={() => handleChallengeClick(challenge)}
                                  >
                                    {challenge.challenges.title || '제목 없음'}
                                  </div>
                                  <button
                                    onClick={() =>
                                      toggleChallengeDropdown(
                                        challenge.challenges.id
                                      )
                                    }
                                    className="ml-2 hover:bg-gray-100 hover:text-1.25-700 p-2 min-w-[1rem] min-h-[1rem]"
                                  >
                                    <Image
                                      src={
                                        isDropdownOpen
                                          ? `/svg/arrow-up.svg`
                                          : `/svg/arrow-down.svg`
                                      }
                                      width={30}
                                      height={30}
                                      alt="드롭다운 아이콘"
                                      className="w-[1rem] lg:w-[0.8rem] min-w-[1rem] min-h-[1rem]"
                                    />
                                  </button>
                                </div>

                                {/* 식단/운동 드롭다운 */}
                                {isDropdownOpen && (
                                  <ul className="mt-2 ml-2 border-l-2 border-gray-100 dark:border-blue-3">
                                    {(challenge.challenges.challenge_type ===
                                      'diet' ||
                                      challenge.challenges.challenge_type ===
                                        'diet_and_exercise') && (
                                      <li>
                                        <div
                                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                                          onClick={() => {
                                            const today = new Date()
                                              .toISOString()
                                              .split('T')[0]; // YYYY-MM-DD
                                            router.push(
                                              `/${challenge.challenges.id}/diet?date=${today}`
                                            );
                                          }}
                                        >
                                          식단
                                        </div>
                                      </li>
                                    )}
                                    {(challenge.challenges.challenge_type ===
                                      'exercise' ||
                                      challenge.challenges.challenge_type ===
                                        'diet_and_exercise') && (
                                      <li>
                                        <div
                                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded"
                                          onClick={() => {
                                            // 운동 페이지로 이동하면서 강제 새로고침
                                            router.push(
                                              `/${challenge.challenges.id}/workout?refresh=${Date.now()}`
                                            );
                                          }}
                                        >
                                          운동
                                        </div>
                                      </li>
                                    )}
                                    <li>
                                      <div
                                        className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded"
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/members`
                                          );
                                        }}
                                      >
                                        멤버
                                      </div>
                                    </li>
                                    {challenge.challenges.enable_benchmark && (
                                      <li>
                                        <div
                                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded"
                                          onClick={() => {
                                            router.push(
                                              `/${challenge.challenges.id}/benchmarks`
                                            );
                                          }}
                                        >
                                          벤치마크
                                        </div>
                                      </li>
                                    )}
                                    {challenge.challenges.enable_mission && (
                                      <li>
                                        <div
                                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded"
                                          onClick={() => {
                                            router.push(
                                              `/${challenge.challenges.id}/missions`
                                            );
                                          }}
                                        >
                                          미션
                                        </div>
                                      </li>
                                    )}
                                    <li>
                                      <div
                                        className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded"
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/announcements`
                                          );
                                        }}
                                      >
                                        공지사항
                                      </div>
                                    </li>
                                  </ul>
                                )}
                              </li>
                            );
                          })
                        )}
                      </div>
                    )}
                  </ul>
                )}
              </li>
              {/* 운영 관리 메뉴 - internal_operator, system_admin, developer만 접근 가능 */}
              {hasOperationalAccess() && (
                <li className="w-full items-center justify-between text-1.5-700 mb-4">
                  <div
                    role="group"
                    aria-label="운영 관리 메뉴"
                    className="flex flex-row justify-between align-middle items-center cursor-pointer border-b-[0.1rem] border-gray-13 py-[0.8rem] px-2"
                    onClick={handleAdminDropdown}
                  >
                    운영 관리
                    <button className="w-4 h-4">
                      <Image
                        src={
                          !isAdminDropdownOpen
                            ? `/svg/arrow-up.svg`
                            : `/svg/arrow-down.svg`
                        }
                        width={30}
                        height={30}
                        alt="드롭다운 아이콘"
                        className="min-w-[1rem] min-h-[1rem]"
                      />
                    </button>
                  </div>

                  {isAdminDropdownOpen && (
                    <ul className="font-medium text-1.25-700 text-gray-1 mt-4 flex flex-col gap-2">
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/create-challenge');
                          }}
                        >
                          챌린지 생성
                        </div>
                      </li>
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/manage-challenges');
                          }}
                        >
                          챌린지 관리
                        </div>
                      </li>
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/manage-organizations');
                          }}
                        >
                          조직 관리
                        </div>
                      </li>
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/user-management');
                          }}
                        >
                          사용자 관리
                        </div>
                      </li>
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/system-logs');
                          }}
                        >
                          시스템 로그
                        </div>
                      </li>
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/settings');
                          }}
                        >
                          시스템 설정
                        </div>
                      </li>
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-500 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/data-export');
                          }}
                        >
                          데이터 추출
                        </div>
                      </li>
                    </ul>
                  )}
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
      {modalOpen && (
        <NoticeModal
          onClose={() => {
            setModalOpen(false);
            setSelectedNoticeId(null);
          }}
          challengeId={selectedChallengeId ?? ''}
          noticeId={selectedNoticeId}
          defaultTitle={selectedNoticeData?.title || ''}
          defaultContent={selectedNoticeData?.content || ''}
          onSave={handleSaveNotice}
        />
      )}
    </div>
  );
}
