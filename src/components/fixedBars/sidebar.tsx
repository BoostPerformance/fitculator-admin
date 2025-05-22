'use client';
import Image from 'next/image';
//import { FaBars } from 'react-icons/fa';
import LogoutButton from '../buttons/logoutButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DiVim } from 'react-icons/di';
import NoticeModal from '../input/noticeModal';

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
  const [isInternalOperator, setIsInternalOperator] = useState(false);
  const router = useRouter();

  const dummyNotices = [
    { id: '1', title: '첫 번째 공지사항' },
    { id: '2', title: '두 번째 공지사항' },
    { id: '3', title: '세 번째 공지사항' },
  ];
  // 사용자 역할 확인
  useEffect(() => {
    // 관리자 정보 가져오기
    const fetchAdminRole = async () => {
      try {
        const response = await fetch('/api/admin-users');
        if (response.ok) {
          const data = await response.json();
          setIsInternalOperator(data.admin_role === 'internal_operator');
        }
      } catch (error) {
        console.error('관리자 정보 가져오기 실패:', error);
      }
    };

    fetchAdminRole();
  }, []);

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
        // 데스크톱일 때는 사이드바 열려있게
        setIsSidebarOpen(true);
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
    router.push(`/user/${challenge.challenges.id}`);
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

  // console.log("챌린지 데이터:", {
  //   전체데이터: data,
  //   데이터길이: data?.length,
  //   첫번째챌린지: data?.[0]?.challenges,
  //   선택된챌린지ID: selectedChallengeId,
  // });

  const handleAddNotice = () => {
    setSelectedNoticeId(null);
    setModalOpen(true);
  };

  return (
    <div className="lg:w-[18.75rem] min-h-fit md:min-h-fit lg:min-h-screen lg:px-[2.375rem] bg-white dark:bg-blue-4 drop-shadow-sm z-100">
      {/* <div className="sticky flex justify-end sm:justify-between md:justify-between py-[1.25rem] px-[1.5rem] lg:gap-[1rem] lg:w-[15rem]"> */}
      <div className="flex justify-start gap-[0.5rem] pt-[2.25rem] sm:pt-[0rem] md:hidden">
        {/* <Image src="/svg/logo_light.svg" width={30} height={30} alt="logo" /> */}
        <Image
          src="/svg/logo_text_light.svg"
          width={120}
          height={30}
          alt="logo_text"
          className={`${isMobile ? 'hidden' : ''}`}
        />
      </div>
      <div className="flex justify-between items-center py-[1.25rem] sm:px-4 md:px-4 lg:px-0 lg:gap-[1rem]">
        <button
          onClick={handleSidebarOpen}
          className={`${isMobile ? '' : 'hidden'} `}
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
            className="text-gray-500 text-sm whitespace-nowrap sm:dark:text-gray-8"
            onClick={handleUserDropdown}
          >
            안녕하세요, {username} !
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
      {(isSidebarOpen || !isMobile) && (
        <div
          className={`sm:w-full sm:flex sm:items-center sm:justify-center z-50 md:w-full md:items-center md:flex md:border md:justify-start lg:w-full`}
        >
          <nav className="w-full gap-[2rem] items-start sm:items-center md:py-[1rem] md:pb-[2rem] px-4">
            <ul>
              <li className="w-full items-center justify-between text-1.5-700 mb-4">
                <div
                  role="group"
                  aria-label="챌린지 메뉴"
                  className="flex flex-row justify-between align-middle cursor-pointer border-b-[0.1rem] border-gray-13 py-[0.8rem] px-4 "
                  onClick={handleDropdown}
                >
                  챌린지
                  <button className="w-[1rem] lg:w-[0.8rem]">
                    <Image
                      src={
                        !isOpenDropdown
                          ? `/svg/arrow-up.svg`
                          : `/svg/arrow-down.svg`
                      }
                      width={30}
                      height={30}
                      alt="드롭다운 아이콘"
                    />
                  </button>
                </div>

                {isOpenDropdown && (
                  <ul className="font-medium text-1.25-700 text-gray-1 mt-4 flex flex-col gap-2">
                    {data && data.length > 0 ? (
                      data.map((challenge) => {
                        const isDropdownOpen =
                          isOpenChallengeDropdown[challenge.challenges.id];

                        return (
                          <li key={challenge.challenges.id}>
                            <div className="font-medium py-2 pl-4 rounded hover:bg-gray-100 dark:hover:bg-blue-3 flex justify-between items-center">
                              <div
                                className="cursor-pointer font-medium dark:text-white"
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
                                className="ml-2"
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
                                  className="w-[1rem] lg:w-[0.8rem]"
                                />
                              </button>
                            </div>

                            {/* 식단/운동 드롭다운 */}
                            {isDropdownOpen && (
                              <ul className="mt-2 ml-2 border-l-2 border-gray-100 dark:border-blue-3">
                                <li>
                                  <div
                                    className="cursor-pointer font-medium text-1-400 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                                    onClick={() => {
                                      const today = new Date()
                                        .toISOString()
                                        .split('T')[0]; // YYYY-MM-DD
                                      router.push(
                                        `/user/${challenge.challenges.id}/diet?date=${today}`
                                      );
                                    }}
                                  >
                                    식단
                                  </div>
                                </li>
                                <li>
                                  <div
                                    className="cursor-pointer font-medium text-1-400 hover:text-gray-1 py-2 px-8 rounded"
                                    onClick={() => {
                                      router.push(
                                        `/user/${challenge.challenges.id}/workout`
                                      );
                                    }}
                                  >
                                    운동
                                  </div>
                                </li>
                                {/* <li>
                                  <div className="flex items-center justify-between px-8 py-2">
                                    <span className="text-sm font-medium">
                                      공지사항
                                    </span>
                                    <button onClick={handleAddNotice}>
                                      <Image
                                        src="/svg/plus.svg"
                                        width={16}
                                        height={16}
                                        alt="추가"
                                      />
                                    </button>
                                  </div>
                                  <ul className="ml-2 space-y-1 pb-4">
                                    {notices.map((notice) => (
                                      <li
                                        key={notice.id}
                                        className="text-sm cursor-pointer text-gray-600 hover:text-black pt-2 pl-8"
                                        onClick={() => {
                                          setCurrentChallengeId(
                                            selectedChallengeId || null
                                          );
                                          setSelectedNoticeId(notice.id);
                                          setModalOpen(true);
                                        }}
                                      >
                                        {notice.title}
                                      </li>
                                    ))}
                                  </ul>
                                </li> */}
                              </ul>
                            )}
                          </li>
                        );
                      })
                    ) : (
                      <li>
                        <div className="py-2 px-3 text-gray-400">
                          챌린지가 없습니다
                        </div>
                      </li>
                    )}
                  </ul>
                )}
              </li>
              {isInternalOperator && (
                <li className="w-full items-center justify-between text-1.5-700">
                  <div
                    role="group"
                    aria-label="관리자 메뉴"
                    className="flex flex-row justify-between align-middle cursor-pointer border-b-[0.1rem] border-gray-13 py-[0.8rem] px-4"
                    onClick={handleAdminDropdown}
                  >
                    관리자 메뉴
                    <button className="w-[1rem] lg:w-[0.8rem]">
                      <Image
                        src={
                          !isAdminDropdownOpen
                            ? `/svg/arrow-up.svg`
                            : `/svg/arrow-down.svg`
                        }
                        width={30}
                        height={30}
                        alt="드롭다운 아이콘"
                      />
                    </button>
                  </div>

                  {isAdminDropdownOpen && (
                    <ul className="font-medium text-1.25-700 text-gray-1 mt-4 flex flex-col gap-2">
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-400 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/create-challenge');
                          }}
                        >
                          챌린지 생성
                        </div>
                      </li>
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-400 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/manage-challenges');
                          }}
                        >
                          챌린지 관리
                        </div>
                      </li>
                      <li>
                        <div
                          className="cursor-pointer font-medium text-1-400 hover:text-gray-1 py-2 px-8 rounded dark:text-white"
                          onClick={() => {
                            router.push('/admin/manage-organizations');
                          }}
                        >
                          조직 관리
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
