'use client';
import Image from 'next/image';
//import { FaBars } from 'react-icons/fa';
import LogoutButton from '../buttons/logoutButton';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { DiVim } from 'react-icons/di';
import NoticeModal from '../input/noticeModal';
import EditUsernameModal from '../modals/editUsernameModal';
import { useAdminData } from '../hooks/useAdminData';
import { useSession } from 'next-auth/react';
import { useSidebarState } from '../hooks/useSidebarState';
import { ChevronIcon } from '../icons/ChevronIcon';
import { Tooltip } from '../ui/Tooltip';
import { SidebarSkeleton } from '../ui/Skeleton';
import { useRecentChallenges } from '../hooks/useRecentChallenges';

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
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [userDropdown, setUserDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(256); // 기본 너비 16rem = 256px
  const [isResizing, setIsResizing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // localStorage를 활용한 사이드바 상태 관리
  const {
    isSidebarOpen,
    isOpenDropdown,
    isAdminDropdownOpen,
    isOpenEndedDropdown,
    isOpenChallengeDropdown,
    setIsSidebarOpen,
    setIsOpenDropdown,
    setIsAdminDropdownOpen,
    setIsOpenEndedDropdown,
    setIsOpenChallengeDropdown,
  } = useSidebarState(isMobile);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(
    null
  );
  const [editUsernameModal, setEditUsernameModal] = useState(false);
  const [notices, setNotices] = useState([
    { id: '1', title: '첫 번째 공지사항', content: '' },
    { id: '2', title: '두 번째 공지사항', content: '' },
    { id: '3', title: '세 번째 공지사항', content: '' },
  ]);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  // React Query hook 사용으로 API 호출 최적화
  const { adminData, displayUsername: hookDisplayUsername, isLoading: adminDataLoading, fetchAdminData, hasData } = useAdminData();

  // 최근 방문한 챌린지 관리
  const { recentChallenges, addRecentChallenge, removeRecentChallenge } = useRecentChallenges();

  // 활성 경로 확인 헬퍼 함수 (useCallback으로 최적화)
  const isActiveRoute = useCallback((route: string) => {
    return pathname === route || pathname?.startsWith(route);
  }, [pathname]);

  const handleUsernameUpdate = async (newUsername: string) => {
    const response = await fetch('/api/admin-users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: newUsername }),
    });

    if (!response.ok) {
      throw new Error('Failed to update username');
    }

    // 데이터 새로고침
    await fetchAdminData();
  };
  
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

  // 키보드 네비게이션: Escape 키로 닫기, Ctrl+B로 사이드바 토글
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B (Windows/Linux) 또는 Cmd+B (Mac)로 사이드바 토글
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        // 모바일에서 사이드바가 열려있으면 닫기
        if (isMobile && isSidebarOpen) {
          setIsSidebarOpen(false);
          return;
        }

        // 사용자 드롭다운이 열려있으면 닫기
        if (userDropdown) {
          setUserDropdown(false);
          return;
        }

        // 모달이 열려있으면 닫기
        if (modalOpen) {
          setModalOpen(false);
          return;
        }

        if (editUsernameModal) {
          setEditUsernameModal(false);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isSidebarOpen, userDropdown, modalOpen, editUsernameModal, setIsSidebarOpen]);

  // localStorage에서 사이드바 너비 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      const savedWidth = localStorage.getItem('sidebar-width');
      if (savedWidth) {
        setSidebarWidth(parseInt(savedWidth, 10));
      }
    }
  }, [isMobile]);

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

  const toggleChallengeDropdown = useCallback((challengeId: string) => {
    // 모바일에서 클릭한 요소의 y축 위치 고정
    if (isMobile) {
      const container = document.getElementById('sidebar-menu-container');
      const element = document.getElementById(`challenge-${challengeId}`);

      if (container && element) {
        // 클릭한 요소의 컨테이너 기준 현재 위치
        const elementTop = element.offsetTop;
        const currentScrollTop = container.scrollTop;
        const relativeTop = elementTop - currentScrollTop;

        setIsOpenChallengeDropdown((prev) => ({
          ...prev,
          [challengeId]: !prev[challengeId],
        }));

        // DOM 업데이트 후 요소의 y축 위치를 동일하게 유지
        setTimeout(() => {
          if (container && element) {
            const newElementTop = element.offsetTop;
            const targetScrollTop = newElementTop - relativeTop;
            container.scrollTop = targetScrollTop;
          }
        }, 0);
      } else {
        setIsOpenChallengeDropdown((prev) => ({
          ...prev,
          [challengeId]: !prev[challengeId],
        }));
      }
    } else {
      setIsOpenChallengeDropdown((prev) => ({
        ...prev,
        [challengeId]: !prev[challengeId],
      }));
    }
  }, [isMobile, setIsOpenChallengeDropdown]);

  const handleDropdown = useCallback(() => {
    if (isMobile) {
      const container = document.getElementById('sidebar-menu-container');
      const element = document.getElementById('program-menu-section');

      if (container && element) {
        const elementTop = element.offsetTop;
        const currentScrollTop = container.scrollTop;
        const relativeTop = elementTop - currentScrollTop;

        setIsOpenDropdown(!isOpenDropdown);

        setTimeout(() => {
          if (container && element) {
            const newElementTop = element.offsetTop;
            const targetScrollTop = newElementTop - relativeTop;
            container.scrollTop = targetScrollTop;
          }
        }, 0);
      } else {
        setIsOpenDropdown(!isOpenDropdown);
      }
    } else {
      setIsOpenDropdown(!isOpenDropdown);
    }
  }, [isMobile, isOpenDropdown, setIsOpenDropdown]);

  //() => handleChallengeClick(challenge)

  const handleAdminDropdown = useCallback(() => {
    if (isMobile) {
      const container = document.getElementById('sidebar-menu-container');
      const element = document.getElementById('admin-menu-section');

      if (container && element) {
        const elementTop = element.offsetTop;
        const currentScrollTop = container.scrollTop;
        const relativeTop = elementTop - currentScrollTop;

        setIsAdminDropdownOpen(!isAdminDropdownOpen);

        setTimeout(() => {
          if (container && element) {
            const newElementTop = element.offsetTop;
            const targetScrollTop = newElementTop - relativeTop;
            container.scrollTop = targetScrollTop;
          }
        }, 0);
      } else {
        setIsAdminDropdownOpen(!isAdminDropdownOpen);
      }
    } else {
      setIsAdminDropdownOpen(!isAdminDropdownOpen);
    }
  }, [isMobile, isAdminDropdownOpen, setIsAdminDropdownOpen]);

  const handleSidebarOpen = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen);
    setUserDropdown(false);
    setIsOpenDropdown(true); // 챌린지 메뉴 자동으로 펼치기

    // 선택된 챌린지가 있다면 하위 메뉴도 자동으로 펼치기
    if (selectedChallengeId) {
      onSelectChallenge(selectedChallengeId);
    }
  }, [isSidebarOpen, selectedChallengeId, onSelectChallenge, setIsSidebarOpen, setIsOpenDropdown]);

  const handleUserDropdown = useCallback(() => {
    setUserDropdown(!userDropdown);

    if (!userDropdown) {
      setIsSidebarOpen(false);
    }
  }, [userDropdown, setIsSidebarOpen]);

  // 모바일에서 메뉴 클릭 시 사이드바 자동 닫기 (useCallback으로 최적화)
  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, setIsSidebarOpen]);

  const handleChallengeClick = useCallback((challenge: Challenges) => {
    setSelectedTitle(challenge.challenges.title);
    onSelectChallenge(challenge.challenges.id);
    // 최근 방문 챌린지에 추가
    addRecentChallenge(challenge.challenges.id);
    // console.log('challenge.challenges.id', challenge.challenges.id);
    router.push(`/${challenge.challenges.id}`);
    closeSidebarOnMobile();
  }, [onSelectChallenge, router, closeSidebarOnMobile, addRecentChallenge]);

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

  // 진행 중인 챌린지와 종료된 챌린지 분리 (useMemo로 최적화)
  const activeChallenges = useMemo(() => {
    return data.filter((challenge) => {
      const endDate = new Date(challenge.challenges.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return endDate >= today;
    });
  }, [data]);

  const endedChallenges = useMemo(() => {
    return data.filter((challenge) => {
      const endDate = new Date(challenge.challenges.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return endDate < today;
    });
  }, [data]);

  // 최근 방문한 챌린지 필터링 (실제 존재하는 챌린지만)
  const recentChallengesData = useMemo(() => {
    return recentChallenges
      .map((id) => data.find((c) => c.challenges.id === id))
      .filter((c): c is Challenges => c !== undefined)
      .slice(0, 3); // 최대 3개
  }, [recentChallenges, data]);

  const handleAddNotice = () => {
    setSelectedNoticeId(null);
    setModalOpen(true);
  };

  // 사이드바 리사이즈 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isMobile) {
      setIsResizing(true);
      e.preventDefault();
    }
  }, [isMobile]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || isMobile) return;

      const newWidth = e.clientX;
      // 최소 너비 200px, 최대 너비 400px
      if (newWidth >= 200 && newWidth <= 400) {
        setSidebarWidth(newWidth);
        localStorage.setItem('sidebar-width', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isMobile]);

  // 스크롤 감지하여 헤더에 shadow 추가
  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById('sidebar-menu-container');
      if (container) {
        setIsScrolled(container.scrollTop > 0);
      }
    };

    const container = document.getElementById('sidebar-menu-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isSidebarOpen]);

  return (
    <>
      {/* Skip navigation 링크 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        메인 콘텐츠로 건너뛰기
      </a>

      {/* 모바일 오버레이 배경 */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleSidebarOpen}
          role="button"
          aria-label="사이드바 닫기"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleSidebarOpen();
            }
          }}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
        ${isMobile && isSidebarOpen ? 'fixed inset-0 w-full h-full z-50 flex flex-col' : ''}
        ${isMobile && !isSidebarOpen ? 'w-full sticky top-0 z-[100]' : ''}
        ${!isMobile && !isSidebarOpen ? 'lg:w-[4rem] min-w-[4rem]' : ''}
        ${!isMobile && isSidebarOpen ? 'sm:min-w-[12rem] md:min-w-[14rem]' : ''}
        min-h-fit md:min-h-fit lg:min-h-screen lg:px-[1rem]
        bg-white dark:bg-blue-4 drop-shadow-sm relative
        transition-all duration-300 ease-in-out
      `}
        style={!isMobile && isSidebarOpen ? { width: `${sidebarWidth}px` } : undefined}
        role="navigation"
        aria-label="주 내비게이션"
      >
      {/* 헤더 영역 - sticky로 항상 상단 고정 */}
      <div className={`
        ${isSidebarOpen ? 'sticky top-0 z-[100]' : ''}
        ${isScrolled && isSidebarOpen ? 'shadow-md' : ''}
        bg-white dark:bg-blue-4 flex-shrink-0 transition-shadow duration-300
      `}>
        {/* <div className="sticky flex justify-end sm:justify-between md:justify-between py-[1.25rem] px-[1.5rem] lg:gap-[1rem] lg:w-[15rem]"> */}
        <div className={`flex justify-start gap-[0.5rem] pt-[2.25rem] sm:pt-[0rem] md:hidden ${isMobile && !isSidebarOpen ? 'hidden' : ''}`}>
          {/* <Image src="/svg/logo_light.svg" width={30} height={30} alt="logo" /> */}
          <Image
            src="/svg/logo_text_light.svg"
            width={120}
            height={30}
            alt="Fitculator 로고"
            className={`${isMobile || (!isMobile && !isSidebarOpen) ? 'hidden' : ''}`}
            loading="lazy"
          />
        </div>
        <div className={`flex justify-between items-center py-[1.25rem] sm:px-4 md:px-4 lg:px-0 lg:gap-[1rem] relative z-[100]`}>
          <button
            onClick={handleSidebarOpen}
            className="flex items-center justify-center w-[1.5rem] h-[1.5rem] relative rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400"
            aria-label={isSidebarOpen ? 'close menu' : 'open menu'}
          >
            <div className="w-full h-full flex flex-col justify-center items-center gap-[0.25rem]">
              <span className={`block w-full h-[0.125rem] bg-gray-800 dark:bg-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'rotate-45 translate-y-[0.375rem]' : ''}`}></span>
              <span className={`block w-full h-[0.125rem] bg-gray-800 dark:bg-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-full h-[0.125rem] bg-gray-800 dark:bg-white transition-all duration-300 ease-in-out ${isSidebarOpen ? '-rotate-45 -translate-y-[0.375rem]' : ''}`}></span>
            </div>
          </button>
        <div className={`flex items-center gap-2 sm:flex md:flex lg:hidden relative ${isMobile && isSidebarOpen ? 'invisible' : ''}`}>
          <div
            className={`text-gray-800 dark:text-white text-sm whitespace-nowrap ${adminDataLoading ? 'animate-pulse' : ''}`}
            onClick={handleUserDropdown}
          >
            안녕하세요, {username || hookDisplayUsername} !
          </div>
          <button
            onClick={handleUserDropdown}
            className="flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 p-1"
            aria-label="사용자 메뉴"
            aria-expanded={userDropdown}
            aria-haspopup="true"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-gray-800 dark:text-white transition-transform duration-300 ease-in-out"
              style={{ transform: userDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
              aria-hidden="true"
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {userDropdown && (
            <>
              <div
                className="absolute right-4 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl overflow-hidden z-[9999] min-w-[120px] animate-in fade-in-0 zoom-in-95"
                role="menu"
                aria-label="사용자 메뉴"
              >
                <button
                  onClick={() => {
                    setEditUsernameModal(true);
                    setUserDropdown(false);
                  }}
                  disabled={adminDataLoading || !hasData}
                  className="relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                  role="menuitem"
                >
                  이름 수정
                </button>
                <LogoutButton />
              </div>
            </>
          )}
        </div>
        </div>
      </div>
      {isSidebarOpen && (
        <div
          id="sidebar-menu-container"
          className={`sm:w-full sm:flex sm:items-start sm:justify-start z-50 md:w-full md:items-start md:flex md:border md:justify-start lg:w-full ${isMobile ? 'flex-1 overflow-y-auto' : ''}`}
          role="region"
          aria-label="메뉴 목록"
        >
          <nav className={`w-full gap-[2rem] items-start md:py-[1rem] md:pb-[2rem] px-2 ${isMobile ? 'pb-8' : ''}`} aria-label="챌린지 및 관리 메뉴">
            {/* 로딩 스켈레톤 - 데이터가 없을 때 */}
            {(!data || data.length === 0) && <SidebarSkeleton />}

            {/* 실제 메뉴 - 데이터가 있을 때 */}
            {data && data.length > 0 && (
            <ul>
              <li id="program-menu-section" className="w-full items-center justify-between text-1.5-700 mb-4">
                <button
                  className="flex flex-row justify-between align-middle items-center cursor-pointer border-b-[0.1rem] border-gray-13 py-[0.8rem] px-2 w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400"
                  onClick={handleDropdown}
                  aria-expanded={isOpenDropdown}
                  aria-controls="program-menu-list"
                  aria-label="프로그램 메뉴"
                >
                  <span>프로그램</span>
                  <ChevronIcon isOpen={isOpenDropdown} className="text-gray-800 dark:text-white" />
                </button>

                {isOpenDropdown && (
                  <ul id="program-menu-list" className="font-medium text-1.25-700 text-gray-1 mt-4 flex flex-col gap-2" role="group" aria-label="프로그램 목록">
                    {/* 최근 방문한 챌린지 섹션 */}
                    {recentChallengesData.length > 0 && (
                      <>
                        <li className="list-none">
                          <div className="text-0.875-500 text-gray-2 pl-2 mb-2 flex items-center gap-2" role="heading" aria-level={3}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                            </svg>
                            최근 방문
                          </div>
                        </li>
                        {recentChallengesData.map((challenge) => (
                          <li key={`recent-${challenge.challenges.id}`} className="list-none">
                            <div className="flex items-center justify-between py-1 pl-2 pr-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                              <div
                                className={`cursor-pointer text-1-500 flex-1 ${
                                  challenge.challenges.id === selectedChallengeId
                                    ? 'text-blue-600 dark:text-blue-300'
                                    : 'dark:text-white'
                                }`}
                                onClick={() => handleChallengeClick(challenge)}
                              >
                                {challenge.challenges.title}
                              </div>
                              <button
                                onClick={() => removeRecentChallenge(challenge.challenges.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                aria-label={`${challenge.challenges.title} 최근 방문에서 제거`}
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400 dark:text-gray-500">
                                  <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </button>
                            </div>
                          </li>
                        ))}
                        <li className="list-none border-t border-gray-200 dark:border-gray-700 my-2" />
                      </>
                    )}

                    {/* 진행 중인 챌린지 섹션 */}
                    <>
                      <li className="list-none">
                        <div className="text-0.875-500 text-gray-2 pl-2 mb-2" role="heading" aria-level={3}>진행 중</div>
                      </li>
                      {activeChallenges && activeChallenges.length > 0 ? (
                        activeChallenges.map((challenge) => {
                          const isDropdownOpen =
                            isOpenChallengeDropdown[challenge.challenges.id];

                          return (
                            <li key={challenge.challenges.id} id={`challenge-${challenge.challenges.id}`}>
                              <div className={`font-medium py-2 pl-2 rounded dark:hover:bg-blue-3 flex justify-between items-center ${
                                challenge.challenges.id === selectedChallengeId ? 'bg-blue-50 dark:bg-blue-4' : ''
                              }`}>
                                <div
                                  className={`cursor-pointer text-1-500 hover:bg-gray-100 dark:hover:text-black ${
                                    challenge.challenges.id === selectedChallengeId
                                      ? 'text-blue-600 dark:text-blue-300'
                                      : 'dark:text-white'
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
                                  className="ml-2 hover:bg-gray-100 hover:text-1.25-700 p-2 rounded transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
                                  aria-label={isDropdownOpen ? '챌린지 메뉴 닫기' : '챌린지 메뉴 열기'}
                                  aria-expanded={isDropdownOpen}
                                >
                                  <ChevronIcon
                                    isOpen={isDropdownOpen}
                                    size={14}
                                    className="text-gray-600 dark:text-gray-300"
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
                                        className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                                          isActiveRoute(`/${challenge.challenges.id}/diet`)
                                            ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                            : 'dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                          const today = new Date()
                                            .toISOString()
                                            .split('T')[0]; // YYYY-MM-DD
                                          router.push(
                                            `/${challenge.challenges.id}/diet?date=${today}`
                                          );
                                          closeSidebarOnMobile();
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
                                        className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                                          isActiveRoute(`/${challenge.challenges.id}/workout`)
                                            ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                            : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                          // 운동 페이지로 이동하면서 강제 새로고침
                                          router.push(
                                            `/${challenge.challenges.id}/workout?refresh=${Date.now()}`
                                          );
                                          closeSidebarOnMobile();
                                        }}
                                      >
                                        운동
                                      </div>
                                    </li>
                                  )}
                                  <li>
                                    <div
                                      className={`cursor-pointer font-medium py-2 px-8 rounded transition-colors duration-300 ${
                                        isActiveRoute(`/${challenge.challenges.id}/members`)
                                          ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                          : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                      }`}
                                      onClick={() => {
                                        router.push(
                                          `/${challenge.challenges.id}/members`
                                        );
                                        closeSidebarOnMobile();
                                      }}
                                    >
                                      멤버
                                    </div>
                                  </li>
                                  {challenge.challenges.enable_benchmark && (
                                    <li>
                                      <div
                                        className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                                          isActiveRoute(`/${challenge.challenges.id}/benchmarks`)
                                            ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                            : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/benchmarks`
                                          );
                                          closeSidebarOnMobile();
                                        }}
                                      >
                                        벤치마크
                                      </div>
                                    </li>
                                  )}
                                  {challenge.challenges.enable_mission && (
                                    <li>
                                      <div
                                        className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                                          isActiveRoute(`/${challenge.challenges.id}/missions`)
                                            ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                            : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/missions`
                                          );
                                          closeSidebarOnMobile();
                                        }}
                                      >
                                        미션
                                      </div>
                                    </li>
                                  )}
                                  <li>
                                    <div
                                      className={`cursor-pointer font-medium py-2 px-8 rounded transition-colors duration-300 ${
                                        isActiveRoute(`/${challenge.challenges.id}/announcements`)
                                          ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                          : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                      }`}
                                      onClick={() => {
                                        router.push(
                                          `/${challenge.challenges.id}/announcements`
                                        );
                                        closeSidebarOnMobile();
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
                        <li className="list-none py-2 px-3 text-0.875-400 text-gray-11">
                          진행 중인 챌린지가 없습니다
                        </li>
                      )}
                    </>

                    {/* 종료된 챌린지 섹션 */}
                    {endedChallenges && endedChallenges.length > 0 && (
                      <li id="ended-challenges-section" className="list-none mt-4 border-t border-gray-13 pt-4">
                        <button
                          className="flex justify-between items-center pl-2 mb-2 cursor-pointer w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 py-1"
                          onClick={() => {
                            if (isMobile) {
                              const container = document.getElementById('sidebar-menu-container');
                              const element = document.getElementById('ended-challenges-section');

                              if (container && element) {
                                const elementTop = element.offsetTop;
                                const currentScrollTop = container.scrollTop;
                                const relativeTop = elementTop - currentScrollTop;

                                setIsOpenEndedDropdown(!isOpenEndedDropdown);

                                setTimeout(() => {
                                  if (container && element) {
                                    const newElementTop = element.offsetTop;
                                    const targetScrollTop = newElementTop - relativeTop;
                                    container.scrollTop = targetScrollTop;
                                  }
                                }, 0);
                              } else {
                                setIsOpenEndedDropdown(!isOpenEndedDropdown);
                              }
                            } else {
                              setIsOpenEndedDropdown(!isOpenEndedDropdown);
                            }
                          }}
                          aria-expanded={isOpenEndedDropdown}
                          aria-controls="ended-challenges-list"
                          aria-label={`종료된 챌린지 ${endedChallenges.length}개`}
                        >
                          <span className="text-0.875-500 text-gray-2">종료됨 ({endedChallenges.length})</span>
                          <ChevronIcon
                            isOpen={isOpenEndedDropdown}
                            size={14}
                            className="text-gray-600 dark:text-gray-400"
                          />
                        </button>
                        {isOpenEndedDropdown && (
                          <ul id="ended-challenges-list" className="flex flex-col gap-2" role="group" aria-label="종료된 챌린지 목록">
                            {endedChallenges.map((challenge) => {
                            const isDropdownOpen =
                              isOpenChallengeDropdown[challenge.challenges.id];

                            return (
                              <li key={challenge.challenges.id} id={`challenge-${challenge.challenges.id}`} className="opacity-60">
                                <div className={`font-medium py-2 pl-2 rounded dark:hover:bg-blue-3 flex justify-between items-center ${
                                  challenge.challenges.id === selectedChallengeId ? 'bg-blue-50 dark:bg-blue-4 opacity-100' : ''
                                }`}>
                                  <div
                                    className={`cursor-pointer text-1-500 hover:bg-gray-100 dark:hover:text-black ${
                                      challenge.challenges.id === selectedChallengeId
                                        ? 'text-blue-600 dark:text-blue-300'
                                        : 'dark:text-white'
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
                                    className="flex-shrink-0 hover:bg-gray-100 hover:text-1.25-700 p-2 rounded transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
                                    aria-label={isDropdownOpen ? '챌린지 메뉴 닫기' : '챌린지 메뉴 열기'}
                                    aria-expanded={isDropdownOpen}
                                  >
                                    <ChevronIcon
                                      isOpen={isDropdownOpen}
                                      size={14}
                                      className="text-gray-600 dark:text-gray-300"
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
                                          className={`cursor-pointer font-medium py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/diet`)
                                              ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                              : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                          onClick={() => {
                                            const today = new Date()
                                              .toISOString()
                                              .split('T')[0]; // YYYY-MM-DD
                                            router.push(
                                              `/${challenge.challenges.id}/diet?date=${today}`
                                            );
                                            closeSidebarOnMobile();
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
                                          className={`cursor-pointer font-medium py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/workout`)
                                              ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                              : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                          onClick={() => {
                                            // 운동 페이지로 이동하면서 강제 새로고침
                                            router.push(
                                              `/${challenge.challenges.id}/workout?refresh=${Date.now()}`
                                            );
                                            closeSidebarOnMobile();
                                          }}
                                        >
                                          운동
                                        </div>
                                      </li>
                                    )}
                                    <li>
                                      <div
                                        className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                                          isActiveRoute(`/${challenge.challenges.id}/members`)
                                            ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                            : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/members`
                                          );
                                          closeSidebarOnMobile();
                                        }}
                                      >
                                        멤버
                                      </div>
                                    </li>
                                    {challenge.challenges.enable_benchmark && (
                                      <li>
                                        <div
                                          className={`cursor-pointer font-medium py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/benchmarks`)
                                              ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                              : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                          onClick={() => {
                                            router.push(
                                              `/${challenge.challenges.id}/benchmarks`
                                            );
                                            closeSidebarOnMobile();
                                          }}
                                        >
                                          벤치마크
                                        </div>
                                      </li>
                                    )}
                                    {challenge.challenges.enable_mission && (
                                      <li>
                                        <div
                                          className={`cursor-pointer font-medium py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/missions`)
                                              ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                              : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                          onClick={() => {
                                            router.push(
                                              `/${challenge.challenges.id}/missions`
                                            );
                                            closeSidebarOnMobile();
                                          }}
                                        >
                                          미션
                                        </div>
                                      </li>
                                    )}
                                    <li>
                                      <div
                                        className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                                          isActiveRoute(`/${challenge.challenges.id}/announcements`)
                                            ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                                            : 'text-1-500 dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/announcements`
                                          );
                                          closeSidebarOnMobile();
                                        }}
                                      >
                                        공지사항
                                      </div>
                                    </li>
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                          </ul>
                        )}
                      </li>
                    )}
                  </ul>
                )}
              </li>
              {/* 운영 관리 메뉴 - internal_operator, system_admin, developer만 접근 가능 */}
              {hasOperationalAccess() && (
                <li id="admin-menu-section" className="w-full items-center justify-between text-1.5-700 mb-4">
                  <button
                    className="flex flex-row justify-between align-middle items-center cursor-pointer border-b-[0.1rem] border-gray-13 py-[0.8rem] px-2 w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400"
                    onClick={handleAdminDropdown}
                    aria-expanded={isAdminDropdownOpen}
                    aria-controls="admin-menu-list"
                    aria-label="운영 관리 메뉴"
                  >
                    <span>운영 관리</span>
                    <ChevronIcon isOpen={isAdminDropdownOpen} className="text-gray-800 dark:text-white" />
                  </button>

                  {isAdminDropdownOpen && (
                    <ul id="admin-menu-list" className="font-medium text-1.25-700 text-gray-1 mt-4 flex flex-col gap-2" role="group" aria-label="운영 관리 목록">
                      <li>
                        <div
                          className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                            isActiveRoute('/admin/create-challenge')
                              ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                              : 'dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            router.push('/admin/create-challenge');
                            closeSidebarOnMobile();
                          }}
                        >
                          챌린지 생성
                        </div>
                      </li>
                      <li>
                        <div
                          className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                            isActiveRoute('/admin/manage-challenges')
                              ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                              : 'dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            router.push('/admin/manage-challenges');
                            closeSidebarOnMobile();
                          }}
                        >
                          챌린지 관리
                        </div>
                      </li>
                      <li>
                        <div
                          className={`cursor-pointer text-1-500 py-2 px-8 rounded transition-colors duration-300 ${
                            isActiveRoute('/admin/manage-organizations')
                              ? 'bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-200'
                              : 'dark:text-white hover:text-gray-1 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            router.push('/admin/manage-organizations');
                            closeSidebarOnMobile();
                          }}
                        >
                          조직 관리
                        </div>
                      </li>
                      {/* TODO: 개발 완료 후 주석 해제
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
                      */}
                    </ul>
                  )}
                </li>
              )}
            </ul>
            )}
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

      <EditUsernameModal
        isOpen={editUsernameModal}
        currentUsername={adminData?.username || ''}
        onClose={() => setEditUsernameModal(false)}
        onSave={handleUsernameUpdate}
      />

      {/* Resize Handle - 데스크톱에서 사이드바가 열려있을 때만 표시 */}
      {!isMobile && isSidebarOpen && (
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors group"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="사이드바 너비 조절"
          aria-orientation="vertical"
        >
          <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-1.5 h-12 bg-gray-300 dark:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      </aside>
    </>
  );
}
