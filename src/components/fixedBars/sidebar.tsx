'use client';
import Image from 'next/image';
//import { FaBars } from 'react-icons/fa';
import LogoutButton from '../buttons/logoutButton';
import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
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
    challenge_type: 'diet' | 'exercise' | 'diet_and_exercise' | 'running';
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
  const [mounted, setMounted] = useState(false);

  // Portal을 위한 마운트 상태 확인
  useEffect(() => {
    setMounted(true);
  }, []);

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
    setIsOpenChallengeDropdown((prev) => ({
      ...prev,
      [challengeId]: !prev[challengeId],
    }));
  }, [setIsOpenChallengeDropdown]);

  const handleDropdown = useCallback(() => {
    setIsOpenDropdown(!isOpenDropdown);
  }, [isOpenDropdown, setIsOpenDropdown]);

  //() => handleChallengeClick(challenge)

  const handleAdminDropdown = useCallback(() => {
    setIsAdminDropdownOpen(!isAdminDropdownOpen);
  }, [isAdminDropdownOpen, setIsAdminDropdownOpen]);

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

  // 모바일 열린 사이드바 컨텐츠 (Portal로 렌더링됨)
  const mobileSidebarContent = (
    <aside
      className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-900"
      role="navigation"
      aria-label="주 내비게이션"
    >
      {/* 모바일 사이드바 헤더 */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        <Image
          src="/svg/logo_text_light.svg"
          width={110}
          height={28}
          alt="Fitculator 로고"
          className="dark:hidden"
          loading="lazy"
        />
        <Image
          src="/svg/logo_text_dark.svg"
          width={110}
          height={28}
          alt="Fitculator 로고"
          className="hidden dark:block"
          loading="lazy"
        />
        <button
          onClick={handleSidebarOpen}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
          aria-label="메뉴 닫기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-500 dark:text-gray-400">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* 스크롤 가능한 메뉴 영역 */}
      <div
        id="sidebar-menu-container-mobile"
        className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={(e) => e.stopPropagation()}
      >
        <nav className="w-full py-4 px-4" aria-label="챌린지 및 관리 메뉴">
          {(!data || data.length === 0) && <SidebarSkeleton />}
          {data && data.length > 0 && (
            <ul>
              <li id="program-menu-section-mobile" className="w-full items-center justify-between text-sm font-semibold mb-2">
                <button
                  className="flex flex-row justify-between align-middle items-center cursor-pointer w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 min-h-[52px] transition-all px-2 py-3 active:bg-gray-100 dark:active:bg-gray-800"
                  onClick={handleDropdown}
                  aria-expanded={isOpenDropdown}
                  aria-controls="program-menu-list-mobile"
                  aria-label="프로그램 메뉴"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-[15px]">프로그램</span>
                  <ChevronIcon isOpen={isOpenDropdown} className="text-gray-400 dark:text-gray-500" />
                </button>

                {isOpenDropdown && (
                  <ul id="program-menu-list-mobile" className="font-medium text-gray-1 mt-3 flex flex-col gap-1" role="group" aria-label="프로그램 목록">
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
                          <li key={`recent-mobile-${challenge.challenges.id}`} className="list-none">
                            <div className="flex items-center justify-between py-1 pl-2 pr-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                              <div
                                className={`cursor-pointer text-0.875-500 flex-1 ${
                                  challenge.challenges.id === selectedChallengeId
                                    ? 'text-blue-600 dark:text-blue-300'
                                    : 'text-gray-800 dark:text-white'
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
                    <li className="list-none">
                      <div className="text-0.875-500 text-gray-2 pl-2 mb-2" role="heading" aria-level={3}>진행 중</div>
                    </li>
                    {activeChallenges && activeChallenges.length > 0 ? (
                      activeChallenges.map((challenge) => {
                        const isDropdownOpen = isOpenChallengeDropdown[challenge.challenges.id];
                        return (
                          <li key={`mobile-${challenge.challenges.id}`} id={`challenge-mobile-${challenge.challenges.id}`}>
                            <div
                              className={`font-medium py-2 px-3 rounded-lg flex justify-between items-center min-h-[48px] transition-all cursor-pointer active:scale-[0.98] ${
                                challenge.challenges.id === selectedChallengeId
                                  ? 'bg-blue-50 dark:bg-blue-900/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                              }`}
                              onClick={() => handleChallengeClick(challenge)}
                            >
                              <span
                                className={`text-sm font-medium flex-1 py-1 ${
                                  challenge.challenges.id === selectedChallengeId
                                    ? 'text-blue-600 dark:text-blue-300'
                                    : 'text-gray-800 dark:text-white'
                                }`}
                              >
                                {challenge.challenges.title || '제목 없음'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleChallengeDropdown(challenge.challenges.id);
                                }}
                                className="ml-2 hover:bg-gray-200 dark:hover:bg-gray-600 p-2.5 rounded-lg transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 min-w-[40px] min-h-[40px] flex items-center justify-center"
                                aria-label={isDropdownOpen ? '챌린지 메뉴 닫기' : '챌린지 메뉴 열기'}
                                aria-expanded={isDropdownOpen}
                              >
                                <ChevronIcon isOpen={isDropdownOpen} size={14} className="text-gray-600 dark:text-gray-300" />
                              </button>
                            </div>

                            {isDropdownOpen && (
                              <ul className="mt-1 ml-3 border-l-2 border-gray-200 dark:border-gray-600 space-y-0.5">
                                {(challenge.challenges.challenge_type === 'diet' || challenge.challenges.challenge_type === 'diet_and_exercise') && (
                                  <li>
                                    <div
                                      className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                                        isActiveRoute(`/${challenge.challenges.id}/diet`)
                                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                      }`}
                                      onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        router.push(`/${challenge.challenges.id}/diet?date=${today}`);
                                        closeSidebarOnMobile();
                                      }}
                                    >
                                      식단
                                    </div>
                                  </li>
                                )}
                                {(challenge.challenges.challenge_type === 'exercise' || challenge.challenges.challenge_type === 'diet_and_exercise') && (
                                  <li>
                                    <div
                                      className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                                        isActiveRoute(`/${challenge.challenges.id}/workout`)
                                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                      }`}
                                      onClick={() => {
                                        router.push(`/${challenge.challenges.id}/workout?refresh=${Date.now()}`);
                                        closeSidebarOnMobile();
                                      }}
                                    >
                                      운동
                                    </div>
                                  </li>
                                )}
                                {challenge.challenges.challenge_type === 'running' && (
                                  <li>
                                    <div
                                      className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                                        isActiveRoute(`/${challenge.challenges.id}/running`)
                                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                      }`}
                                      onClick={() => {
                                        router.push(`/${challenge.challenges.id}/running?refresh=${Date.now()}`);
                                        closeSidebarOnMobile();
                                      }}
                                    >
                                      운동
                                    </div>
                                  </li>
                                )}
                                <li>
                                  <div
                                    className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                                      isActiveRoute(`/${challenge.challenges.id}/members`)
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                    }`}
                                    onClick={() => {
                                      router.push(`/${challenge.challenges.id}/members`);
                                      closeSidebarOnMobile();
                                    }}
                                  >
                                    멤버
                                  </div>
                                </li>
                                {challenge.challenges.enable_benchmark && (
                                  <li>
                                    <div
                                      className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                                        isActiveRoute(`/${challenge.challenges.id}/benchmarks`)
                                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                      }`}
                                      onClick={() => {
                                        router.push(`/${challenge.challenges.id}/benchmarks`);
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
                                      className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                                        isActiveRoute(`/${challenge.challenges.id}/missions`)
                                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                      }`}
                                      onClick={() => {
                                        router.push(`/${challenge.challenges.id}/missions`);
                                        closeSidebarOnMobile();
                                      }}
                                    >
                                      미션
                                    </div>
                                  </li>
                                )}
                                <li>
                                  <div
                                    className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                                      isActiveRoute(`/${challenge.challenges.id}/announcements`)
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                    }`}
                                    onClick={() => {
                                      router.push(`/${challenge.challenges.id}/announcements`);
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

                    {/* 종료된 챌린지 섹션 */}
                    {endedChallenges && endedChallenges.length > 0 && (
                      <li id="ended-challenges-section-mobile" className="list-none mt-4 border-t border-gray-13 pt-4">
                        <button
                          className="flex justify-between items-center pl-2 mb-2 cursor-pointer w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 py-1"
                          onClick={() => setIsOpenEndedDropdown(!isOpenEndedDropdown)}
                          aria-expanded={isOpenEndedDropdown}
                          aria-controls="ended-challenges-list-mobile"
                          aria-label={`종료된 챌린지 ${endedChallenges.length}개`}
                        >
                          <span className="text-0.875-500 text-gray-2">종료됨 ({endedChallenges.length})</span>
                          <ChevronIcon isOpen={isOpenEndedDropdown} size={14} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        {isOpenEndedDropdown && (
                          <ul id="ended-challenges-list-mobile" className="flex flex-col gap-2" role="group" aria-label="종료된 챌린지 목록">
                            {endedChallenges.map((challenge) => {
                              const isDropdownOpen = isOpenChallengeDropdown[challenge.challenges.id];
                              return (
                                <li key={`mobile-ended-${challenge.challenges.id}`} className="opacity-60">
                                  <div className={`font-medium py-2 pl-2 rounded dark:hover:bg-blue-3 flex justify-between items-center ${
                                    challenge.challenges.id === selectedChallengeId ? 'bg-blue-50 dark:bg-blue-4 opacity-100' : ''
                                  }`}>
                                    <div
                                      className={`cursor-pointer text-0.875-500 hover:bg-gray-100 dark:hover:text-black ${
                                        challenge.challenges.id === selectedChallengeId
                                          ? 'text-blue-600 dark:text-blue-300'
                                          : 'text-gray-800 dark:text-white'
                                      }`}
                                      onClick={() => handleChallengeClick(challenge)}
                                    >
                                      {challenge.challenges.title || '제목 없음'}
                                    </div>
                                    <button
                                      onClick={() => toggleChallengeDropdown(challenge.challenges.id)}
                                      className="flex-shrink-0 hover:bg-gray-100 p-2 rounded transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
                                      aria-label={isDropdownOpen ? '챌린지 메뉴 닫기' : '챌린지 메뉴 열기'}
                                      aria-expanded={isDropdownOpen}
                                    >
                                      <ChevronIcon isOpen={isDropdownOpen} size={14} className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                  </div>
                                  {isDropdownOpen && (
                                    <ul className="mt-2 ml-2 border-l-2 border-gray-100 dark:border-blue-3">
                                      {(challenge.challenges.challenge_type === 'diet' || challenge.challenges.challenge_type === 'diet_and_exercise') && (
                                        <li>
                                          <div
                                            className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                              isActiveRoute(`/${challenge.challenges.id}/diet`)
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                            onClick={() => {
                                              const today = new Date().toISOString().split('T')[0];
                                              router.push(`/${challenge.challenges.id}/diet?date=${today}`);
                                              closeSidebarOnMobile();
                                            }}
                                          >
                                            식단
                                          </div>
                                        </li>
                                      )}
                                      {(challenge.challenges.challenge_type === 'exercise' || challenge.challenges.challenge_type === 'diet_and_exercise') && (
                                        <li>
                                          <div
                                            className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                              isActiveRoute(`/${challenge.challenges.id}/workout`)
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                            onClick={() => {
                                              router.push(`/${challenge.challenges.id}/workout?refresh=${Date.now()}`);
                                              closeSidebarOnMobile();
                                            }}
                                          >
                                            운동
                                          </div>
                                        </li>
                                      )}
                                      {challenge.challenges.challenge_type === 'running' && (
                                        <li>
                                          <div
                                            className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                              isActiveRoute(`/${challenge.challenges.id}/running`)
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                            onClick={() => {
                                              router.push(`/${challenge.challenges.id}/running?refresh=${Date.now()}`);
                                              closeSidebarOnMobile();
                                            }}
                                          >
                                            운동
                                          </div>
                                        </li>
                                      )}
                                      <li>
                                        <div
                                          className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/members`)
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                              : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                          onClick={() => {
                                            router.push(`/${challenge.challenges.id}/members`);
                                            closeSidebarOnMobile();
                                          }}
                                        >
                                          멤버
                                        </div>
                                      </li>
                                      {challenge.challenges.enable_benchmark && (
                                        <li>
                                          <div
                                            className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                              isActiveRoute(`/${challenge.challenges.id}/benchmarks`)
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                            onClick={() => {
                                              router.push(`/${challenge.challenges.id}/benchmarks`);
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
                                            className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                              isActiveRoute(`/${challenge.challenges.id}/missions`)
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                            onClick={() => {
                                              router.push(`/${challenge.challenges.id}/missions`);
                                              closeSidebarOnMobile();
                                            }}
                                          >
                                            미션
                                          </div>
                                        </li>
                                      )}
                                      <li>
                                        <div
                                          className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/announcements`)
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                              : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                          onClick={() => {
                                            router.push(`/${challenge.challenges.id}/announcements`);
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

              {/* 운영 관리 메뉴 */}
              {hasOperationalAccess() && (
                <li id="admin-menu-section-mobile" className="w-full items-center justify-between text-sm font-semibold mb-2 mt-4">
                  <button
                    className="flex flex-row justify-between align-middle items-center cursor-pointer w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 min-h-[52px] transition-all px-2 py-3 active:bg-gray-100 dark:active:bg-gray-800"
                    onClick={handleAdminDropdown}
                    aria-expanded={isAdminDropdownOpen}
                    aria-controls="admin-menu-list-mobile"
                    aria-label="운영 관리 메뉴"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white text-[15px]">운영 관리</span>
                    <ChevronIcon isOpen={isAdminDropdownOpen} className="text-gray-400 dark:text-gray-500" />
                  </button>
                  {isAdminDropdownOpen && (
                    <ul id="admin-menu-list-mobile" className="font-medium text-gray-1 mt-3 flex flex-col gap-1" role="group" aria-label="운영 관리 목록">
                      <li>
                        <div
                          className={`cursor-pointer text-sm py-3 px-4 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                            isActiveRoute('/admin/create-challenge')
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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
                          className={`cursor-pointer text-sm py-3 px-4 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                            isActiveRoute('/admin/manage-challenges')
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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
                          className={`cursor-pointer text-sm py-3 px-4 rounded-lg transition-all min-h-[44px] flex items-center active:scale-[0.98] ${
                            isActiveRoute('/admin/manage-organizations')
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                          }`}
                          onClick={() => {
                            router.push('/admin/manage-organizations');
                            closeSidebarOnMobile();
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
          )}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 pb-4 px-4">
          <button
            onClick={() => {
              router.push('/settings');
              closeSidebarOnMobile();
            }}
            className={`flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-300 rounded-xl transition-all px-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 active:scale-[0.98] ${
              isActiveRoute('/settings') ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' : ''
            }`}
            aria-label="설정"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            설정
          </button>
          <div className="flex items-center gap-3 px-2 mt-4">
            <a href="https://www.instagram.com/fitculator.io" target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-600 dark:text-white dark:hover:text-gray-300 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="mailto:support@fitculator.io" className="text-gray-800 hover:text-gray-600 dark:text-white dark:hover:text-gray-300 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            </a>
          </div>
          <p className="text-0.875-500 text-gray-800 dark:text-white px-2 mt-2">© 2026 Fitculator</p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Skip navigation 링크 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        메인 콘텐츠로 건너뛰기
      </a>

      {/* 모바일 열린 사이드바 - Portal로 렌더링 */}
      {mounted && isMobile && isSidebarOpen && createPortal(mobileSidebarContent, document.body)}

      {/* 모바일 닫힌 상태 + 데스크톱 사이드바 */}
      {(!isMobile || !isSidebarOpen) && (
      <aside
        className={`
        ${isMobile && !isSidebarOpen ? 'w-full sticky top-0 z-[100]' : ''}
        ${!isMobile && !isSidebarOpen ? 'lg:w-[4rem] min-w-[4rem]' : ''}
        ${!isMobile && isSidebarOpen ? 'sm:min-w-[12rem] md:min-w-[14rem]' : ''}
        min-h-fit md:min-h-fit lg:min-h-screen lg:px-[1rem]
        bg-white dark:bg-gray-900 relative
        transition-all duration-300 ease-in-out
        ${!isMobile ? 'drop-shadow-sm' : ''}
        safe-area-inset-bottom
      `}
        style={!isMobile && isSidebarOpen ? { width: `${sidebarWidth}px` } : undefined}
        role="navigation"
        aria-label="주 내비게이션"
      >
      {/* 모바일 헤더 - 닫힌 상태 (상단 네비게이션 바) */}
      {isMobile && !isSidebarOpen && (
        <div className="flex items-center justify-between h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          {/* 햄버거 버튼 */}
          <button
            onClick={handleSidebarOpen}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
            aria-label="메뉴 열기"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gray-700 dark:text-gray-200">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* 사용자 정보 */}
          <button
            onClick={handleUserDropdown}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
            aria-label="사용자 메뉴"
            aria-expanded={userDropdown}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {(username || hookDisplayUsername || 'U').charAt(0).toUpperCase()}
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`text-gray-400 transition-transform duration-200 ${userDropdown ? 'rotate-180' : ''}`}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* 사용자 드롭다운 메뉴 */}
          {userDropdown && (
            <div className="absolute right-4 top-14 mt-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[9999] min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{username || hookDisplayUsername}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{session?.user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setEditUsernameModal(true);
                    setUserDropdown(false);
                  }}
                  disabled={adminDataLoading || !hasData}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  이름 수정
                </button>
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 데스크톱 헤더 */}
      {!isMobile && (
        <div className={`
          ${isSidebarOpen ? 'sticky top-0 z-[100]' : ''}
          ${isScrolled && isSidebarOpen ? 'shadow-md' : ''}
          bg-white dark:bg-gray-900 flex-shrink-0 transition-shadow duration-300
        `}>
          <div className={`flex justify-between items-center py-3 px-4 lg:py-[1.25rem] lg:px-0 lg:gap-[1rem] relative z-[100]`}>
            <Image
              src="/svg/logo_text_light.svg"
              width={120}
              height={30}
              alt="Fitculator 로고"
              className={`${isSidebarOpen ? 'block' : 'hidden'}`}
              loading="lazy"
            />
            <button
              onClick={handleSidebarOpen}
              className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] relative rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 transition-colors"
              aria-label={isSidebarOpen ? '메뉴 접기' : '메뉴 펼치기'}
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-[0.25rem]">
                <span className={`block w-full h-[2px] bg-gray-800 dark:bg-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
                <span className={`block w-full h-[2px] bg-gray-800 dark:bg-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-full h-[2px] bg-gray-800 dark:bg-white transition-all duration-300 ease-in-out ${isSidebarOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      )}
      {/* 데스크톱 사이드바 메뉴 (모바일 열린 상태는 Portal로 렌더링됨) */}
      {!isMobile && isSidebarOpen && (
        <div
          id="sidebar-menu-container"
          className="w-full flex flex-col z-50 flex-1"
          role="region"
          aria-label="메뉴 목록"
          onClick={(e) => e.stopPropagation()}
        >
          <nav className="w-full gap-[2rem] items-start py-2 px-3 lg:py-4 lg:px-2 flex-1" aria-label="챌린지 및 관리 메뉴">
            {/* 로딩 스켈레톤 - 데이터가 없을 때 */}
            {(!data || data.length === 0) && <SidebarSkeleton />}

            {/* 실제 메뉴 - 데이터가 있을 때 */}
            {data && data.length > 0 && (
            <ul>
              <li id="program-menu-section" className="w-full items-center justify-between text-sm font-semibold mb-2">
                <button
                  className="flex flex-row justify-between align-middle items-center cursor-pointer w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 min-h-[52px] transition-all border-b border-gray-200 dark:border-gray-700 py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
                  onClick={handleDropdown}
                  aria-expanded={isOpenDropdown}
                  aria-controls="program-menu-list"
                  aria-label="프로그램 메뉴"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-base">프로그램</span>
                  <ChevronIcon isOpen={isOpenDropdown} className="text-gray-400 dark:text-gray-500" />
                </button>

                {isOpenDropdown && (
                  <ul id="program-menu-list" className="font-medium text-gray-1 mt-3 flex flex-col gap-1" role="group" aria-label="프로그램 목록">
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
                                className={`cursor-pointer text-0.875-500 flex-1 ${
                                  challenge.challenges.id === selectedChallengeId
                                    ? 'text-blue-600 dark:text-blue-300'
                                    : 'text-gray-800 dark:text-white'
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
                              <div className={`font-medium py-2 px-3 rounded-lg flex justify-between items-center min-h-[48px] transition-colors ${
                                challenge.challenges.id === selectedChallengeId
                                  ? 'bg-blue-50 dark:bg-blue-900/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                              }`}>
                                <div
                                  className={`cursor-pointer text-sm font-medium flex-1 py-1 ${
                                    challenge.challenges.id === selectedChallengeId
                                      ? 'text-blue-600 dark:text-blue-300'
                                      : 'text-gray-800 dark:text-white'
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
                                  className="ml-2 hover:bg-gray-200 dark:hover:bg-gray-600 p-2.5 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 min-w-[40px] min-h-[40px] flex items-center justify-center"
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
                                <ul className="mt-1 ml-3 border-l-2 border-gray-200 dark:border-gray-600 space-y-0.5">
                                  {(challenge.challenges.challenge_type === 'diet' ||
                                    challenge.challenges.challenge_type === 'diet_and_exercise') && (
                                    <li>
                                      <div
                                        className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                                          isActiveRoute(`/${challenge.challenges.id}/diet`)
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                        }`}
                                        onClick={() => {
                                          const today = new Date()
                                            .toISOString()
                                            .split('T')[0];
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
                                  {(challenge.challenges.challenge_type === 'exercise' ||
                                    challenge.challenges.challenge_type === 'diet_and_exercise') && (
                                    <li>
                                      <div
                                        className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                                          isActiveRoute(`/${challenge.challenges.id}/workout`)
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                        }`}
                                        onClick={() => {
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
                                  {challenge.challenges.challenge_type === 'running' && (
                                    <li>
                                      <div
                                        className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                                          isActiveRoute(`/${challenge.challenges.id}/running`)
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                                        }`}
                                        onClick={() => {
                                          router.push(
                                            `/${challenge.challenges.id}/running?refresh=${Date.now()}`
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
                                      className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                                        isActiveRoute(`/${challenge.challenges.id}/members`)
                                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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
                                        className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                                          isActiveRoute(`/${challenge.challenges.id}/benchmarks`)
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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
                                        className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                                          isActiveRoute(`/${challenge.challenges.id}/missions`)
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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
                                      className={`cursor-pointer text-sm py-3 px-4 ml-2 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                                        isActiveRoute(`/${challenge.challenges.id}/announcements`)
                                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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
                          onClick={() => setIsOpenEndedDropdown(!isOpenEndedDropdown)}
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
                                    className={`cursor-pointer text-0.875-500 hover:bg-gray-100 dark:hover:text-black ${
                                      challenge.challenges.id === selectedChallengeId
                                        ? 'text-blue-600 dark:text-blue-300'
                                        : 'text-gray-800 dark:text-white'
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
                                    className="flex-shrink-0 hover:bg-gray-100 p-2 rounded transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
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
                                    {(challenge.challenges.challenge_type === 'diet' ||
                                      challenge.challenges.challenge_type === 'diet_and_exercise') && (
                                      <li>
                                        <div
                                          className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/diet`)
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                              : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
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
                                    {(challenge.challenges.challenge_type === 'exercise' ||
                                      challenge.challenges.challenge_type === 'diet_and_exercise') && (
                                      <li>
                                        <div
                                          className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/workout`)
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                              : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
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
                                    {challenge.challenges.challenge_type === 'running' && (
                                      <li>
                                        <div
                                          className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/running`)
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                              : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                          onClick={() => {
                                            router.push(
                                              `/${challenge.challenges.id}/running?refresh=${Date.now()}`
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
                                        className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                          isActiveRoute(`/${challenge.challenges.id}/members`)
                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                            : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
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
                                          className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/benchmarks`)
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                              : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
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
                                          className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                            isActiveRoute(`/${challenge.challenges.id}/missions`)
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                              : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
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
                                        className={`cursor-pointer text-0.875-500 py-2 px-8 rounded transition-colors duration-300 ${
                                          isActiveRoute(`/${challenge.challenges.id}/announcements`)
                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                            : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
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
                <li id="admin-menu-section" className="w-full items-center justify-between text-sm font-semibold mb-2 mt-4">
                  <button
                    className="flex flex-row justify-between align-middle items-center cursor-pointer w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 min-h-[52px] transition-all border-b border-gray-200 dark:border-gray-700 py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
                    onClick={handleAdminDropdown}
                    aria-expanded={isAdminDropdownOpen}
                    aria-controls="admin-menu-list"
                    aria-label="운영 관리 메뉴"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white text-base">운영 관리</span>
                    <ChevronIcon isOpen={isAdminDropdownOpen} className="text-gray-400 dark:text-gray-500" />
                  </button>

                  {isAdminDropdownOpen && (
                    <ul id="admin-menu-list" className="font-medium text-gray-1 mt-3 flex flex-col gap-1" role="group" aria-label="운영 관리 목록">
                      <li>
                        <div
                          className={`cursor-pointer text-sm py-3 px-4 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                            isActiveRoute('/admin/create-challenge')
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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
                          className={`cursor-pointer text-sm py-3 px-4 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                            isActiveRoute('/admin/manage-challenges')
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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
                          className={`cursor-pointer text-sm py-3 px-4 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center ${
                            isActiveRoute('/admin/manage-organizations')
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
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

          {/* Footer in Sidebar */}
          <div className="mt-auto pt-6 pb-4 px-2">
            {/* Settings Button */}
            <button
              onClick={() => {
                router.push('/settings');
                closeSidebarOnMobile();
              }}
              className={`flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-300 rounded-xl transition-all px-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 ${
                isActiveRoute('/settings') ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' : ''
              }`}
              aria-label="설정"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              설정
            </button>

            {/* Social Links & Copyright */}
            <div className="flex items-center gap-3 px-2 mt-8">
              <a
                href="https://www.instagram.com/fitculator.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-gray-600 dark:text-white dark:hover:text-gray-300 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="mailto:support@fitculator.io"
                className="text-gray-800 hover:text-gray-600 dark:text-white dark:hover:text-gray-300 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </a>
            </div>
            <p className="text-0.875-500 text-gray-800 dark:text-white px-2 mt-2">
              © 2026 Fitculator
            </p>
          </div>
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
      )}
    </>
  );
}
